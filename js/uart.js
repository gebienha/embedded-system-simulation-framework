/**
 * MIPS UART Interface Implementation (EDSim51-like)
 * Memory-mapped addresses:
 * - 0x10000040: Data register (read RX, write TX)
 * - 0x10000044: Status register
 * - 0x10000048: Control register
 */
class UART {
    constructor() {
        this.initializeDOM();
        this.setupEventListeners();
        this.initializeMemory();

        // Connect to memory system
        if (window.memorySystem) {
            window.memorySystem.connectUart(this);
        } else {
            console.error('Memory system not found. Load memory-content.js before uart.js');
        }
    }

    initializeDOM() {
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
    }

    setupEventListeners() {
        if (!this.txButton || !this.txInput || !this.clearButton) return;

        // Manual send button - simulates MIPS transmitting and loopback to RX
        this.txButton.addEventListener('click', () => {
            const message = this.txInput.value.trim();
            if (message) {
                // Simulate MIPS writing each character to UART (shows in TX)
                for (let char of message) {
                    this.transmitChar(char);
                }
                
                // Also simulate receiving it back (loopback for testing)
                setTimeout(() => {
                    this.receiveString(message);
                }, 200);
                
                this.txInput.value = '';
            }
        });

        this.txInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') this.txButton.click();
        });

        this.clearButton.addEventListener('click', () => {
            if (this.rxDisplay) this.rxDisplay.innerHTML = '';
            if (this.txDisplay) this.txDisplay.innerHTML = '';
        });
    }

    initializeMemory() {
        this.uartMemory = {
            0x10000040: 0x00,  // Data register
            0x10000044: 0x01,  // Status (TX Ready initially set)
            0x10000048: 0x00   // Control register
        };

        // Status register bit masks
        this.STATUS_TX_READY = 0x01;           // Bit 0: TX ready to send
        this.STATUS_RX_DATA_AVAILABLE = 0x02;  // Bit 1: RX data available
        this.STATUS_TX_BUSY = 0x04;            // Bit 2: TX busy (optional)
        this.STATUS_RX_BUSY = 0x08;            // Bit 3: RX busy (optional)
        
        // RX buffer for incoming characters
        this.rxBuffer = [];
    }

    /**
     * Read from UART memory - called by memory system
     */
    readUart(address) {
        if (!(address in this.uartMemory)) {
            console.log(`UART readUart: Unknown address 0x${address.toString(16)}`);
            return 0;
        }
        
        const value = this.uartMemory[address];
        console.log(`UART readUart: addr=0x${address.toString(16)}, value=0x${value.toString(16)}`);
        
        // Reading data register when RX data is available
        if (address === 0x10000040) {
            if (this.uartMemory[0x10000044] & this.STATUS_RX_DATA_AVAILABLE) {
                const data = this.uartMemory[address];
                
                // Clear RX data available flag after reading
                this.uartMemory[0x10000044] &= ~this.STATUS_RX_DATA_AVAILABLE;
                
                // Load next character from buffer if available
                if (this.rxBuffer.length > 0) {
                    const nextChar = this.rxBuffer.shift();
                    this.uartMemory[0x10000040] = nextChar.charCodeAt(0);
                    this.uartMemory[0x10000044] |= this.STATUS_RX_DATA_AVAILABLE;
                }
                
                return data;
            }
        }
        
        return value;
    }

    /**
     * Write to UART memory - called by memory system when MIPS writes
     */
    writeUart(address, value) {
        // Writing to data register = transmit character
        if (address === 0x10000040) {
            const char = String.fromCharCode(value & 0xFF);
            this.transmitChar(char);
            
            // EDSim51-like behavior: TX becomes ready immediately
            this.uartMemory[0x10000044] |= this.STATUS_TX_READY;
            this.uartMemory[0x10000044] &= ~this.STATUS_TX_BUSY;
            
            return true;
        } 
        // Writing to status or control registers
        else if (address === 0x10000044 || address === 0x10000048) {
            this.uartMemory[address] = value;
            return true;
        }
        
        return false;
    }

    /**
     * Transmit a character (MIPS -> External)
     * This is called when MIPS writes to the data register
     */
    transmitChar(char) {
        if (!this.txDisplay) return;
        
        const timestamp = new Date().toLocaleTimeString();
        this.txDisplay.innerHTML += `[${timestamp}] TX: ${this.escapeHtml(char)}\n`;
        this.txDisplay.scrollTop = this.txDisplay.scrollHeight;
        
        // Visual feedback
        this.txStatus.textContent = 'Transmitting...';
        this.txIndicator.classList.add('active');
        
        setTimeout(() => {
            this.txIndicator.classList.remove('active');
            this.txStatus.textContent = 'Ready';
        }, 100);
    }

    /**
     * Receive a character (External -> MIPS)
     * This simulates external data arriving at UART
     */
    receiveChar(char) {
        if (typeof char !== 'string' || char.length !== 1) return false;
        
        // Visual feedback first
        if (this.rxDisplay) {
            const timestamp = new Date().toLocaleTimeString();
            this.rxDisplay.innerHTML += `[${timestamp}] RX: ${this.escapeHtml(char)}\n`;
            this.rxDisplay.scrollTop = this.rxDisplay.scrollHeight;
        }
        
        this.rxIndicator.classList.add('active');
        this.rxStatus.textContent = 'Data Available';
        
        // If RX data is already available and not read, buffer it
        if (this.uartMemory[0x10000044] & this.STATUS_RX_DATA_AVAILABLE) {
            this.rxBuffer.push(char);
            setTimeout(() => {
                this.rxIndicator.classList.remove('active');
            }, 300);
            return true;
        }
        
        // Store character in data register
        this.uartMemory[0x10000040] = char.charCodeAt(0);
        this.uartMemory[0x10000044] |= this.STATUS_RX_DATA_AVAILABLE;
        
        setTimeout(() => {
            this.rxIndicator.classList.remove('active');
            if (!(this.uartMemory[0x10000044] & this.STATUS_RX_DATA_AVAILABLE)) {
                this.rxStatus.textContent = 'Idle';
            }
        }, 300);
        
        return true;
    }

    /**
     * Receive a string of characters with timing
     */
    receiveString(str) {
        if (!str) return;
        
        let index = 0;
        const sendNextChar = () => {
            if (index < str.length) {
                this.receiveChar(str[index]);
                index++;
                setTimeout(sendNextChar, 100); // 100ms between characters
            }
        };
        
        sendNextChar();
    }

    /**
     * Status check methods for MIPS code
     */
    isTxReady() {
        return (this.uartMemory[0x10000044] & this.STATUS_TX_READY) !== 0;
    }

    isRxDataAvailable() {
        return (this.uartMemory[0x10000044] & this.STATUS_RX_DATA_AVAILABLE) !== 0;
    }

    /**
     * Escape HTML for safe display
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
            '\n': '\\n',
            '\r': '\\r',
            '\t': '\\t'
        };
        return text.replace(/[&<>"'\n\r\t]/g, m => map[m]);
    }
}

// Create and initialize UART instance
const uart = new UART();

// Send welcome message after initialization
setTimeout(() => {
    uart.receiveString("UART Ready!");
}, 2000);

// Expose UART interface globally
window.uartInterface = {
    readUart: addr => uart.readUart(addr),
    writeUart: (addr, val) => uart.writeUart(addr, val),
    receiveChar: c => uart.receiveChar(c),
    receiveString: s => uart.receiveString(s),
    isTxReady: () => uart.isTxReady(),
    isRxDataAvailable: () => uart.isRxDataAvailable()
};