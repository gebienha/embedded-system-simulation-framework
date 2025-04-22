const LED_BASE_ADDRESS = 0xFFFF0090;
const LED_STATE = new Uint8Array(1);

class MemoryUtils {
    static init() {
        this.userData = new UserData();
        this.kernelData = new KernelData();
        this.stack = new Stack();
        this.ledSegment = new LEDSegment();

        this.userData.initialize();
        this.kernelData.initialize();
        this.stack.initialize();
        this.ledSegment.initialize();
    }

    static update() {
        this.userData.update();
        this.kernelData.update();
        this.stack.update();
        this.ledSegment.update();
    }

    static changeStackRadix(radixStr) {
        const radix = Number.parseInt(radixStr);
        this.stack.changeRadix(radix);
    }

    static changeDataRadix(radixStr) {
        const radix = Number.parseInt(radixStr);
        this.kernelData.changeRadix(radix);
        this.userData.changeRadix(radix);
    }

    static toggleKernelData(showKernelData) {
        if (showKernelData)
            Elements.kernelDataContainer.style.display = null;
        else
            Elements.kernelDataContainer.style.display = 'none';
    }
}

class Memory {
    constructor() {
        this.radix = 16;
        this.lines = [];
        this.content = undefined;
        this.element = undefined;
        this.mmioAddresses = new Set([LED_BASE_ADDRESS]); // Add memory-mapped I/O addresses
    }

    /**
     * Initialize `element` and `lines`
     */
    initialize() {
        this.element.innerHTML = '';
        this.addNewLines();
    }

    /**
     * update the radix for values
     * @param radix new radix
     */
    changeRadix(radix) {
        this.radix = radix;
        for (const line of this.lines)
            for (const word of line.wordList)
                word.valueElement.innerText = word.getValueInnerText()
    }

    /**
     * Check whether a line with the corresponding start address is empty (i.e., all zeros)
     * @param startAddress the start address of the line
     * @returns {boolean}
     */
    isLineEmpty(startAddress) {
        for (let i = startAddress; i < startAddress + 0x10; i += 4)
            if (this.getContent(i) !== 0) return false;
        return true;
    }

    /**
     * Adding new lines to `this.lines`
     */
    addNewLines() {
    }

    /**
     * update the memory values
     */
    update() {
    }

    /**
     * Check if the address is a memory-mapped I/O address
     * @param address a memory address
     * @returns {boolean} whether the address is MMIO
     */
    isMMIOAddress(address) {
        return this.mmioAddresses.has(address);
    }

    /**
     * Get content from a certain memory address
     * @param address a memory address
     * @returns {number} the content in the address in int32
     */
    getContent(address) {
        if (this.isMMIOAddress(address)) {
            if (address === LED_BASE_ADDRESS) {
                return LED_STATE[0];
            }
        }
        return 0;
    }

    /**
     * Set content to a certain memory address
     * @param address a memory address
     * @param value the value to set
     * @returns {boolean} whether the operation was successful
     */
    setContent(address, value) {
        if (address === LED_BASE_ADDRESS) {
            LED_STATE[0] = value & 0xFF;
            if (MemoryUtils.ledSegment) {
                MemoryUtils.ledSegment.updateLEDDisplay();
            }
            return true; // Indicate that the write was handled
        }
        return false; // Not handled here
    }
}

class DataSegment extends Memory {
    constructor() {
        super();
        this.lineAddresses = new Set();
    }

    addNewLines() {
        for (let i = 0; i < this.content.length / 16; i++) {
            const addr = this.startAddress + i * 0x10;
            if (this.isLineEmpty(addr)) continue;
            this.addLine(addr);
        }
    }

    addLine(addr) {
        const newLine = new MemoryLine(addr, this);
        newLine.updateValues();
        this.element.append(newLine.element);
        this.lines.push(newLine);
        this.lineAddresses.add(addr);
    }

    getContent(addr) {
        return this.content[(addr - this.startAddress) >> 2];
    }
}

class UserData extends DataSegment {
    constructor() {
        super();
        
        this.element = Elements.userData;
        this.content = Module.getUserData();
        this.startAddress = 0x10000000;

        [0x10000020, 0x10000024, 0x10000028, 0x1000002C].forEach(addr => {
            const alignedAddr = addr & 0xFFFFFFF0;
            if (!this.lineAddresses.has(alignedAddr)) {
                this.addLine(alignedAddr);
            }
        });
        
    }

    update() {
        for (let i = 0; i < this.content.length / 16; i++) {
            const addr = this.startAddress + i * 0x10;
            if (!this.isLineEmpty(addr) && !this.lineAddresses.has(addr))
                this.addLine(addr);
        }

        this.content = Module.getUserData();
        this.lines.forEach(e => e.updateValues());
    }
}

class KernelData extends DataSegment {
    constructor() {
        super();
        this.element = Elements.kernelData;
        this.content = Module.getKernelData();
        this.startAddress = 0x90000000;
    }
}

class Stack extends Memory {
    constructor() {
        super();
        this.content = Module.getStack();
        this.element = Elements.stack;
    }

    update() {
        if (RegisterUtils.getSP() < this.minLineAddress)
            this.addNewLines(this.minLineAddress);
        this.lines.forEach(e => e.updateValues());
    }

    getContent(addr) {
        if (RegisterUtils.getSP() > addr) return undefined;
        const index = this.content.length - (0x80000000 - addr) / 4;
        return this.content[index];
    }

    addNewLines(endAddr = 0x80000000) {
        for (; endAddr >= RegisterUtils.getSP(); endAddr -= 0x10) {
            const newLine = new MemoryLine(endAddr - 0x10, this);
            Elements.stack.prepend(newLine.element);
            this.lines.push(newLine);
        }
        this.minLineAddress = RegisterUtils.getSP() & 0xfffffff0;
    }
}

class LEDSegment extends Memory {
    constructor() {
        super();
        this.element = document.getElementById('led-display');
    }

    updateLEDDisplay() {
        if (!this.element) {
            console.error('LED display element not found!');
            return;
        }

        const value = LED_STATE[0];
        console.log('LED value:', value.toString(2).padStart(8, '0')); // Debug output

        // Update each LED
        for (let i = 0; i < 8; i++) {
            const led = this.element.querySelector(`#led${i}`);
            if (led) {
                const isOn = (value & (1 << i)) !== 0;
                led.classList.toggle('led-on', isOn);
            }
        }
    }

    update() {
        this.updateLEDDisplay();
    }

    initialize() {
        if (!this.element) {
            console.error('LED display container not found!');
            return;
        }
        
        // Clear and recreate LED elements
        this.element.innerHTML = '';
        for (let i = 7; i >= 0; i--) {
            const led = document.createElement('div');
            led.id = `led${i}`;
            led.className = 'led';
            this.element.appendChild(led);
        }
        
        LED_STATE[0] = 0;
        this.updateLEDDisplay();
    }
}