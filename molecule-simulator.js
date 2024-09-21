class MoleculeSimulator {
  constructor() {
    this.video = document.getElementById('video');
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');

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

    this.init();
  }

  init() {
    this.resizeCanvas();
    this.setupEventListeners();
    this.startVideo();
    this.animate();
  }

  resizeCanvas() {
    const container = document.getElementById('container');
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    console.log('Canvas resized:', this.canvas.width, this.canvas.height);
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.resizeCanvas(), false);

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
      console.log("Entropy speed changed to:", this.entropySpeed);
    });

    this.captureButton.addEventListener('click', () => this.takeSelfie());

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

    this.setupDragAndMinimize();
  }

  startVideo() {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        this.video.srcObject = stream;
        this.video.addEventListener('loadeddata', () => {
          console.log('Video loaded:', this.video.videoWidth, this.video.videoHeight);
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
      this.previousImageData = this.currentImageData;
      tempCtx.drawImage(this.video, 0, 0, tempCanvas.width, tempCanvas.height);
      this.currentImageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
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

    for (let i = 0; i < this.circles.length; i++) {
      for (let j = i + 1; j < this.circles.length; j++) {
        this.circles[i].resolveCollision(this.circles[j]);
      }
    }

    console.log("Average velocity:", this.calculateAverageVelocity());

    requestAnimationFrame(() => this.animate());
  }

  updateCircle(circle) {
    if (this.currentImageData && this.previousImageData) {
      const videoX = Math.floor((circle.x / this.canvas.width) * this.currentImageData.width);
      const videoY = Math.floor((circle.y / this.canvas.height) * this.currentImageData.height);
      const index = (videoY * this.currentImageData.width + videoX) * 4;

      const r1 = this.currentImageData.data[index];
      const g1 = this.currentImageData.data[index + 1];
      const b1 = this.currentImageData.data[index + 2];
      const r2 = this.previousImageData.data[index];
      const g2 = this.previousImageData.data[index + 1];
      const b2 = this.previousImageData.data[index + 2];

      const colorDiff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
      const movementThreshold = 50;

      circle.isMoving = colorDiff > movementThreshold;
      circle.color = `rgb(${r1}, ${g1}, ${b1})`;
    }
  }

  takeSelfie() {
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

  updateSliderFill(slider, fillElement) {
    const percentage = (slider.value - slider.min) / (slider.max - slider.min) * 100;
    fillElement.style.width = percentage + '%';
  }

  calculateAverageVelocity() {
    let totalVelocity = 0;
    this.circles.forEach(circle => {
      totalVelocity += Math.sqrt(circle.vx * circle.vx + circle.vy * circle.vy);
    });
    return totalVelocity / this.circles.length;
  }

  setupDragAndMinimize() {
    const controls = document.getElementById('controls');
    const dragHandle = document.getElementById('dragHandle');
    const minimizeHandle = document.getElementById('minimizeHandle');
    const restoreHandle = document.getElementById('restoreHandle');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    const dragStart = (e) => {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;

      if (e.target === dragHandle) {
        isDragging = true;
      }
    };

    const dragEnd = (e) => {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
    };

    const drag = (e) => {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;
        setTranslate(currentX, currentY, controls);
      }
    };

    const setTranslate = (xPos, yPos, el) => {
      el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    };

    dragHandle.addEventListener('mousedown', dragStart, false);
    document.addEventListener('mouseup', dragEnd, false);
    document.addEventListener('mousemove', drag, false);

    minimizeHandle.addEventListener('click', () => {
      controls.classList.add('fade-out');
      setTimeout(() => {
        controls.style.display = 'none';
        restoreHandle.style.display = 'block';
        restoreHandle.classList.add('fade-in');
      }, 500);
    });

    restoreHandle.addEventListener('click', () => {
      restoreHandle.classList.add('fade-out');
      setTimeout(() => {
        restoreHandle.style.display = 'none';
        controls.style.display = 'block';
        controls.classList.remove('fade-out');
        controls.classList.add('fade-in');
      }, 500);
    });
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

// This line allows the embed.js to create a new instance
window.MoleculeSimulator = MoleculeSimulator;
