(function() {
    // Create container
    var container = document.createElement('div');
    container.id = 'molecule-simulator-container';
    document.body.appendChild(container);

    // Add HTML
    container.innerHTML = `
        <!-- Your HTML content here -->
    `;

    // Add CSS
    var style = document.createElement('style');
    style.textContent = `
        /* Your CSS content here */
    `;
    document.head.appendChild(style);

    // Load main script
    var script = document.createElement('script');
    script.src = 'https://unpkg.com/houseofbogue-molecule-simulator@latest/molecule-simulator.js';
    script.onload = function() {
        if (typeof MoleculeSimulator !== 'undefined') {
            new MoleculeSimulator();
        } else {
            console.error('MoleculeSimulator not found. Check if the script loaded correctly.');
        }
    };
    document.head.appendChild(script);
})();
