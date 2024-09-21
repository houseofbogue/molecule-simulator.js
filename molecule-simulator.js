console.log("Minimal camera test script starting...");

document.addEventListener('DOMContentLoaded', (event) => {
  console.log("DOM fully loaded and parsed");

  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  function startVideo() {
    console.log("Attempting to start video...");
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      console.log("getUserMedia is supported");
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          console.log("Camera access granted");
          video.srcObject = stream;
          video.onloadedmetadata = () => {
            video.play();
            console.log("Video playing");
          };
        })
        .catch(err => {
          console.error('Error accessing webcam:', err);
          alert('Error accessing webcam: ' + err.message);
        });
    } else {
      console.error("getUserMedia is not supported in this browser");
      alert('getUserMedia is not supported in this browser');
    }
  }

  function init() {
    console.log("Initializing...");
    startVideo();
  }

  init();
});

console.log("Minimal camera test script loaded successfully");
