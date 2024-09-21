console.log("molecule-simulator.js starting...");

document.addEventListener('DOMContentLoaded', (event) => {
  console.log("DOM fully loaded and parsed");
  console.log("Video element:", document.getElementById('video'));

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

  function resizeCanvas() {
    const container = document.getElementById('container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    console.log("Canvas resized to:", canvas.width, "x", canvas.height);
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

  let circles = [];

  function init() {
    console.log("Initializing...");
    try {
      resizeCanvas();
      console.log("Canvas resized");
      startVideo();
      console.log("startVideo called");
      animate();
      console.log("animate called");
    } catch (error) {
      console.error("Error in init:", error);
    }
  }

  function startVideo() {
    console.log("Attempting to start video...");
    if (navigator.mediaDev
