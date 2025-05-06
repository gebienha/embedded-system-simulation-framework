// uart.js
/**
 * MIPS UART Interface Implementation
 * Memory-mapped addresses:
 * - 0x10000040: Data register
 * - 0x10000044: Status register
 * - 0x10000048: Control register
 */
class UART {
    constructor() {
        this.initializeDOM();
        this.setupEventListeners();
        this.initializeMemory();
        
        // Connect to the memory system if it exists
        if (window.memorySystem) {
            window.memorySystem.connectUart(this);
        } else {
            console.error('Memory system not found. Make sure to load memory-content.js before uart.js');
        }
    }

    // Initialize DOM references
    initializeDOM() {
        // UART Display elements
        this.txDisplay = document.getElementById('uart-tx-display');
        this.rxDisplay = document.getElementById('uart-rx-display');
        this.txInput = document.getElementById('uart-tx-input');
        this.txButton = document.getElementById('uart-tx-button');
        this.clearButton = document.getElementById('uart-clear-button');
        this.txIndicator = document.getElementById('tx-indicator');
        this.rxIndicator = document.getElementById('rx-indicator');
        this.txStatus = document.getElementById('tx-status');
        this.rxStatus = document.getElementById('rx-status');
        this.baudSelector = document.getElementById('uart-baud-rate');

        // Initialize displays if they don't exist
        if (!this.txDisplay) {
            console.error('UART DOM elements not found. Make sure to include the UART UI in your HTML.');
        }
    }

    // Setup event listeners for UI elements
    setupEventListeners() {
        if (!this.txButton || !this.txInput || !this.clearButton) return;

        // Send button click handler
        this.txButton.addEventListener('click', () => {
            const message = this.txInput.value.trim();
            if (message) {
                this.simulateSend(message);
            }
        });

        // Enter key press handler
        this.txInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.txButton.click();
            }
        });

        // Clear button handler
        this.clearButton.addEventListener('click', () => {
            this.rxDisplay.innerHTML = '';
            this.txDisplay.innerHTML = '';
        });
    }

    // Initialize UART memory registers
    initializeMemory() {
        this.uartMemory = {
            0x10000040: 0x00,  // Data register
            0x10000044: 0x01,  // Status register (TX Ready bit set)
            0x10000048: 0x00   // Control register
        };

        // Status register bit definitions
        this.STATUS_TX_READY = 0x01;       // Bit 0: TX Ready
        this.STATUS_RX_DATA_AVAILABLE = 0x02;  // Bit 1: RX Data Available
        this.STATUS_TX_BUSY = 0x04;        // Bit 2: TX Busy
        this.STATUS_RX_BUSY = 0x08;        // Bit 3: RX Busy
        this.STATUS_TX_ERROR = 0x10;       // Bit 4: TX Error
        this.STATUS_RX_ERROR = 0x20;       // Bit 5: RX Error
        this.STATUS_RX_OVERFLOW = 0x40;    // Bit 6: RX Buffer Overflow
    }

    // Send a message from the UI
    simulateSend(message) {
        if (!this.txDisplay) return;

        // Update TX status
        this.txStatus.textContent = 'Transmitting...';
        this.txIndicator.classList.add('active');
        
        // Add to TX display
        const timestamp = new Date().toLocaleTimeString();
        this.txDisplay.innerHTML += `[${timestamp}] TX: ${message}\n`;
        this.txDisplay.scrollTop = this.txDisplay.scrollHeight;
        
        // Clear input
        this.txInput.value = '';
        
        // Simulate echo back after a delay (like a loopback)
        setTimeout(() => {
            // Update RX indicators
            this.rxIndicator.classList.add('active');
            this.rxStatus.textContent = 'Receiving...';
            
            setTimeout(() => {
                // Add to RX display
                const rxTimestamp = new Date().toLocaleTimeString();
                this.rxDisplay.innerHTML += `[${rxTimestamp}] RX: ${message}\n`;
                this.rxDisplay.scrollTop = this.rxDisplay.scrollHeight;
                
                // Reset RX status
                this.rxIndicator.classList.remove('active');
                this.rxStatus.textContent = 'Idle';
            }, 300);
            
            // Reset TX status
            this.txIndicator.classList.remove('active');
            this.txStatus.textContent = 'Ready';
        }, 500);
    }

    // Read from UART registers - Called by the MIPS simulator
    readUart(address) {
        if (address in this.uartMemory) {
            // If reading data register when data is available, clear the RX_DATA_AVAILABLE flag
            if (address === 0x10000040 && (this.uartMemory[0x10000044] & this.STATUS_RX_DATA_AVAILABLE)) {
                this.uartMemory[0x10000044] &= ~this.STATUS_RX_DATA_AVAILABLE;
            }
            return this.uartMemory[address];
        }
        return 0;
    }
    
    // Write to UART registers - Called by the MIPS simulator
    writeUart(address, value) {
        if (address === 0x10000040) {
            // Data register - transmit character
            const char = String.fromCharCode(value);
            
            // Set TX busy, clear TX ready
            this.uartMemory[0x10000044] &= ~this.STATUS_TX_READY;
            this.uartMemory[0x10000044] |= this.STATUS_TX_BUSY;
            
            // Display the transmitted character if UI exists
            if (this.txDisplay) {
                const timestamp = new Date().toLocaleTimeString();
                this.txDisplay.innerHTML += `[${timestamp}] TX: ${char}\n`;
                this.txDisplay.scrollTop = this.txDisplay.scrollHeight;
                
                // Update visual indicators
                if (this.txIndicator && this.txStatus) {
                    this.txIndicator.classList.add('active');
                    this.txStatus.textContent = 'Transmitting...';
                }
            }
            
            // Simulate transmission time based on baud rate
            const baudRate = this.baudSelector ? 
                parseInt(this.baudSelector.value) : 9600;
            const charTime = Math.floor(10000 / baudRate * 1000); // 10 bits per char
            
            // Simulate transmission completion after appropriate delay
            setTimeout(() => {
                // Transmission complete - set TX ready, clear TX busy
                this.uartMemory[0x10000044] &= ~this.STATUS_TX_BUSY;
                this.uartMemory[0x10000044] |= this.STATUS_TX_READY;
                
                // Update indicators if UI exists
                if (this.txIndicator && this.txStatus) {
                    this.txIndicator.classList.remove('active');
                    this.txStatus.textContent = 'Ready';
                }
            }, charTime);
            
            return true;
        } else if (address === 0x10000044 || address === 0x10000048) {
            // Status or control register
            this.uartMemory[address] = value;
            return true;
        }
        return false;
    }
    
    // Simulate receiving a character - For external inputs
    receiveChar(char) {
        if (typeof char !== 'string' || char.length !== 1) {
            return false;
        }
        
        // Don't receive if RX is busy
        if (this.uartMemory[0x10000044] & this.STATUS_RX_BUSY) {
            return false;
        }
        
        // Set RX busy
        this.uartMemory[0x10000044] |= this.STATUS_RX_BUSY;
        
        // Store received byte in data register and set data available flag
        this.uartMemory[0x10000040] = char.charCodeAt(0);
        this.uartMemory[0x10000044] |= this.STATUS_RX_DATA_AVAILABLE;
        
        // Display received character if UI exists
        if (this.rxDisplay) {
            const timestamp = new Date().toLocaleTimeString();
            this.rxDisplay.innerHTML += `[${timestamp}] RX: ${char}\n`;
            this.rxDisplay.scrollTop = this.rxDisplay.scrollHeight;
            
            // Update visual indicators
            if (this.rxIndicator && this.rxStatus) {
                this.rxIndicator.classList.add('active'); 
                this.rxStatus.textContent = 'Receiving...';
                
                // Reset RX busy after a delay
                setTimeout(() => {
                    this.uartMemory[0x10000044] &= ~this.STATUS_RX_BUSY;
                    this.rxIndicator.classList.remove('active');
                    this.rxStatus.textContent = 'Idle';
                }, 300);
            }
        } else {
            // If no UI, just clear the busy flag after a short delay
            setTimeout(() => {
                this.uartMemory[0x10000044] &= ~this.STATUS_RX_BUSY;
            }, 100);
        }
        
        return true;
    }
    
    // Simulate receiving a string with delay between characters
    receiveString(str) {
        if (!str) return;
        
        let index = 0;
        
        const sendNextChar = () => {
            if (index < str.length) {
                // Only proceed if UART is not busy
                if (!(this.uartMemory[0x10000044] & this.STATUS_RX_BUSY)) {
                    const success = this.receiveChar(str[index]);
                    index++;
                }
                
                // Schedule next character check
                setTimeout(sendNextChar, 50);
            }
        };
        
        // Start the process
        sendNextChar();
    }
    
    
    receiveString(str) {
        if (!str) return;
        
        // Send first character immediately
        this.receiveChar(str[0]);
        
        // For subsequent characters, wait for UART to be ready
        let index = 1;
        
        const sendNextChar = () => {
            if (index < str.length) {
                // Check if UART is ready (not busy)
                if (!(this.uartMemory[0x10000044] & this.STATUS_RX_BUSY)) {
                    this.receiveChar(str[index]);
                    index++;
                }
                
                // Schedule next check
                setTimeout(sendNextChar, 50);
            }
        };
        
        // Start sending the rest after a short delay
        setTimeout(sendNextChar, 100);
    }
    
    // Check if UART is ready to send
    isTxReady() {
        return (this.uartMemory[0x10000044] & this.STATUS_TX_READY) !== 0;
    }
    
    // Check if there's data available to read
    isRxDataAvailable() {
        return (this.uartMemory[0x10000044] & this.STATUS_RX_DATA_AVAILABLE) !== 0;
    }
}

// Create UART instance
const uart = new UART();

// Initialize with a welcome message
setTimeout(() => {
    uart.receiveString("MIPS UART Ready!");
}, 2000);

// Expose UART interface to the global scope for the MIPS simulator
window.uartInterface = {
    readUart: (address) => uart.readUart(address),
    writeUart: (address, value) => uart.writeUart(address, value),
    receiveChar: (char) => uart.receiveChar(char),
    receiveString: (str) => uart.receiveString(str),
    isTxReady: () => uart.isTxReady(),
    isRxDataAvailable: () => uart.isRxDataAvailable()
};

// UART Debug Helper
// This script will help you debug your UART implementation

/**
 * Function to inspect the UART status register
 * This should be run in your JavaScript console
 */
function debugUartStatus() {
    if (!window.uartInterface) {
        console.error("UART interface not found!");
        return;
    }
    
    // Read UART status register
    const statusReg = window.uartInterface.readUart(0x10000044);
    
    console.log("=== UART Status Register Debug ===");
    console.log(`Raw value: 0x${statusReg.toString(16).padStart(2, '0')}`);
    console.log(`TX Ready: ${(statusReg & 0x01) ? "YES" : "NO"}`);
    console.log(`RX Data Available: ${(statusReg & 0x02) ? "YES" : "NO"}`);
    console.log(`TX Busy: ${(statusReg & 0x04) ? "YES" : "NO"}`);
    console.log(`RX Busy: ${(statusReg & 0x08) ? "YES" : "NO"}`);
    console.log(`TX Error: ${(statusReg & 0x10) ? "YES" : "NO"}`);
    console.log(`RX Error: ${(statusReg & 0x20) ? "YES" : "NO"}`);
    console.log(`RX Overflow: ${(statusReg & 0x40) ? "YES" : "NO"}`);
    
    return statusReg;
}

/**
 * Function to fix the TX Ready flag if it's stuck off
 */
function fixTxReady() {
    if (!window.uartInterface) {
        console.error("UART interface not found!");
        return;
    }
    
    // Read current status
    let statusReg = window.uartInterface.readUart(0x10000044);
    console.log(`Before: Status = 0x${statusReg.toString(16).padStart(2, '0')}`);
    
    // Set the TX Ready bit (bit 0)
    statusReg |= 0x01;
    
    // Write back
    const result = window.uartInterface.writeUart(0x10000044, statusReg);
    console.log(`Fixed TX Ready bit. Result: ${result}`);
    
    // Verify
    statusReg = window.uartInterface.readUart(0x10000044);
    console.log(`After: Status = 0x${statusReg.toString(16).padStart(2, '0')}`);
    
    return statusReg;
}

/**
 * Function to send a string without relying on the TX Ready flag
 */
function forceSendString(str) {
    if (!window.uartInterface) {
        console.error("UART interface not found!");
        return;
    }
    
    console.log(`Forcing send of string: "${str}"`);
    
    // Convert string to character array
    const chars = str.split('');
    
    // Send each character with a delay
    let i = 0;
    const intervalId = setInterval(() => {
        if (i < chars.length) {
            const charCode = chars[i].charCodeAt(0);
            const result = window.uartInterface.writeUart(0x10000040, charCode);
            console.log(`Sent '${chars[i]}' (${charCode}): ${result ? "OK" : "FAILED"}`);
            i++;
        } else {
            clearInterval(intervalId);
            console.log("String transmission complete");
        }
    }, 100);
}

/**
 * Function to test TX Ready flag behavior
 */
function testTxReadyBehavior() {
    if (!window.uartInterface) {
        console.error("UART interface not found!");
        return;
    }
    
    console.log("Testing TX Ready flag behavior...");
    
    // Read initial status
    let status = window.uartInterface.readUart(0x10000044);
    console.log(`Initial status: 0x${status.toString(16).padStart(2, '0')}`);
    
    // Send a character
    console.log("Sending character 'X'...");
    window.uartInterface.writeUart(0x10000040, 'X'.charCodeAt(0));
    
    // Read status immediately after
    status = window.uartInterface.readUart(0x10000044);
    console.log(`Status after send: 0x${status.toString(16).padStart(2, '0')}`);
    
    // Check TX Ready flag
    console.log(`TX Ready immediately after: ${(status & 0x01) ? "YES" : "NO"}`);
    
    // Wait a bit and check again
    setTimeout(() => {
        status = window.uartInterface.readUart(0x10000044);
        console.log(`Status after 500ms: 0x${status.toString(16).padStart(2, '0')}`);
        console.log(`TX Ready after delay: ${(status & 0x01) ? "YES" : "NO"}`);
    }, 500);
}

/**
 * Function to directly inspect the UART internal memory
 */
function inspectUartMemory() {
    if (!uart) {
        console.error("UART object not found!");
        return;
    }
    
    console.log("=== UART Memory Inspection ===");
    console.log(uart.uartMemory);
    
    return uart.uartMemory;
}

/**
 * Patch UART to ensure TX Ready is always set
 */
function patchUartForTxReady() {
    if (!uart) {
        console.error("UART object not found!");
        return;
    }
    
    console.log("Patching UART to fix TX Ready flag...");
    
    // Save original writeUart function
    const originalWriteUart = uart.writeUart;
    
    // Replace with patched version
    uart.writeUart = function(address, value) {
        // Call original function
        const result = originalWriteUart.call(this, address, value);
        
        // Ensure TX Ready is set (after a very brief delay)
        if (address === 0x10000040) {  // If writing to data register
            setTimeout(() => {
                this.uartMemory[0x10000044] |= 0x01;  // Force TX Ready bit on
            }, 10);
        }
        
        return result;
    };
    
    // Ensure TX Ready is set initially
    uart.uartMemory[0x10000044] |= 0x01;
    
    console.log("UART patched. TX Ready should now be maintained.");
}

// Export functions to global scope for easy use in console
window.debugUartStatus = debugUartStatus;
window.fixTxReady = fixTxReady;
window.forceSendString = forceSendString;
window.testTxReadyBehavior = testTxReadyBehavior;
window.inspectUartMemory = inspectUartMemory;
window.patchUartForTxReady = patchUartForTxReady;

// Run initial debug
console.log("UART Debug Helper loaded. Use the following functions:");
console.log("  debugUartStatus() - Check status register values");
console.log("  fixTxReady() - Fix TX Ready flag if it's stuck");
console.log("  forceSendString('your message') - Send string without waiting for TX Ready");
console.log("  testTxReadyBehavior() - Test how TX Ready flag changes");
console.log("  inspectUartMemory() - Directly inspect UART memory registers");
console.log("  patchUartForTxReady() - Apply a patch to ensure TX Ready works");

// Initial status check
debugUartStatus();