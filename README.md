## Installation steps

```bash
export PICO_SDK_PATH=<PATH TO YOUR PICO SDK>
# For example export PICO_SDK_PATH=/playground/pico/pico-sdk/
# Don't forget to initialize pico sdk and tinyusb submodules

# This is a copy of <PICO_SDK_PATH>/external/pico_sdk_import.cmake
cd backend
# Copy new <PICO_SDK_PATH>/external/pico_sdk_import.cmake if required
mkdir build
cd build
cmake -DFAMILY=rp2040  -DPICO_BOARD=pico_w ..
make

# Copy the usbtest.uf32 file to pico
cp usbtest.uf2 <PATH_TO_PICO>

# To check on USB Serial output use minicom if not linux. Figure out the tty for the USB device, it could be something else than ttyACM0
sudo minicom -b 11520 -o -D /dev/ttyACM0

```

Add udev rule for current linux user for USB driver operations
File: /etc/udev/rules.d/99-my-usb-device.rules
```bash
SUBSYSTEM=="usb", ATTRS{idVendor}=="cafe", ATTRS{idProduct}=="4011", MODE="0666", OWNER="<USER_NAME>"
```

Then run udevadm to apply the rules:
```bash
sudo udevadm control --reload-rules
sudo udevadm trigger
```

