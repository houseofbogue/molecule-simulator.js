// Load main script
var script = document.createElement('script');
script.src = 'https://unpkg.com/@houseofbogue/molecule-simulator@1.0.0/molecule-simulator.js';
script.onload = function() {
    if (typeof MoleculeSimulator !== 'undefined') {
        new MoleculeSimulator();
    } else {
        console.error('MoleculeSimulator not found. Check if the script loaded correctly.');
    }
};
document.head.appendChild(script);
