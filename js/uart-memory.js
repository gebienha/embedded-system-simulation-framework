console.log("UART Direct Memory Hook - Loading...");

// Function to hook into the actual memory array used by MIPS simulator
window.createDirectUartHook = function() {
    console.log("Creating Direct UART Memory Hook...");
    
    // UART register addresses
    const UART_DATA_ADDR = 0x10000040;
    const UART_STATUS_ADDR = 0x10000044;
    const UART_CONTROL_ADDR = 0x10000048;
    
    // Ensure UART is in clean state
    if (window.uart) {
        uart.uartMemory[UART_STATUS_ADDR] = 0x01; // TX Ready only
        uart.uartMemory[UART_DATA_ADDR] = 0x00;
        uart.uartMemory[UART_CONTROL_ADDR] = 0x00;
        console.log("UART reset to clean state");
    }
    
    if (!window.memory) {
        window.memory = new Array(0x10100000).fill(0);
        console.log("Created global memory array");
    }
    
    // Store original memory array
    const originalMemory = window.memory;
    
    // Create proxy to intercept specific addresses
    window.memory = new Proxy(originalMemory, {
        get(target, prop) {
            const address = parseInt(prop);
            
            // Intercept UART reads
            if (address === UART_DATA_ADDR) {
                console.log("ASSEMBLY READ: UART Data (0x10000040)");
                if (uart && uart.readUart) {
                    return uart.readUart(address);
                }
                return 0;
            } else if (address === UART_STATUS_ADDR) {
                console.log("ASSEMBLY READ: UART Status (0x10000044)");
                if (uart && uart.readUart) {
                    const status = uart.readUart(address);
                    console.log(`  -> Status: 0x${status.toString(16)} (TX Ready: ${!!(status & 0x01)})`);
                    return status;
                }
                return 0x01; // Default: TX Ready
            } else if (address === UART_CONTROL_ADDR) {
                console.log("ASSEMBLY READ: UART Control (0x10000048)");
                if (uart && uart.readUart) {
                    return uart.readUart(address);
                }
                return 0;
            }
            
            // Regular memory access
            return target[prop];
        },
        
        set(target, prop, value) {
            const address = parseInt(prop);
            
            // Intercept UART writes
            if (address === UART_DATA_ADDR) {
                console.log(`ASSEMBLY WRITE: UART Data (0x10000040) = 0x${value.toString(16)} ('${String.fromCharCode(value)}')`);
                if (uart && uart.writeUart) {
                    uart.writeUart(address, value);
                }
                return true;
            } else if (address === UART_STATUS_ADDR) {
                console.log(`ASSEMBLY WRITE: UART Status (0x10000044) = 0x${value.toString(16)}`);
                if (uart && uart.writeUart) {
                    uart.writeUart(address, value);
                }
                return true;
            } else if (address === UART_CONTROL_ADDR) {
                console.log(`ASSEMBLY WRITE: UART Control (0x10000048) = 0x${value.toString(16)}`);
                if (uart && uart.writeUart) {
                    uart.writeUart(address, value);
                }
                return true;
            }
            
            // Regular memory write
            target[prop] = value;
            return true;
        }
    });
    
    const memFunctions = [
        'loadWord', 'storeWord', 'loadByte', 'storeByte',
        'readWord', 'writeWord', 'readByte', 'writeByte',
        'getMem', 'setMem', 'readMem', 'writeMem'
    ];
    
    memFunctions.forEach(funcName => {
        if (window[funcName]) {
            const origFunc = window[funcName];
            window[funcName] = function(addr, val) {
                if (addr >= UART_DATA_ADDR && addr <= UART_CONTROL_ADDR) {
                    if (val !== undefined) {
                        console.log(`${funcName}: UART write 0x${addr.toString(16)} = 0x${val.toString(16)}`);
                        return uart ? uart.writeUart(addr, val) : true;
                    } else {
                        console.log(`${funcName}: UART read 0x${addr.toString(16)}`);
                        return uart ? uart.readUart(addr) : (addr === UART_STATUS_ADDR ? 0x01 : 0x00);
                    }
                }
                return origFunc.call(this, addr, val);
            };
            console.log(`Hooked function: ${funcName}`);
        }
    });
    
    window.uartRead = function(address) {
        console.log(`Direct uartRead(0x${address.toString(16)})`);
        return uart ? uart.readUart(address) : (address === UART_STATUS_ADDR ? 0x01 : 0x00);
    };
    
    window.uartWrite = function(address, value) {
        console.log(`Direct uartWrite(0x${address.toString(16)}, 0x${value.toString(16)})`);
        return uart ? uart.writeUart(address, value) : true;
    };
    
    // Some simulators might do direct array access
    if (originalMemory && typeof originalMemory === 'object') {
        // Set initial values
        originalMemory[UART_STATUS_ADDR] = 0x01; // TX Ready
        originalMemory[UART_DATA_ADDR] = 0x00;
        originalMemory[UART_CONTROL_ADDR] = 0x00;
        
        console.log("Set initial UART values in memory array");
    }
    
    console.log("Direct UART hook installed with multiple access methods");
    return true;
};

// Function to test if the hook is working
window.testDirectUartHook = function() {
    console.log("Testing Direct UART Hook...");
    
    // Test 1: Array access
    console.log("Test 1: memory[0x10000044] (should trigger hook)");
    const status = window.memory[0x10000044];
    console.log(`Result: 0x${status.toString(16)}`);
    
    // Test 2: Write to data register
    console.log("Test 2: memory[0x10000040] = 0x41 ('A')");
    window.memory[0x10000040] = 0x41;
    
    // Test 3: Read status again
    console.log("Test 3: memory[0x10000044] after write");
    const status2 = window.memory[0x10000044];
    console.log(`Result: 0x${status2.toString(16)}`);
    
    // Test 4: Direct functions if they exist
    if (window.uartRead) {
        console.log("Test 4: uartRead(0x10000044)");
        const status3 = window.uartRead(0x10000044);
        console.log(`Result: 0x${status3.toString(16)}`);
    }
    
    console.log("Hook test complete - check TX display for 'A' character");
};

// Function to monitor memory access patterns
window.monitorMemoryAccess = function() {
    console.log("Starting Memory Access Monitor...");
    
    let accessCount = 0;
    const originalGet = window.memory.__proto__.constructor.prototype.get;
    
    const handler = {
        get(target, prop) {
            const address = parseInt(prop);
            if (!isNaN(address) && address >= 0x10000000 && address <= 0x10000100) {
                accessCount++;
                console.log(`Memory Access #${accessCount}: READ 0x${address.toString(16)}`);
                
                // If it's UART range, handle specially
                if (address >= 0x10000040 && address <= 0x10000048) {
                    console.log(`  -> UART register access detected!`);
                    if (address === 0x10000044) {
                        return uart ? uart.readUart(address) : 0x01;
                    } else if (address === 0x10000040) {
                        return uart ? uart.readUart(address) : 0x00;
                    }
                }
            }
            return target[prop];
        },
        set(target, prop, value) {
            const address = parseInt(prop);
            if (!isNaN(address) && address >= 0x10000000 && address <= 0x10000100) {
                accessCount++;
                console.log(`Memory Access #${accessCount}: WRITE 0x${address.toString(16)} = 0x${value.toString(16)}`);
                
                if (address >= 0x10000040 && address <= 0x10000048) {
                    console.log(`  -> UART register write detected!`);
                    if (uart && uart.writeUart) {
                        uart.writeUart(address, value);
                    }
                }
            }
            target[prop] = value;
            return true;
        }
    };
    
    // Replace memory with monitored version
    const originalMemory = window.memory;
    window.memory = new Proxy(originalMemory, handler);
    
    console.log("Memory monitor active - run your MIPS program now");
    
    setTimeout(() => {
        console.log(`Monitor stopped. Total accesses: ${accessCount}`);
        window.memory = originalMemory;
    }, 30000);
};

// All-in-one setup function
window.setupCompleteUartHook = function() {
    console.log("COMPLETE UART HOOK SETUP");
    console.log("========================");
    
    // Step 1: Create the hook
    createDirectUartHook();
    
    // Step 2: Test it
    setTimeout(() => {
        testDirectUartHook();
    }, 500);
    
    // Step 3: Start monitoring
    setTimeout(() => {
        console.log("Starting memory access monitoring...");
        console.log("Run your MIPS assembly program now!");
        monitorMemoryAccess();
    }, 1000);
    
    console.log("Complete setup finished - your assembly should now work!");
};

// Emergency fallback - directly set memory values
window.forceUartMemoryValues = function() {
    console.log("FORCE SETTING UART MEMORY VALUES");
    
    // Set values in every possible location
    if (window.memory) {
        window.memory[0x10000044] = 0x01; // Status
        window.memory[0x10000040] = 0x00; // Data
        window.memory[0x10000048] = 0x00; // Control
        console.log("Set values in window.memory[]");
    }
    
    if (window.memorySystem && window.memorySystem.memory) {
        window.memorySystem.memory[0x10000044] = 0x01;
        window.memorySystem.memory[0x10000040] = 0x00;
        window.memorySystem.memory[0x10000048] = 0x00;
        console.log("Set values in memorySystem.memory[]");
    }
    
    if (uart && uart.uartMemory) {
        uart.uartMemory[0x10000044] = 0x01;
        uart.uartMemory[0x10000040] = 0x00;
        uart.uartMemory[0x10000048] = 0x00;
        console.log("Set values in uart.uartMemory[]");
    }
    
    console.log("Memory values forced - try your assembly now");
};

// Load the hook automatically
console.log("Auto-loading Direct UART Hook...");
setTimeout(() => {
    setupCompleteUartHook();
}, 1000);

console.log("UART Direct Memory Hook ready!");
console.log("Available functions:");
console.log("  setupCompleteUartHook() - Complete setup");
console.log("  createDirectUartHook() - Create memory hooks");
console.log("  testDirectUartHook() - Test the hooks");
console.log("  monitorMemoryAccess() - Monitor all memory access");
console.log("  forceUartMemoryValues() - Emergency memory value setting");