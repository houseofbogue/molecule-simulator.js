class MoleculeSimulator {
  constructor() {
    console.log("MoleculeSimulator constructor called");
    this.video = document.getElementById('video');
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

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

    this.medianCircleSize = parseInt(this.medianSizeSlider.value);
    this.sizeRandomness = parseInt(this.randomnessSlider.value) / 100;
    this.numCircles = parseInt(this.numCirclesSlider.value);
    this.entropySpeed = parseInt(this.entropySpeedSlider.value) / 100;

    this.circles = [];
    this.currentImageData = null;
    this.previousImageData = null;

    this.spatialHash = new SpatialHash(50);

    this.init();
  }

  init() {
    console.log("Initializing MoleculeSimulator");
    this.resizeCanvas();
    this.startVideo();
    this.setupEventListeners();
    this.animate();
  }

  resizeCanvas() {
    const container = document.getElementById('container');
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    console.log(`Canvas resized to ${this.canvas.width}x${this.canvas.height}`);
  }

  startVideo() {
    console.log("Starting video capture");
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        this.video.srcObject = stream;
        this.video.addEventListener('loadeddata', () => {
          console.log("Video data loaded");
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
    for (let i = 0; i < this.numCircles; i++) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;
      const radius = Math.max(1, this.medianCircleSize + (Math.random() - 0.5) * this.sizeRandomness * this.medianCircleSize);
      this.circles.push(new Circle(x, y, radius, 'rgb(0, 0, 0)'));
    }
  }

  captureVideoFrame() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.video.videoWidth;
    tempCanvas.height = this.video.videoHeight;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

    let frameCount = 0;
    const captureInterval = 5;

    const capture = () => {
      frameCount++;
      if (frameCount % captureInterval === 0) {
        this.previousImageData = this.currentImageData;
        tempCtx.drawImage(this.video, 0, 0, tempCanvas.width, tempCanvas.height);
        this.currentImageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      }
      requestAnimationFrame(capture);
    };

    capture();
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    let totalX = 0;
    let totalY = 0;
    let movingCirclesCount = 0;

    this.circles.forEach(circle => {
      this.updateCircle(circle);
      circle.draw(this.ctx);

      if (circle.isMoving) {
        totalX += circle.x;
        totalY += circle.y;
        movingCirclesCount++;
      }
    });

    const centerX = movingCirclesCount > 0 ? totalX / movingCirclesCount : this.canvas.width / 2;
    const centerY = movingCirclesCount > 0 ? totalY / movingCirclesCount : this.canvas.height / 2;

    this.circles.forEach(circle => {
      circle.update(centerX, centerY, circle.isMoving, this.entropySpeed);
    });

    this.spatialHash.clear();
    this.circles.forEach(circle => this.spatialHash.insert(circle));

    this.circles.forEach(circle => {
      const potentialCollisions = this.spatialHash.getPotentialCollisions(circle);
      potentialCollisions.forEach(otherCircle => {
        if (circle !== otherCircle) {
          circle.resolveCollision(otherCircle);
        }
      });
    });

    requestAnimationFrame(() => this.animate());
  }

  updateCircle(circle) {
    if (this.currentImageData && this.previousImageData) {
      const videoX = Math.floor((circle.x / this.canvas.width) * this.currentImageData.width);
      const videoY = Math.floor((circle.y / this.canvas.height) * this.currentImageData.height);
      const index = (videoY * this.currentImageData.width + videoX) * 4;

      const colorDiff = Math.abs(this.currentImageData.data[index] - this.previousImageData.data[index]) +
                        Math.abs(this.currentImageData.data[index + 1] - this.previousImageData.data[index + 1]) +
                        Math.abs(this.currentImageData.data[index + 2] - this.previousImageData.data[index + 2]);

      const movementThreshold = 50;
      circle.isMoving = colorDiff > movementThreshold;

      if (circle.isMoving) {
        circle.color = `rgb(${this.currentImageData.data[index]}, ${this.currentImageData.data[index + 1]}, ${this.currentImageData.data[index + 2]})`;
      }
    }
  }

  takeSelfie() {
    console.log("Taking selfie");
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    this.circles.forEach(circle => {
      tempCtx.beginPath();
      tempCtx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
      tempCtx.fillStyle = circle.color;
      tempCtx.fill();
    });

    const dataURL = tempCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'molecule_selfie.png';
    link.click();
  }

  setupEventListeners() {
    console.log("Setting up event listeners");
    window.addEventListener('resize', () => this.resizeCanvas());

    this.opacitySlider.addEventListener('input', () => {
      const opacity = parseInt(this.opacitySlider.value);
      this.opacityValue.textContent = opacity + '%';
      this.video.style.opacity = opacity / 100;
    });

    this.numCirclesSlider.addEventListener('input', () => {
      this.numCircles = parseInt(this.numCirclesSlider.value);
      this.numCirclesValue.textContent = this.numCircles;
      this.initCircles();
    });

    this.randomnessSlider.addEventListener('input', () => {
      this.sizeRandomness = parseInt(this.randomnessSlider.value) / 100;
      this.randomnessValue.textContent = `${this.randomnessSlider.value}%`;
      this.initCircles();
    });

    this.medianSizeSlider.addEventListener('input', () => {
      this.medianCircleSize = parseInt(this.medianSizeSlider.value);
      this.medianSizeValue.textContent = this.medianCircleSize;
      this.initCircles();
    });

    this.entropySpeedSlider.addEventListener('input', () => {
      this.entropySpeed = parseInt(this.entropySpeedSlider.value) / 100;
      this.entropySpeedValue.textContent = `${this.entropySpeedSlider.value}%`;
    });

    this.captureButton.addEventListener('click', () => this.takeSelfie());
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

    // Keep within canvas boundaries
    this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
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

class SpatialHash {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.grid = {};
  }

  getKey(x, y) {
    return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
  }

  insert(circle) {
    const key = this.getKey(circle.x, circle.y);
    if (!this.grid[key]) {
      this.grid[key] = [];
    }
    this.grid[key].push(circle);
  }

  getPotentialCollisions(circle) {
    const nearbyKeys = [
      this.getKey(circle.x, circle.y),
      this.getKey(circle.x - this.cellSize, circle.y),
      this.getKey(circle.x + this.cellSize, circle.y),
      this.getKey(circle.x, circle.y - this.cellSize),
      this.getKey(circle.x, circle.y + this.cellSize),
    ];

    return nearbyKeys.flatMap(key => this.grid[key] || []);
  }

  clear() {
    this.grid = {};
  }
}

// Initialize the simulator when the script is loaded
new MoleculeSimulator();
