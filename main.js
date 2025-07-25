// knob rotation animation

const title = document.getElementById('title');
const needle = document.querySelector('.needle');

let angle = 0;
let spinning = false;
let lastTimestamp = null;
const speed = 90; // degrees per second

function animate(timestamp) {
  if (!spinning) return;

  if (lastTimestamp !== null) {
    const delta = (timestamp - lastTimestamp) / 1000; // seconds
    angle = (angle + delta * speed) % 360;
	needle.style.transform = `translate(-50%, 0%) rotate(${angle}deg) translateY(-35%)`;
  }

  lastTimestamp = timestamp;
  requestAnimationFrame(animate);
}

title.addEventListener('mouseenter', () => {
  if (!spinning) {
    spinning = true;
    lastTimestamp = null;
    requestAnimationFrame(animate);
  }
});

title.addEventListener('mouseleave', () => {
  spinning = false;
});



// debug toggle: shift + b

document.addEventListener('keydown', e => {
  if (e.shiftKey && e.key.toLowerCase() === 'b') {
    document.body.classList.toggle('debug');
  }
});



// debug viewport width

  function updateViewportWidth() {
    const el = document.getElementById('viewport-width');
    if (el) el.textContent = `${window.innerWidth}px`;
  }

  window.addEventListener('resize', updateViewportWidth);
  window.addEventListener('DOMContentLoaded', updateViewportWidth);
