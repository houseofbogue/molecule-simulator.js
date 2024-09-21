(function() {
    // Create container
    var container = document.createElement('div');
    container.id = 'molecule-simulator-container';
    document.body.appendChild(container);

    // Add HTML
    container.innerHTML = `
        <div id="container">
            <video id="video" autoplay playsinline></video>
            <canvas id="canvas"></canvas>
            <div id="controls">
                <div id="dragHandle">&#8942;</div>
                <div id="minimizeHandle">&#8211;</div>
                <h1 id="title">MOLECULE SIMULATOR</h1>
                <div class="control-group">
                    <label for="opacitySlider">Video Opacity: <span id="opacityValue">10%</span></label>
                    <div class="slider-container">
                        <div class="slider-track"></div>
                        <div class="slider-fill" id="opacityFill"></div>
                        <input type="range" id="opacitySlider" min="0" max="100" value="10">
                    </div>
                </div>
                <div class="control-group">
                    <label for="numCirclesSlider">Number of Circles: <span id="numCirclesValue">1600</span></label>
                    <div class="slider-container">
                        <div class="slider-track"></div>
                        <div class="slider-fill" id="numCirclesFill"></div>
                        <input type="range" id="numCirclesSlider" min="100" max="10000" step="100" value="1600">
                    </div>
                </div>
                <div class="control-group">
                    <label for="randomnessSlider">Randomness of Circle Sizes: <span id="randomnessValue">50%</span></label>
                    <div class="slider-container">
                        <div class="slider-track"></div>
                        <div class="slider-fill" id="randomnessFill"></div>
                        <input type="range" id="randomnessSlider" min="0" max="100" value="50">
                    </div>
                </div>
                <div class="control-group">
                    <label for="medianSizeSlider">Median Circle Size: <span id="medianSizeValue">15</span></label>
                    <div class="slider-container">
                        <div class="slider-track"></div>
                        <div class="slider-fill" id="medianSizeFill"></div>
                        <input type="range" id="medianSizeSlider" min="1" max="50" value="15">
                    </div>
                </div>
                <div class="control-group">
                    <label for="entropySpeedSlider">Entropy Speed: <span id="entropySpeedValue">50%</span></label>
                    <div class="slider-container">
                        <div class="slider-track"></div>
                        <div class="slider-fill" id="entropySpeedFill"></div>
                        <input type="range" id="entropySpeedSlider" min="0" max="100" value="50">
                    </div>
                </div>
                <div class="control-group">
                    <button id="captureButton">Take a Selfie</button>
                </div>
            </div>
            <div id="restoreHandle" style="display: none;">&#9744;</div>
        </div>
    `;

    // Add CSS
    var style = document.createElement('style');
    style.textContent = `
        #molecule-simulator-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
        }
        #container {
            position: relative;
            width: 100%;
            height: 100vh;
            overflow: hidden;
        }
        #video {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0.1;
            z-index: 1;
        }
        #canvas {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: block;
            z-index: 2;
        }
        #controls {
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: rgba(255, 255, 255, 0.9);
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            width: 300px;
            font-weight: bold;
        }
        #title {
            font-size: 20px;
            margin: 0 0 20px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .control-group { margin-bottom: 15px; }
        #controls label {
            display: block;
            margin-bottom: 5px;
            font-size: 14px;
        }
        #controls span { font-weight: bold; }
        .slider-container {
            position: relative;
            width: 100%;
            height: 20px;
            margin: 10px 0;
        }
        .slider-track, .slider-fill {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            height: 2px;
        }
        .slider-track {
            width: 100%;
            background: #000000;
        }
        .slider-fill {
            background: #3498db;
            pointer-events: none;
        }
        input[type="range"] {
            -webkit-appearance: none;
            width: 100%;
            height: 20px;
            background: transparent;
            outline: none;
            margin: 0;
            padding: 0;
            z-index: 2;
            position: relative;
        }
        input[type="range"]::-webkit-slider-thumb, input[type="range"]::-moz-range-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            background: #3498db;
            cursor: pointer;
            border-radius: 50%;
            z-index: 3;
            position: relative;
        }
        input[type="range"]::-moz-range-thumb { border: none; }
        #captureButton {
            width: 100%;
            padding: 10px;
            background-color: #3498db;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            transition: background-color 0.3s;
        }
        #captureButton:hover { background-color: #2980b9; }
        #dragHandle, #minimizeHandle {
            position: absolute;
            top: 5px;
            z-index: 1001;
            font-size: 20px;
            line-height: 1;
            cursor: move;
        }
        #dragHandle { right: 30px; }
        #minimizeHandle {
            right: 5px;
            font-size: 18px;
            cursor: pointer;
        }
        #restoreHandle {
            position: fixed;
            top: 10px;
            right: 10px;
            font-size: 24px;
            cursor: pointer;
            z-index: 1002;
            background-color: rgba(255, 255, 255, 0.7);
            padding: 5px;
            border-radius: 5px;
        }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .fade-out { animation: fadeOut 0.5s ease-out forwards; }
        .fade-in { animation: fadeIn 0.5s ease-in forwards; }
    `;
    document.head.appendChild(style);

    // Load main script
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/houseofbogue/molecule-simulator.js@main/molecule-simulator.js';
    script.onload = function() {
        if (typeof MoleculeSimulator !== 'undefined') {
            new MoleculeSimulator();
        } else {
            console.error('MoleculeSimulator not found. Check if the script loaded correctly.');
        }
    };
    document.head.appendChild(script);
})();
