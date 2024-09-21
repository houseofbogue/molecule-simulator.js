// Load main script
var script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/gh/houseofbogue/molecule-simulator.js@main/molecule-simulator.js?v=' + Date.now();
script.onload = function() {
    if (typeof MoleculeSimulator !== 'undefined') {
        new MoleculeSimulator();
    } else {
        console.error('MoleculeSimulator not found. Check if the script loaded correctly.');
    }
};
document.head.appendChild(script);
