# Embedded System Simulation Framework
This is a modified version of [JsSpim](https://github.com/ShawnZhong/JsSpim), which itself is an online adaptation of **Prof. James Larus’s Spim**.  
It provides a modernized web interface, new editing capabilities, and additional peripheral visualizations for MIPS32 simulation and learning.

## Background

**Spim** is a self-contained MIPS32 simulator that reads and executes assembly programs written for the MIPS architecture.  
It also includes a simple debugger and basic operating system services, but it does not execute compiled binaries.

**JsSpim** extended Spim by compiling it to WebAssembly (via Emscripten) and creating an interactive web-based environment.

**This simulator** builds further on **JsSpim**, focusing on **enhanced usability**, **visualization**, and **educational tools**.

---

> *Spim* is a self-contained simulator that runs MIPS32 programs. It reads and executes assembly language programs written for this processor. *Spim* also provides a simple debugger and minimal set of operating system services. *Spim* does not execute binary (compiled) programs.
>
> *Spim* implements almost the entire MIPS32 assembler-extended instruction set. (It omits most floating point comparisons and rounding modes and the memory system page tables.) The MIPS architecture has several variants that differ in various ways (e.g., the MIPS64 architecture supports 64-bit integers and addresses), which means that *Spim* will not run programs for all MIPS processors.

## New Features in WebMIPS

- **Integrated Code Editor** using [CodeMirror]  
  Users can write, edit, and assemble MIPS code directly in the browser.  

- **7-Segment Display and LED Simulation**  
  Developed interactive 7-segment and LED panels to visualize binary/decimal outputs from MIPS programs.

- **Dark Theme Support**  
  Added an alternate dark mode UI for better readability.

- **Aligned Peripheral Layouts**  
  Improved layout alignment for the 7-segment display, LEDs, and other simulated peripherals.

- **Improved Interface Styling**  
  Updated toolbar, consistent layout adjustments, and smoother visual feedback during execution.

## Screenshot

![]()

## Screen Record

<img src="screenrecord.gif" width="100%">

## Features

- Click on an instruction to toggle **breakpoint**
- Use the range slider to **control the execution speed**
- **Highlight** on changed registers, data segment, and stack
- **Radix** support for all values

## Built With

- [Spim](http://spimsimulator.sourceforge.net/) - The original simulator written in C++
- [Emscripten](https://emscripten.org/) - Toolchain to compile C++ source code to WebAssembly using the LLVM IR.
- [Bootstrap](https://getbootstrap.com/)  - Using the CSS library to build the UI
- [highlight.js](https://highlightjs.org/) - For highlighting the source code

