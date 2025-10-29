# uart_test.s
#
# A program to test the UART functionality in the MIPS simulator.
# It first sends a string to the UART, then enters an echo loop.

.data
# UART memory-mapped addresses
UART_DATA_ADDR:   .word 0x10000040
UART_STATUS_ADDR: .word 0x10000044

# String to be transmitted
message: .asciiz "Hello UART!\n"

.text
.globl main

main:
    # --- Transmit the initial message ---
    la $t0, message         # Load base address of the message
    lw $t1, UART_DATA_ADDR   # Load UART data register address
    lw $t2, UART_STATUS_ADDR # Load UART status register address

send_loop:
    lb $a0, 0($t0)          # Load a byte from the message
    beq $a0, $zero, echo_loop # If it's the null terminator, go to echo loop

wait_tx_ready:
    lw $t3, 0($t2)          # Read UART status register
    andi $t3, $t3, 0x01     # Check the TX Ready bit (bit 0)
    beq $t3, $zero, wait_tx_ready # If not ready, wait

    # TX is ready, send the character
    sb $a0, 0($t1)          # Write the character to the UART data register
    addi $t0, $t0, 1        # Move to the next character in the string
    j send_loop

echo_loop:
    # --- Wait for a character and echo it back ---
wait_rx_ready:
    lw $t3, 0($t2)          # Read UART status register
    andi $t3, $t3, 0x02     # Check the RX Data Available bit (bit 1)
    beq $t3, $zero, wait_rx_ready # If no data, wait

    # RX has data, read the character
    lb $a0, 0($t1)          # Read the character from the UART data register

    # Now, wait for TX to be ready again to echo the character
wait_tx_echo:
    lw $t3, 0($t2)          # Read UART status register
    andi $t3, $t3, 0x01     # Check the TX Ready bit
    beq $t3, $zero, wait_tx_echo # If not ready, wait

    # Send the character back
    sb $a0, 0($t1)          # Write the character to the UART data register

    # Loop forever to echo more characters
    j echo_loop

# --- Exit the program (optional, as the echo loop is infinite) ---
# To exit, you might need to halt the simulator manually.
# If you wanted a clean exit, you could check for a specific character.
exit:
    li $v0, 10
    syscall