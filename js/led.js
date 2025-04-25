const LedDisplay = {
  leds: [],

  init() {
      console.log("Initializing LED Display");
      this.leds = Array.from({ length: 8 }, (_, i) =>
          document.getElementById(`led${i}`)
      );

      if (this.leds.some(led => !led)) {
          console.error("One or more LED elements not found in DOM!");
      } else {
          console.log("LED Display initialized");
          this.update(0);  // start with all off
      }
  },

  update(value) {
      console.log("Updating LED display with value:", value.toString(2).padStart(8, '0'));
      for (let i = 0; i < 8; i++) {
          if ((value >> i) & 1) {
              this.leds[i]?.classList.add("led-on");
          } else {
              this.leds[i]?.classList.remove("led-on");
          }
      }
  },

  reset() {
      console.log("Resetting LED display");
      this.update(0);
  }
};

// Hook to initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded, initializing LED display");
  LedDisplay.init();
});
