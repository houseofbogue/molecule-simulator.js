(function() {
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/houseofbogue/molecule-simulator.js@main/molecule-simulator.js?v=' + Date.now();
    script.onload = function() {
        if (typeof initMoleculeSimulator === 'function') {
            initMoleculeSimulator();
        } else {
            console.error('initMoleculeSimulator function not found');
        }
    };
    document.head.appendChild(script);
})();
