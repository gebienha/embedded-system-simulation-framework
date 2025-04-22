// class MemoryLine {
//     constructor(startAddress, parent) {
//         this.wordList = [];
//         for (let address = startAddress; address < startAddress + 0x10; address += 4)
//             this.wordList.push(new MemoryWord(address, parent));

//         this.element = document.createElement('span');
//         this.element.innerHTML = `[<span class='hljs-attr'>${startAddress.toString(16)}</span>]`;

//         this.wordList.forEach(e => {
//             this.element.appendChild(e.valueElement);
//             this.element.appendChild(document.createTextNode(' '));
//         });
//         this.wordList.forEach(e => this.element.appendChild(e.stringElement));
//         this.element.appendChild(document.createTextNode('\n'));
//     }

//     updateValues() {
//         this.wordList.forEach(e => e.updateValue());
//     }
// }

// class MemoryWord {
//     constructor(address, parent) {
//         this.address = address;
//         this.parent = parent;
//         this.value = this.parent.getContent(this.address);

//         this.valueElement = document.createElement('span');
//         this.valueElement.classList.add('data-number');
//         this.stringElement = document.createElement('span');

//         this.valueElement.innerText = this.getValueInnerText();
//         this.stringElement.innerText = this.getStringInnerText();
//     }

//     updateValue() {
//         const newValue = this.parent.getContent(this.address);

//         if (newValue === undefined) {
//             this.valueElement.classList.add('unused');
//             this.stringElement.classList.add('unused');
//             return;
//         }

//         if (this.value === newValue) {
//             this.valueElement.classList.remove('highlight', 'unused');
//             this.stringElement.classList.remove('highlight', 'unused');
//             return;
//         }

//         if (this.value !== undefined) {
//             this.valueElement.classList.add('highlight');
//             this.stringElement.classList.add('highlight');
//         }

//         this.value = newValue;
//         console.log(`updateValue called for address: 0x${this.address.toString(16)}, new value: 0x${newValue?.toString(16)}`);

//         const newValueLeft     = this.address === 0x10000020 ? newValue & 0xFF : null;
//         const newValueMidLeft  = this.address === 0x10000024 ? newValue & 0xFF : null;
//         const newValueMidRight = this.address === 0x10000028 ? newValue & 0xFF : null;
//         const newValueRight    = this.address === 0x1000002C ? newValue & 0xFF : null;

//         if (newValueLeft !== null) {
//             console.log("Updating LEFT display with:", newValueLeft);
//             SevenSegmentDisplay.updateLeft(newValueLeft);
//         }
//         if (newValueMidLeft !== null) {
//             console.log("Updating MID-LEFT display with:", newValueMidLeft);
//             SevenSegmentDisplay.updateMidLeft(newValueMidLeft);
//         }
//         if (newValueMidRight !== null) {
//             console.log("Updating MID-RIGHT display with:", newValueMidRight);
//             SevenSegmentDisplay.updateMidRight(newValueMidRight);
//         }
//         if (newValueRight !== null) {
//             console.log("Updating RIGHT display with:", newValueRight);
//             SevenSegmentDisplay.updateRight(newValueRight);
//         }

//         this.valueElement.innerText = this.getValueInnerText();
//         this.stringElement.innerText = this.getStringInnerText();
//     }


//     getValueInnerText() {
//         if (this.parent.radix === 10) {
//             const string = this.value === undefined ? '' : this.value.toString();
//             return string.padStart(10, ' ');
//         } else {
//             if (this.value === undefined) return ''.padStart(8);
//             return this.value.toString(16).padStart(8, '0');
//         }
//     }

//     getStringInnerText() {
//         if (this.value === undefined)
//             return ''.padStart(4);

//         const asciiArray = [
//             this.value & 0xff,
//             (this.value & 0xffff) >> 8,
//             (this.value & 0xffffff) >> 16,
//             this.value >> 24
//         ];
//         return asciiArray
//             .map(e => e >= 32 && e < 127 ? e : 183)
//             .map(e => String.fromCharCode(e)).join('');
//     }
// }

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
            this.startPolling();
        }
    }

    // Start polling memory addresses related to 7-segment display
    startPolling() {
        this.previousValues = {
            0x10000020: null,
            0x10000024: null,
            0x10000028: null,
            0x1000002C: null
        };

        // Poll every 100ms
        setInterval(() => this.checkAndUpdate(), 100);
    }

    checkAndUpdate() {
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
        const valueToDisplay = newValue & 0xFF;  // Extract the least significant byte

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
