.data
    hex_digits: .word 0x3F, 0x06, 0x5B, 0x4F, 0x66, 0x6D, 0x7D, 0x07, 0x7F, 0x6F
    blank_digit: .word 0x00  # Blank pattern for the 7-segment display

.text
.globl main
main:
    la $t0, hex_digits  # Load address of hex digits array

loop:
    # Display digits 0, 1, 2, 3
    lw $t1, 0($t0)      # Load digit '0'
    li $t2, 0x10000020   # Leftmost display
    sw $t1, 0($t2)       # Store it in the leftmost display

    lw $t1, 4($t0)      # Load digit '1'
    li $t2, 0x10000024  # Middle-left display
    sw $t1, 0($t2)      # Store it in the middle-left display

    lw $t1, 8($t0)      # Load digit '2'
    li $t2, 0x10000028  # Middle-right display
    sw $t1, 0($t2)      # Store it in the middle-right display

    lw $t1, 12($t0)     # Load digit '3'
    li $t2, 0x1000002C  # Rightmost display
    sw $t1, 0($t2)      # Store it in the rightmost display

    # Wait for a bit (optional, depends on your simulator's behavior)
    # Insert a delay or waiting mechanism here if needed

    # Blank the displays
    li $t1, 0x00        # Load blank digit pattern
    li $t2, 0x10000020   # Leftmost display
    sw $t1, 0($t2)       # Store blank in the leftmost display

    li $t2, 0x10000024  # Middle-left display
    sw $t1, 0($t2)       # Store blank in the middle-left display

    li $t2, 0x10000028  # Middle-right display
    sw $t1, 0($t2)       # Store blank in the middle-right display

    li $t2, 0x1000002C  # Rightmost display
    sw $t1, 0($t2)       # Store blank in the rightmost display

    # Wait before starting the next cycle
    # You can insert a delay here again if necessary

    j loop  # Jump back to loop to repeat the sequence
