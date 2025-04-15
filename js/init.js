function initializeLEDDisplay() {
    const ledContainer = document.getElementById('led-display');
    ledContainer.innerHTML = ''; // Clear existing LEDs

    for (let i = 0; i < NUM_LEDS; i++) {
        const led = document.createElement('div');
        led.className = 'led';
        led.title = `LED ${i} (Address: 0x${(LED_BASE_ADDRESS + i * 4).toString(16).toUpperCase()})`;
        ledContainer.appendChild(led);
    }
}