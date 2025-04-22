const fileList = [
    'fibonacci.s',
    'test_core.s',
    'test_le.s',
    'test_sys_call.s',
    'hello_world.s',
    'read_string.s',
    'timing.s',
    'timer_interrupt.s'
];
fileList.forEach(filename => {
    const option = document.createElement("option");
    option.text = filename;
    option.value = `Tests/${filename}`;
    Elements.fileSelector.add(option);
});

var Module = {
    postRun: [main],
    print: (text) => {
        Elements.output.innerHTML += text + "\n";
        Elements.output.scrollTop = Elements.output.scrollHeight;
    },
    printErr: (text) => {
        Elements.log.innerHTML += text + "\n";
        Elements.log.scrollTop = Elements.output.scrollHeight;
    }
};

// async function main(fileInput = `Tests/${fileList[0]}`) {
//     let data = await loadData(fileInput);

//     const stream = FS.open('input.s', 'w+');
//     FS.write(stream, new Uint8Array(data), 0, data.byteLength, 0);
//     FS.close(stream);

//     Execution.init();

//     // If the fileInput is a File object, we don't need to load it into the editor
//     // since it likely came from the editor itself
//     if (!(fileInput instanceof File)) {
//         // Load the file content into the editor
//         const textDecoder = new TextDecoder();
//         const fileContent = textDecoder.decode(data);
//         editor.setValue(fileContent);
//     }
// }

async function main(fileInput = null) {
    // Create an empty input.s file at the start
    const emptyData = new TextEncoder().encode(''); // Empty string as data
    const stream = FS.open('input.s', 'w+');
    FS.write(stream, emptyData, 0, emptyData.byteLength, 0);
    FS.close(stream);

    // If fileInput is provided (not null), load and display that file's content
    if (fileInput) {
        let data = await loadData(fileInput);

        const stream = FS.open('input.s', 'w+');
        FS.write(stream, new Uint8Array(data), 0, data.byteLength, 0);
        FS.close(stream);

        Execution.init();

        const textDecoder = new TextDecoder();
        const fileContent = textDecoder.decode(data);
        editor.setValue(fileContent);

        const filename = typeof fileInput === 'string' ? fileInput.split('/').pop() : fileInput.name;
        document.getElementById('filename-input').value = filename;
    }
    //SevenSegmentDisplay.updateAll([0x3F, 0x3F, 0x3F, 0x3F]);

}


async function saveFile(filename) {
    // Get the code from the editor
    const code = editor.getValue();

    // Ensure the filename ends with .s
    if (!filename.endsWith('.s')) {
        filename += '.s';
    }

    // Create a Blob from the editor content
    const blob = new Blob([code], { type: 'text/plain' });

    // Create an anchor element to trigger the download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename; // Use the filename with .s extension

    // Trigger the click event to download the file
    link.click();

    console.log(`Code saved as ${filename}`);
}

async function loadData(fileInput) {
    if (fileInput instanceof File) { // local file
        const reader = new FileReader();
        return new Promise((resolve) => {
            reader.onload = () => resolve(reader.result);
            reader.readAsArrayBuffer(fileInput);
            
        });
    } else { // remote file
        const response = await fetch(fileInput);
        return response.arrayBuffer();
    }

}

// Add this function to handle the assemble button click
function assembleCode() {
    // Get the code from the editor
    const code = editor.getValue();
    
    // Create a File object from the editor content
    const file = new File([code], "input.s", {
        type: "text/plain",
    });
    
    // Process the file
    main(file);
    
    console.log('Code assembled and saved to input.s');
}


// Handle file input change (for file selection via browse)
document.getElementById('file-input').addEventListener('change', function(event) {
    const fileInput = event.target.files[0]; // Get the selected file

    if (fileInput) {
        // Read and load the content of the file
        loadData(fileInput).then((data) => {
            const stream = FS.open('input.s', 'w+');
            FS.write(stream, new Uint8Array(data), 0, data.byteLength, 0);
            FS.close(stream);

            Execution.init();

            // Load the file content into the editor
            const textDecoder = new TextDecoder();
            const fileContent = textDecoder.decode(data);
            editor.setValue(fileContent); // Display content in the editor
       
            document.getElementById('filename-input').value = fileInput.name;
        });
    }
});

// Handle file selector change (for file selection from dropdown)
document.getElementById('file-selector').addEventListener('change', function(event) {
    const fileInput = event.target.value; // Get the selected file path from dropdown

    if (fileInput) {
        // Load and display the content of the selected file
        main(fileInput);
    }
});

// Initialize the program
document.addEventListener('DOMContentLoaded', function() {
    // Initialize with an empty input.s
    // Initialize the editor (assuming you're using something like CodeMirror or Ace)
    console.log('Initializing editor...');
    editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
        lineNumbers: true,
        mode: "text/x-asm",
    });
    
    console.log('Editor initialized:', editor);
    
    main();

    // Initialize the assemble button functionality
    if (document.getElementById('assemble-button')) {
        document.getElementById('assemble-button').addEventListener('click', assembleCode);
    }

    // Initialize the save button functionality
    if (document.getElementById('save-button')) {
        document.getElementById('save-button').addEventListener('click', saveFile);
    }
});

function showRegsTab(tab) {
    // Hide all tabs
    document.getElementById("int-regs-content").style.display = "none";
    document.getElementById("fp-regs-content").style.display = "none";

    // Remove active class from both tabs
    document.getElementById("int-regs-tab").classList.remove("active");
    document.getElementById("fp-regs-tab").classList.remove("active");

    // Show selected tab content and add active class to selected tab
    if (tab === "int") {
        document.getElementById("int-regs-content").style.display = "block";
        document.getElementById("int-regs-tab").classList.add("active");
    } else if (tab === "fp") {
        document.getElementById("fp-regs-content").style.display = "block";
        document.getElementById("fp-regs-tab").classList.add("active");
    }
}

// Function to show the corresponding tab content
function showMemoryTab(tab) {
    const dataTab = document.getElementById('data-segment-content');
    const stackTab = document.getElementById('stack-content');
    const dataTabLink = document.getElementById('data-segment-tab');
    const stackTabLink = document.getElementById('user-stack-tab');
    
    if (tab === 'data') {
        dataTab.style.display = 'block';
        stackTab.style.display = 'none';
        dataTabLink.classList.add('active');
        stackTabLink.classList.remove('active');
    } else {
        dataTab.style.display = 'none';
        stackTab.style.display = 'block';
        stackTabLink.classList.add('active');
        dataTabLink.classList.remove('active');
    }
}