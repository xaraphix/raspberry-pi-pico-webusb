#include "bsp/board_api.h"
#include "class/cdc/cdc_device.h"
#include "class/vendor/vendor_device.h"
#include "pico/cyw43_arch.h"
#include "pico/stdlib.h"
#include "tusb.h"
#include "usb_descriptors.h"
#include <limits>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/*
Blink pattern
in ms
 */
enum {
  BLINK_NOT_MOUNTED = 250,
  BLINK_MOUNTED = 1000,
  BLINK_SUSPENDED = 2500,

  BLINK_ALWAYS_ON = UINT32_MAX,
  BLINK_ALWAYS_OFF = 0,

};

static int8_t audiobuffer[64] = {
    -125, -123, -120, -117, -114, -110, -106, -101, -96,  -91,  -78,  -72, -65,
    -58,  -43,  -36,  -20,  -12,  3,    12,   28,   35,   51,   58,   78,  85,
    101,  106,  114,  123,  125,  127,  127,  127,  127,  124,  119,  113, 104,
    99,   83,   76,   63,   56,   41,   33,   17,   9,    -14,  -22,  -38, -46,
    -60,  -67,  -81,  -87,  -103, -107, -115, -125, -127, -127, -127, -126};

static uint32_t blink_interval_ms = BLINK_NOT_MOUNTED;
static uint32_t IS_SINE = 0;
static double phase = 0.0;
static float m_time = 0.0;
static uint8_t WEB_USB = 3;
static uint8_t HTTP = 0;
static bool web_serial_connected = false;

#define URL "localhost:5173"

const tusb_desc_webusb_url_t desc_url = {.bLength = 3 + sizeof(URL) - 1,
                                         .bDescriptorType = WEB_USB,
                                         .bScheme = HTTP,
                                         .url = URL};

void led_blinking_task(void);
void cdc_task(void);
void webserial_task(void);

int main(void) {

  stdio_init_all();
  if (cyw43_arch_init()) {
    return -1;
  }

  board_init();

  tud_init(BOARD_TUD_RHPORT);

  if (board_init_after_tusb) {
    board_init_after_tusb();
  }

  while (1) {
    tud_task();

    webserial_task();
    led_blinking_task();
  }
}

void tud_mount_cb(void) { blink_interval_ms = BLINK_MOUNTED; }

void tud_umount_cb(void) { blink_interval_ms = BLINK_NOT_MOUNTED; }

void tud_suspend_cb(bool remote_wakeup_en) {
  (void)remote_wakeup_en;
  blink_interval_ms = BLINK_SUSPENDED;
}

void tud_resume_cb(void) {
  blink_interval_ms = tud_mounted() ? BLINK_MOUNTED : BLINK_NOT_MOUNTED;
}

bool tud_vendor_control_xfer_cb(uint8_t rhport, uint8_t stage,
                                tusb_control_request_t const *request) {

  if (stage != CONTROL_STAGE_SETUP)
    return true;

  switch (request->bmRequestType_bit.type) {
  case TUSB_REQ_TYPE_VENDOR:
    switch (request->bRequest) {
    case VENDOR_REQUEST_WEBUSB:

      return tud_control_xfer(rhport, request, (void *)(uintptr_t)&desc_url,
                              desc_url.bLength);

    case VENDOR_REQUEST_MICROSOFT:
      if (request->wIndex == 7) {

        uint16_t total_len;
        memcpy(&total_len, desc_ms_os_20 + 8, 2);

        return tud_control_xfer(rhport, request,
                                (void *)(uintptr_t)desc_ms_os_20, total_len);
      } else {
        return false;
      }

    default:
      break;
    }
    break;

  case TUSB_REQ_TYPE_CLASS:
    if (request->bRequest == 0x22) {
      web_serial_connected = (request->wValue != 0);

      if (web_serial_connected) {
        board_led_write(true);
        blink_interval_ms = BLINK_ALWAYS_ON;
      } else {
        blink_interval_ms = BLINK_MOUNTED;
      }

      return tud_control_status(rhport, request);
    }
    break;

  default:
    break;
  }

  return false;
}

void webserial_task(void) {
  if (web_serial_connected) {
    tud_vendor_write(audiobuffer, 64);
    tud_vendor_write_flush();
  }
}

void led_blinking_task(void) {

  static uint32_t start_ms = 0;
  static bool led_state = false;

  if (board_millis() - start_ms < blink_interval_ms)
    return;

  start_ms += blink_interval_ms;

  cyw43_arch_gpio_put(CYW43_WL_GPIO_LED_PIN, led_state);
  led_state = 1 - led_state;
}
