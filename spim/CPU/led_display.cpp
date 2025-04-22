#include <iostream>
#include "spim.h"
#include "reg.h"
#include "led_display.h"

static uint8_t led_state = 0;

void update_led_display(mem_addr addr, reg_word value) {
    if (addr != LED_BASE_ADDR) {
        std::cerr << "Invalid LED address access: 0x" << std::hex << addr << std::endl;
        return;
    }

    led_state = value & 0xFF;
    std::cout << "LED State: ";
    for (int i = 7; i >= 0; i--) {
        bool isOn = (led_state & (1 << i)) != 0;
        std::cout << (isOn ? "●" : "○") << " ";
    }
    std::cout << " [0x" << std::hex << static_cast<int>(led_state) << "]" << std::endl;
}

reg_word get_led_display_state(mem_addr addr) {
    if (addr != LED_BASE_ADDR) {
        return 0;
    }
    return static_cast<reg_word>(led_state);
}