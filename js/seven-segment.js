const SevenSegmentDisplay = {
    // segment patterns for hex values
    patterns: {
        0x00: [0,0,0,0,0,0,0], // blank
        0x3F: [1,1,1,1,1,1,0], // 0
        0x06: [0,1,1,0,0,0,0], // 1
        0x5B: [1,1,0,1,1,0,1], // 2
        0x4F: [1,1,1,1,0,0,1], // 3
        0x66: [0,1,1,0,0,1,1], // 4
        0x6D: [1,0,1,1,0,1,1], // 5
        0x7D: [1,0,1,1,1,1,1], // 6
        0x07: [1,1,1,0,0,0,0], // 7
        0x7F: [1,1,1,1,1,1,1], // 8
        0x6F: [1,1,1,1,0,1,1], // 9
        0x77: [1,1,1,0,1,1,1], // A
        0x7C: [0,0,1,1,1,1,1], // b
        0x39: [1,0,0,1,1,1,0], // C
        0x5E: [0,1,1,1,1,0,1], // d
        0x79: [1,0,0,1,1,1,1], // E
        0x71: [1,0,0,0,1,1,1]  // F
    },

    updateLeft(value) {
        console.log("updateLeft called with value:", value, "hex:", value.toString(16));
        this._updateDisplay('digit-left', value);
    },

    updateMidLeft(value) {
        console.log("updateMidLeft called with value:", value, "hex:", value.toString(16));
        this._updateDisplay('digit-mid-left', value);
    },

    updateMidRight(value) {
        console.log("updateMidRight called with value:", value, "hex:", value.toString(16));
        this._updateDisplay('digit-mid-right', value);
    },

    updateRight(value) {
        console.log("updateRight called with value:", value, "hex:", value.toString(16));
        this._updateDisplay('digit-right', value);
    },

    _updateDisplay(displayClass, value) {
        // display element
        const display = document.querySelector(`.${displayClass}`);
        if (!display) {
            console.error(`Display element .${displayClass} not found!`);
            return;
        }
        
        // pattern for the value or use blank if not found
        const byteValue = value & 0xFF;
        const pattern = this.patterns[byteValue] || this.patterns[0x00];
        
        console.log(`Updating ${displayClass} with pattern:`, pattern.join(','));
        
        // Update each segment
        const segments = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
        segments.forEach((seg, i) => {
            const segment = display.querySelector(`.segment-${seg}`);
            if (segment) {
                if (pattern[i] === 1) {
                    segment.classList.add('on');
                } else {
                    segment.classList.remove('on');
                }
            } else {
                console.error(`Segment .segment-${seg} not found in ${displayClass}`);
            }
        });
    },

    updateAll(values) {
        console.log("updateAll called with values:", values);
        if (values.length !== 4) {
            console.error("Expected 4 values for updateAll");
            return;
        }
        
        this.updateLeft(values[0]);
        this.updateMidLeft(values[1]);
        this.updateMidRight(values[2]);
        this.updateRight(values[3]);
    },    
    
    init() {
        console.log("Initializing Seven Segment Display");
        
        console.log("Seven Segment Display initialized with test pattern");
        
        // After 2 seconds, clear displays
        setTimeout(() => {
            this.updateAll([0, 0, 0, 0]);
            console.log("Displays cleared");
        }, 2000);
    },

    reset(){
        console.log("Resetting Seven Segment Display");
        this.updateAll([0, 0, 0, 0]);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing seven-segment display");
    SevenSegmentDisplay.init();
});

