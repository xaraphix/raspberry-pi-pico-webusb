cmake_minimum_required(VERSION 3.13)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
#set(TINYUSB_DEBUG_LEVEL 2)
set(CMAKE_CXX_STANDARD 14)
include(pico_sdk_import.cmake)

include(${PICO_SDK_PATH}/lib/tinyusb/hw/bsp/family_support.cmake)
project(pico_webusb_audio_project)

family_initialize_project(pico_webusb_audio ${CMAKE_CURRENT_LIST_DIR})

add_executable(pico_webusb_audio
	main.cc
	usb_descriptors.cc
)


target_include_directories(pico_webusb_audio PRIVATE ${CMAKE_CURRENT_LIST_DIR})

target_link_libraries(pico_webusb_audio PRIVATE pico_stdlib 
pico_cyw43_arch_none     # we need Wifi to access the GPIO, but we don't need anything else
tinyusb_device tinyusb_board)
pico_add_extra_outputs(pico_webusb_audio)
