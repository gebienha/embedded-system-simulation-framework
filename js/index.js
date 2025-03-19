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

        // If the fileInput is not a File object, load it into the editor
        if (!(fileInput instanceof File)) {
            const textDecoder = new TextDecoder();
            const fileContent = textDecoder.decode(data);
            editor.setValue(fileContent);
        }
        editor.setValue(data);
    }
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
    if (fileInput instanceof File) { // Local file
        const reader = new FileReader();
        return new Promise((resolve) => {
            reader.onload = () => {
                // Resolve the content as a string (text)
                resolve(reader.result);
            };
            reader.readAsText(fileInput); // Read file content as text
        });
    } else { // Remote file
        const response = await fetch(fileInput);
        const data = await response.text(); // Fetch and convert to text
        return data;
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