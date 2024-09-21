(function() {
    console.log("Embed script started");
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/houseofbogue/molecule-simulator.js@main/molecule-simulator.js?v=' + Date.now();
    script.onload = function() {
        console.log("Molecule simulator script loaded");
        if (typeof initMoleculeSimulator === 'function') {
            console.log("Calling initMoleculeSimulator");
            initMoleculeSimulator();
        } else {
            console.error('initMoleculeSimulator function not found');
        }
    };
    script.onerror = function() {
        console.error("Failed to load molecule simulator script");
    };
    document.head.appendChild(script);
    console.log("Script appended to head");
})();
