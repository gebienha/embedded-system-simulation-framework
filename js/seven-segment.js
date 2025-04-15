const SevenSegmentDisplay = {
    segmentMap: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],

    update(displayElementId, value) {
        const binary = value.toString(2).padStart(8, '0');
        const display = document.getElementById(displayElementId);

        this.segmentMap.forEach((seg, i) => {
            const segment = display.querySelector(`.segment-${seg}`);
            if (segment) {
                if (binary[6 - i] === '1') {
                    segment.classList.add('on');
                } else {
                    segment.classList.remove('on');
                }
            }
        });
    },

    updateRight(value) {
        this.update('seven-segment-right', value);
    },

    updateLeft(value) {
        this.update('seven-segment-left', value);
    }
};
