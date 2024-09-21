function initMoleculeSimulator() {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  const opacitySlider = document.getElementById('opacitySlider');
  const opacityValue = document.getElementById('opacityValue');
  const numCirclesSlider = document.getElementById('numCirclesSlider');
  const numCirclesValue = document.getElementById('numCirclesValue');
  const randomnessSlider = document.getElementById('randomnessSlider');
  const randomnessValue = document.getElementById('randomnessValue');
  const medianSizeSlider = document.getElementById('medianSizeSlider');
  const medianSizeValue = document.getElementById('medianSizeValue');
  const entropySpeedSlider = document.getElementById('entropySpeedSlider');
  const entropySpeedValue = document.getElementById('entropySpeedValue');
  const captureButton = document.getElementById('captureButton');

  let medianCircleSize = parseInt(medianSizeSlider.value);
  let sizeRandomness = parseInt(randomnessSlider.value) / 100;
  let numCircles = parseInt(numCirclesSlider.value);
  let entropySpeed = parseInt(entropySpeedSlider.value) / 100;

  let circles = [];

  function resizeCanvas() {
    const container = document.getElementById('container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }

  window.addEventListener('resize', resizeCanvas, false);

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

    update(targetX, targetY, isMoving) {
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

  function init() {
    resizeCanvas();
    startVideo();
    animate();
  }

  function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        video.srcObject = stream;
        video.addEventListener('loadeddata', () => {
          video.width = video.videoWidth;
          video.height = video.videoHeight;

          initCircles();
          captureVideoFrame();
        });
      })
      .catch(err => {
        console.error('Error accessing webcam:', err);
        alert('Please allow access to your webcam.');
      });
  }

  function initCircles() {
    circles = [];
    const gridSize = Math.sqrt(numCircles);
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const posX = (x + 0.5) * (canvas.width / gridSize);
        const posY = (y + 0.5) * (canvas.height / gridSize);
        const radius = Math.max(1, medianCircleSize + (Math.random() - 0.5) * sizeRandomness * medianCircleSize);
        const circle = new Circle(posX, posY, radius, 'rgb(0, 0, 0)');
        circles.push(circle);
      }
    }
  }

  let currentImageData, previousImageData;

  function captureVideoFrame() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const tempCtx = tempCanvas.getContext('2d');

    function capture() {
      previousImageData = currentImageData;

      tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
      currentImageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

      requestAnimationFrame(capture);
    }

    capture();
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let totalX = 0;
    let totalY = 0;
    let movingCirclesCount = 0;

    circles.forEach(circle => {
      updateCircle(circle);
      circle.draw(ctx);

      if (circle.isMoving) {
        totalX += circle.x;
        totalY += circle.y;
        movingCirclesCount++;
      }
    });

    const centerX = movingCirclesCount > 0 ? totalX / movingCirclesCount : canvas.width / 2;
    const centerY = movingCirclesCount > 0 ? totalY / movingCirclesCount : canvas.height / 2;

    circles.forEach(circle => {
      circle.update(centerX, centerY, circle.isMoving);
    });

    for (let i = 0; i < circles.length; i++) {
      for (let j = i + 1; j < circles.length; j++) {
        circles[i].resolveCollision(circles[j]);
      }
    }

    console.log("Average velocity:", calculateAverageVelocity());

    requestAnimationFrame(animate);
  }

  function updateCircle(circle) {
    if (currentImageData && previousImageData) {
      const videoX = Math.floor((circle.x / canvas.width) * currentImageData.width);
      const videoY = Math.floor((circle.y / canvas.height) * currentImageData.height);
      const index = (videoY * currentImageData.width + videoX) * 4;

      const r1 = currentImageData.data[index];
      const g1 = currentImageData.data[index + 1];
      const b1 = currentImageData.data[index + 2];
      const r2 = previousImageData.data[index];
      const g2 = previousImageData.data[index + 1];
      const b2 = previousImageData.data[index + 2];

      const colorDiff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
      const movementThreshold = 50;

      circle.isMoving = colorDiff > movementThreshold;
      circle.color = `rgb(${r1}, ${g1}, ${b1})`;
    }
  }

  function takeSelfie() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    circles.forEach(circle => {
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

  function updateSliderFill(slider, fillElement) {
    const percentage = (slider.value - slider.min) / (slider.max - slider.min) * 100;
    fillElement.style.width = percentage + '%';
  }

  const sliders = [
    { slider: opacitySlider, fill: document.getElementById('opacityFill') },
    { slider: numCirclesSlider, fill: document.getElementById('numCirclesFill') },
    { slider: randomnessSlider, fill: document.getElementById('randomnessFill') },
    { slider: medianSizeSlider, fill: document.getElementById('medianSizeFill') },
    { slider: entropySpeedSlider, fill: document.getElementById('entropySpeedFill') }
  ];

  sliders.forEach(({ slider, fill }) => {
    updateSliderFill(slider, fill);
    slider.addEventListener('input', () => updateSliderFill(slider, fill));
  });

  opacitySlider.addEventListener('input', () => {
    const opacity = parseInt(opacitySlider.value);
    opacityValue.textContent = opacity + '%';
    video.style.opacity = opacity / 100;
  });

  numCirclesSlider.addEventListener('input', () => {
    numCircles = parseInt(numCirclesSlider.value);
    numCirclesValue.textContent = numCircles;
    initCircles();
  });

  randomnessSlider.addEventListener('input', () => {
    sizeRandomness = parseInt(randomnessSlider.value) / 100;
    randomnessValue.textContent = `${randomnessSlider.value}%`;
    initCircles();
  });

  medianSizeSlider.addEventListener('input', () => {
    medianCircleSize = parseInt(medianSizeSlider.value);
    medianSizeValue.textContent = medianCircleSize;
    initCircles();
  });

  entropySpeedSlider.addEventListener('input', () => {
    entropySpeed = parseInt(entropySpeedSlider.value) / 100;
    entropySpeedValue.textContent = `${entropySpeedSlider.value}%`;
    console.log("Entropy speed changed to:", entropySpeed);
  });

  captureButton.addEventListener('click', takeSelfie);

  function calculateAverageVelocity() {
    let totalVelocity = 0;
    circles.forEach(circle => {
      totalVelocity += Math.sqrt(circle.vx * circle.vx + circle.vy * circle.vy);
    });
    return totalVelocity / circles.length;
  }

  init();
}
