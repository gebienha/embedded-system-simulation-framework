.data
LED_ADDRESS:    .word 0x10000030    # Memory-mapped address for LED control
DELAY_COUNT:    .word 10      # Delay counter for visibility
hex_values: .word 0x3F, 0x06, 0x5B, 0x4F, 0x66, 0x6D, 0x7D, 0x07, 0x7F, 0x6F
.text
.globl main

main:
	# Initialize the 7-segment display with the pattern for digits 0, 1, 2, 3
    la $t0, hex_values      # Load the address of hex_values (7-segment patterns)
    li $t1, 0x10000020      # Starting address for 7-segment displays
    
    # Display digits 0, 1, 2, 3 on the 7-segment display
    lw $t2, 0($t0)          # Load 7-segment pattern for digit 0
    sw $t2, 0($t1)          # Store pattern at 0x10000000 (leftmost display)
    lw $t2, 4($t0)          # Load 7-segment pattern for digit 1
    sw $t2, 4($t1)          # Store pattern at 0x10000004
    lw $t2, 8($t0)          # Load 7-segment pattern for digit 2
    sw $t2, 8($t1)          # Store pattern at 0x10000008
    lw $t2, 12($t0)         # Load 7-segment pattern for digit 3
    sw $t2, 12($t1)         # Store pattern at 0x1000000C
	
    # Load the LED address into $t0
    lw $t0, LED_ADDRESS

    # Light up each LED individually (assuming 8 LEDs)
    li $t1, 1                      # Start with first LED (00000001)
    jal display_and_delay

    li $t1, 2                      # Second LED (00000010)
    jal display_and_delay

    li $t1, 4                      # Third LED (00000100)
    jal display_and_delay

    li $t1, 8                      # Fourth LED (00001000)
    jal display_and_delay

    li $t1, 16                     # Fifth LED (00010000)
    jal display_and_delay

    li $t1, 32                     # Sixth LED (00100000)
    jal display_and_delay

    li $t1, 64                     # Seventh LED (01000000)
    jal display_and_delay

    li $t1, 128                    # Eighth LED (10000000)
    jal display_and_delay

    # Light up all LEDs
    li $t1, 255                    # All LEDs on (11111111)
    jal display_and_delay

    # Turn off all LEDs
    li $t1, 0                      # All LEDs off (00000000)
    jal display_and_delay

    # Light up all LEDs again
    li $t1, 255                    # All LEDs on again
    jal display_and_delay

    # Exit program
    li $v0, 10                     # System call code for exit
    syscall

# Subroutine to display LED pattern and delay
display_and_delay:
    # Save return address
    addi $sp, $sp, -4
    sw $ra, 0($sp)

    # Display the LED pattern
    sw $t1, 0($t0)

    # Delay loop
    lw $t2, DELAY_COUNT
delay_loop:
    addi $t2, $t2, -1
    bnez $t2, delay_loop

    # Restore return address
    lw $ra, 0($sp)
    addi $sp, $sp, 4
    jr $ra  