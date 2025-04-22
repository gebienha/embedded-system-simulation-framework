#ifndef LED_DISPLAY_H
#define LED_DISPLAY_H

#include "spim.h"
#include "reg.h"

// LED memory-mapped I/O constants
#define LED_BASE_ADDR 0xFFFF0090
#define MM_IO_BOT    0xFFFF0000    // Bottom of memory-mapped IO
#define MM_IO_TOP    0xFFFF00FF    // Top of memory-mapped IO

void update_led_display(mem_addr addr, reg_word value);
reg_word get_led_display_state(mem_addr addr);

#endif // LED_DISPLAY_H