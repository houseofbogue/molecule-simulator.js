console.log('molecule-simulator.js starting...');

class MoleculeSimulator {
    constructor() {
        console.log('MoleculeSimulator constructor called');
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.controls = document.getElementById('controls');
        this.dragHandle = document.getElementById('dragHandle');
        this.minimizeHandle = document.getElementById('minimizeHandle');
        this.restoreHandle = document.getElementById('restoreHandle');
        this.opacitySlider = document.getElementById('opacitySlider');
        this.opacityValue = document.getElementById('opacityValue');
        this.numCirclesSlider = document.getElementById('numCirclesSlider');
        this.numCirclesValue = document.getElementById('numCirclesValue');
        this.randomnessSlider = document.getElementById('randomnessSlider');
        this.randomnessValue = document.getElementById('randomnessValue');
        this.medianSizeSlider = document.getElementById('medianSizeSlider');
        this.medianSizeValue = document.getElementById('medianSizeValue');
        this.entropySpeedSlider = document.getElementById('entropySpeedSlider');
        this.entropySpeedValue = document.getElementById('entropySpeedValue');
        this.captureButton = document.getElementById('captureButton');

        this.isDragging = false;
        this.currentX = 0;
        this.currentY = 0;
        this.initialX = 0;
        this.initialY = 0;
        this.xOffset = 0;
        this.yOffset = 0;
        this.medianCircleSize = parseInt(this.medianSizeSlider.value);
        this.sizeRandomness = parseInt(this.randomnessSlider.value) / 100;
        this.numCircles = parseInt(this.numCirclesSlider.value);
        this.entropySpeed = parseInt(this.entropySpeedSlider.value) / 100;
        this.circles = [];

        this.init();
    }

    init() {
        console.log('Initializing MoleculeSimulator');
        this.resizeCanvas();
        this.startVideo();
        this.animate();
        this.setupEventListeners();
    }

    resizeCanvas() {
        const container = document.getElementById('container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        console.log(`Canvas resized to ${this.canvas.width}x${this.canvas.height}`);
    }

    startVideo() {
        console.log('Starting video capture');
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                this.video.srcObject = stream;
                this.video.addEventListener('loadeddata', () => {
                    console.log('Video data loaded');
                    this.video.width = this.video.videoWidth;
                    this.video.height = this.video.videoHeight;
                    this.initCircles();
                    this.captureVideoFrame();
                });
            })
            .catch(err => {
                console.error('Error accessing webcam:', err);
                alert('Please allow access to your webcam.');
            });
    }

    initCircles() {
        console.log(`Initializing ${this.numCircles} circles`);
        this.circles = [];
        const gridSize = Math.sqrt(this.numCircles);
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const posX = (x + 0.5) * (this.canvas.width / gridSize);
                const posY = (y + 0.5) * (this.canvas.height / gridSize);
                const radius = Math.max(1, this.medianCircleSize + (Math.random() - 0.5) * this.sizeRandomness * this.medianCircleSize);
                const circle = new Circle(posX, posY, radius, 'rgb(0, 0, 0)');
                this.circles.push(circle);
            }
        }
    }

    captureVideoFrame() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.video.videoWidth;
        tempCanvas.height = this.video.videoHeight;
        const tempCtx = tempCanvas.getContext('2d');

        const capture = () => {
            tempCtx.drawImage(this.video, 0, 0, tempCanvas.width, tempCanvas.height);
            this.previousImageData = this.currentImageData;
            this.currentImageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            requestAnimationFrame(capture);
        };

        capture();
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.currentImageData && this.previousImageData) {
            const movementData = this.detectMovement(this.currentImageData, this.previousImageData);
            this.updateCircles(movementData);
        }

        for (let i = 0; i < this.circles.length; i++) {
            this.circles[i].draw(this.ctx);
            for (let j = i + 1; j < this.circles.length; j++) {
                this.circles[i].resolveCollision(this.circles[j]);
            }
        }

        requestAnimationFrame(() => this.animate());
    }

    detectMovement(currentImageData, previousImageData) {
        const movementThreshold = 30;
        const blockSize = 16;
        const width = currentImageData.width;
        const height = currentImageData.height;
        const movementData = [];

        for (let y = 0; y < height; y += blockSize) {
            for (let x = 0; x < width; x += blockSize) {
                let movement = 0;
                for (let by = 0; by < blockSize; by++) {
                    for (let bx = 0; bx < blockSize; bx++) {
                        const i = ((y + by) * width + (x + bx)) * 4;
                        const rDiff = Math.abs(currentImageData.data[i] - previousImageData.data[i]);
                        const gDiff = Math.abs(currentImageData.data[i + 1] - previousImageData.data[i + 1]);
                        const bDiff = Math.abs(currentImageData.data[i + 2] - previousImageData.data[i + 2]);
                        movement += rDiff + gDiff + bDiff;
                    }
                }
                if (movement > movementThreshold) {
                    movementData.push({ x: x + blockSize / 2, y: y + blockSize / 2 });
                }
            }
        }
        return movementData;
    }

    updateCircles(movementData) {
        if (movementData.length > 0) {
            const centerX = movementData.reduce((sum, point) => sum + point.x, 0) / movementData.length;
            const centerY = movementData.reduce((sum, point) => sum + point.y, 0) / movementData.length;

            this.circles.forEach(circle => {
                circle.update(centerX, centerY, true, this.entropySpeed);
            });
        } else {
            this.circles.forEach(circle => {
                circle.update(0, 0, false, this.entropySpeed);
            });
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners');
        window.addEventListener('resize', () => this.resizeCanvas(), false);
        this.dragHandle.addEventListener('mousedown', (e) => this.dragStart(e), false);
        document.addEventListener('mouseup', (e) => this.dragEnd(e), false);
        document.addEventListener('mousemove', (e) => this.drag(e), false);

        this.minimizeHandle.addEventListener('click', () => {
            this.controls.classList.add('fade-out');
            setTimeout(() => {
                this.controls.style.display = 'none';
                this.restoreHandle.style.display = 'block';
                this.restoreHandle.classList.add('fade-in');
            }, 500);
        });

        this.restoreHandle.addEventListener('click', () => {
            this.restoreHandle.classList.add('fade-out');
            setTimeout(() => {
                this.restoreHandle.style.display = 'none';
                this.controls.style.display = 'block';
                this.controls.classList.remove('fade-out');
                this.controls.classList.add('fade-in');
            }, 500);
        });

        const sliders = [
            { slider: this.opacitySlider, fill: document.getElementById('opacityFill') },
            { slider: this.numCirclesSlider, fill: document.getElementById('numCirclesFill') },
            { slider: this.randomnessSlider, fill: document.getElementById('randomnessFill') },
            { slider: this.medianSizeSlider, fill: document.getElementById('medianSizeFill') },
            { slider: this.entropySpeedSlider, fill: document.getElementById('entropySpeedFill') }
        ];

        sliders.forEach(({ slider, fill }) => {
            this.updateSliderFill(slider, fill);
            slider.addEventListener('input', () => this.updateSliderFill(slider, fill));
        });
    }

    dragStart(e) {
        this.initialX = e.clientX - this.xOffset;
        this.initialY = e.clientY - this.yOffset;
        if (e.target === this.dragHandle) this.isDragging = true;
    }

    dragEnd(e) {
        this.initialX = this.currentX;
        this.initialY = this.currentY;
        this.isDragging = false;
    }

    drag(e) {
        if (this.isDragging) {
            e.preventDefault();
            this.currentX = e.clientX - this.initialX;
            this.currentY = e.clientY - this.initialY;
            this.xOffset = this.currentX;
            this.yOffset = this.currentY;
            this.setTranslate(this.currentX, this.currentY, this.controls);
        }
    }

    setTranslate(xPos, yPos, el) {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }

    updateSliderFill(slider, fillElement) {
        const percentage = (slider.value - slider.min) / (slider.max - slider.min) * 100;
        fillElement.style.width = percentage + '%';
    }
}

class Circle {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.vx = 0;
        this.vy = 0;
        this.isMoving = false;
        this.decayTime = 0;
    }

    update(targetX, targetY, isMoving, entropySpeed) {
        if (isMoving) {
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            this.vx += dx * 0.03;
            this.vy += dy * 0.03;
            this.decayTime = 50;
        } else if (this.decayTime > 0) {
            this.decayTime -= 1;
        } else {
            this.vx += (Math.random() - 0.5) * entropySpeed * 2;
            this.vy += (Math.random() - 0.5) * entropySpeed * 2;
        }

        const friction = 0.95 - (entropySpeed * 0.1);
        this.vx *= friction;
        this.vy *= friction;

        this.x += this.vx;
        this.y += this.vy;

        // Boundary checking
        if (this.x < this.radius) {
            this.x = this.radius;
            this.vx *= -1;
        } else if (this.x > window.innerWidth - this.radius) {
            this.x = window.innerWidth - this.radius;
            this.vx *= -1;
        }
        if (this.y < this.radius) {
            this.y = this.radius;
            this.vy *= -1;
        } else if (this.y > window.innerHeight - this.radius) {
            this.y = window.innerHeight - this.radius;
            this.vy *= -1;
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    resolveCollision(otherCircle) {
        const dx = otherCircle.x - this.x;
        const dy = otherCircle.y - this.y;
        const dist = Math.hypot(dx, dy);
        const minDist = this.radius + otherCircle.radius;

        if (dist < minDist) {
            const overlap = minDist - dist;
            const offsetX = (dx / dist) * (overlap / 2);
            const offsetY = (dy / dist) * (overlap / 2);

            this.x -= offsetX;
            this.y -= offsetY;
            otherCircle.x += offsetX;
            otherCircle.y += offsetY;
        }
    }
}

// Make the class available globally
window.MoleculeSimulator = MoleculeSimulator;

console.log('molecule-simulator.js loaded successfully');
