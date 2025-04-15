#include <iostream>
#include <vector>
#include "mem.cpp"

std::vector<uint8_t> led_display(256, 0);

void update_led_display(mem_addr addr, reg_word value) {
    int index = addr - 0xB0000000;
    led_display[index] = value;
    std::cout << "LED Display Updated: Address " << index << " = " << (int)value << std::endl;
}

reg_word get_led_display_state(mem_addr addr) {
    int index = addr - 0xB0000000;
    return led_display[index];
}