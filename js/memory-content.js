// memory-content.js
class MemoryLine {
    constructor(startAddress, parent) {
        this.wordList = [];
        for (let address = startAddress; address < startAddress + 0x10; address += 4)
            this.wordList.push(new MemoryWord(address, parent));

        this.element = document.createElement('span');
        this.element.innerHTML = `[<span class='hljs-attr'>${startAddress.toString(16)}</span>]`;

        this.wordList.forEach(e => {
            this.element.appendChild(e.valueElement);
            this.element.appendChild(document.createTextNode(' '));
        });
        this.wordList.forEach(e => this.element.appendChild(e.stringElement));
        this.element.appendChild(document.createTextNode('\n'));
    }

    updateValues() {
        this.wordList.forEach(e => e.updateValue());
    }
}

class MemoryWord {
    constructor(address, parent) {
        this.address = address;
        this.parent = parent;
        this.value = this.parent.getContent(this.address);

        this.valueElement = document.createElement('span');
        this.valueElement.classList.add('data-number');
        this.stringElement = document.createElement('span');

        this.valueElement.innerText = this.getValueInnerText();
        this.stringElement.innerText = this.getStringInnerText();

        // Start the periodic polling for the 7-segment memory addresses
        if (this.address >= 0x10000020 && this.address <= 0x1000002C) {
            this.startPolling7Segment();
        }

        if (this.address === 0x10000030) {
            this.startPollingLed();
        }

        if (this.address >= 0x10000040 && this.address <= 0x10000048) {
            this.startPollingUart();
        }
    }

    // polling memory addresses for 7-segment display
    startPolling7Segment() {
        this.previousValues = {
            0x10000020: null,
            0x10000024: null,
            0x10000028: null,
            0x1000002C: null
        };

        setInterval(() => this.checkAndUpdate7Segment(), 100);
    }

    checkAndUpdate7Segment() {
        // Check if the memory address corresponds to the 7-segment display
        [0x10000020, 0x10000024, 0x10000028, 0x1000002C].forEach(address => {
            const newValue = this.parent.getContent(address);

            if (newValue !== this.previousValues[address]) {
                this.previousValues[address] = newValue;
                this.updateSevenSegment(address, newValue);
            }
        });
    }

    // Update the 7-segment display based on the changed value
    updateSevenSegment(address, newValue) {
        const valueToDisplay = newValue & 0xFF; 

        switch (address) {
            case 0x10000020:
                console.log("Updating LEFT display with:", valueToDisplay);
                SevenSegmentDisplay.updateLeft(valueToDisplay);
                break;
            case 0x10000024:
                console.log("Updating MID-LEFT display with:", valueToDisplay);
                SevenSegmentDisplay.updateMidLeft(valueToDisplay);
                break;
            case 0x10000028:
                console.log("Updating MID-RIGHT display with:", valueToDisplay);
                SevenSegmentDisplay.updateMidRight(valueToDisplay);
                break;
            case 0x1000002C:
                console.log("Updating RIGHT display with:", valueToDisplay);
                SevenSegmentDisplay.updateRight(valueToDisplay);
                break;
            default:
                break;
        }
    }

    startPollingLed() {
        this.previousLedValue = this.parent.getContent(0x10000030);

        setInterval(() => this.checkAndUpdateLed(), 100);
    }

    checkAndUpdateLed() {
        const newLedValue = this.parent.getContent(0x10000030);

        if (newLedValue !== this.previousLedValue) {
            this.previousLedValue = newLedValue;
            this.updateLed(newLedValue);
        }
    }

    updateLed(newLedValue) {
        console.log("Updating LED display with value:", newLedValue.toString(2).padStart(8, '0'));
        LedDisplay.update(newLedValue); 
    }

    // polling for UART memory registers
    startPollingUart() {
        this.previousUartValues = {
            0x10000040: null, // Data register
            0x10000044: null, // Status register
            0x10000048: null  // Control register
        };

        setInterval(() => this.checkAndUpdateUart(), 1);
    }

    checkAndUpdateUart() {
        const uartAddresses = [0x10000040, 0x10000044, 0x10000048];

        if (uartAddresses.includes(this.address)) {
            const newValue = this.parent.getContent(this.address);

            if (newValue !== this.previousUartValues[this.address]) {
                this.previousUartValues[this.address] = newValue;
                console.log(`UART memory at 0x${this.address.toString(16)} changed to 0x${newValue?.toString(16)}`);

                // If writing to data register, display the transmitted char
                if (this.address === 0x10000040 && window.uart) {
                    const char = String.fromCharCode(newValue & 0xFF);
                    window.uartInterface.receiveChar(char); 
                }
            }
        }
    }

    updateValue() {
        const newValue = this.parent.getContent(this.address);

        if (newValue === undefined) {
            this.valueElement.classList.add('unused');
            this.stringElement.classList.add('unused');
            return;
        }

        if (this.value === newValue) {
            this.valueElement.classList.remove('highlight', 'unused');
            this.stringElement.classList.remove('highlight', 'unused');
            return;
        }

        if (this.value !== undefined) {
            this.valueElement.classList.add('highlight');
            this.stringElement.classList.add('highlight');
        }

        this.value = newValue;
        console.log(`updateValue called for address: 0x${this.address.toString(16)}, new value: 0x${newValue?.toString(16)}`);

        this.valueElement.innerText = this.getValueInnerText();
        this.stringElement.innerText = this.getStringInnerText();
    }

    getValueInnerText() {
        if (this.parent.radix === 10) {
            const string = this.value === undefined ? '' : this.value.toString();
            return string.padStart(10, ' ');
        } else {
            if (this.value === undefined) return ''.padStart(8);
            return this.value.toString(16).padStart(8, '0');
        }
    }

    getStringInnerText() {
        if (this.value === undefined)
            return ''.padStart(4);

        const asciiArray = [
            this.value & 0xff,
            (this.value & 0xffff) >> 8,
            (this.value & 0xffffff) >> 16,
            this.value >> 24
        ];
        return asciiArray
            .map(e => e >= 32 && e < 127 ? e : 183)
            .map(e => String.fromCharCode(e)).join('');
    }
}

// MemorySystem class to integrate UART with the memory subsystem
class MemorySystem {
    constructor() {
        this.memory = {}; // Main memory storage
        this.radix = 16;  // Default display radix (hexadecimal)
        this.uart = null; // UART will be connected from uart.js
    }
    
    // Connect UART to the memory system
    connectUart(uart) {
        this.uart = uart;
        console.log('UART connected to memory system');
    }
    
    // Check if address is in UART memory-mapped range
    isUartAddress(address) {
        return address >= 0x10000040 && address <= 0x10000048;
    }
    
    // Get content from memory, handles special memory-mapped regions
    getContent(address) {
        // Check if address is in UART range and UART is connected
        if (this.uart && this.isUartAddress(address)) {
            const value = this.uart.readUart(address);
            console.log(`UART Read: addr=0x${address.toString(16)}, value=0x${value?.toString(16)}`);
            return value;
        }
        
        // Return from regular memory otherwise
        return this.memory[address];
    }
    
    // Set content in memory, handles special memory-mapped regions
    setContent(address, value) {
        // Check if address is in UART range and UART is connected
        if (this.uart && this.isUartAddress(address)) {
            return this.uart.writeUart(address, value);
        }
        
        // Set in regular memory otherwise
        this.memory[address] = value;
        return true;
    }
    
    // Set display radix for memory values
    setRadix(radix) {
        this.radix = radix;
    }
    
    // Clear all memory contents
    clearMemory() {
        this.memory = {};
    }
}

// Memory Cell class for UI display
class MemoryCell {
    constructor(address, parent, valueElement, stringElement) {
        this.address = address;
        this.parent = parent;
        this.valueElement = valueElement;
        this.stringElement = stringElement;
        this.value = undefined;
        this.previousValue = undefined;
    }

    updateValue() {
        const newValue = this.parent.getContent(this.address);

        if (newValue === undefined) {
            this.valueElement.classList.add('unused');
            this.stringElement.classList.add('unused');
            return;
        }

        if (this.value === newValue) {
            this.valueElement.classList.remove('highlight', 'unused');
            this.stringElement.classList.remove('highlight', 'unused');
            return;
        }

        if (this.value !== undefined) {
            this.valueElement.classList.add('highlight');
            this.stringElement.classList.add('highlight');
        }

        this.value = newValue;
        this.valueElement.innerText = this.getValueInnerText();
        this.stringElement.innerText = this.getStringInnerText();
        
        // Remove highlight after animation
        setTimeout(() => {
            this.valueElement.classList.remove('highlight');
            this.stringElement.classList.remove('highlight');
        }, 500);
    }

    getValueInnerText() {
        if (this.parent.radix === 10) {
            const string = this.value === undefined ? '' : this.value.toString();
            return string.padStart(10, ' ');
        } else {
            if (this.value === undefined) return ''.padStart(8);
            return this.value.toString(16).padStart(8, '0');
        }
    }

    getStringInnerText() {
        if (this.value === undefined)
            return ''.padStart(4);

        const asciiArray = [
            this.value & 0xff,
            (this.value & 0xffff) >> 8,
            (this.value & 0xffffff) >> 16,
            this.value >> 24
        ];
        return asciiArray
            .map(e => e >= 32 && e < 127 ? e : 183)
            .map(e => String.fromCharCode(e)).join('');
    }
}

window.memorySystem = new MemorySystem();