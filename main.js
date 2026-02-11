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

const sections = document.querySelectorAll(".top-level-wrapper[id]");
const navLinks = document.querySelectorAll(".nav-wrapper a");

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    console.log("Now visible:", entry.target.id, entry.isIntersecting);

    if (entry.isIntersecting) {
      navLinks.forEach((link) => link.classList.remove("active"));

      const targetId = entry.target.id;
      const activeLink = document.querySelector(`.nav-wrapper a[href="#${targetId}"]`);
      if (activeLink) activeLink.classList.add("active");
    }
  });
}, {
threshold: 0.01,
rootMargin: "-10% 0px -60% 0px"
});

// ✅ ACTUALLY START OBSERVING:
sections.forEach((section) => observer.observe(section));




// menu blur on scroll

window.addEventListener('scroll', () => {
  document.querySelector('nav').classList.toggle('blurred', window.scrollY > 10);
});



// nav border control

function markRowStarts() {
  const items = [...document.querySelectorAll('nav li')]
    .filter(item => item.offsetParent !== null); // skip display:none

  let currentTop = null;

  items.forEach((item) => {
    item.classList.remove('row-start');

    const top = Math.round(item.offsetTop);
    if (top !== currentTop) {
      item.classList.add('row-start');
      currentTop = top;
    }
  });
}

window.addEventListener('load', markRowStarts);
window.addEventListener('resize', markRowStarts);

markRowStarts(); // Call this after adding/removing classes like .mobile-hidden


// viewport width display

function updateViewportWidth() {
  const el = document.getElementById('viewport-width');
  if (el) el.textContent = `${window.innerWidth}px`;
}

window.addEventListener('resize', updateViewportWidth);
updateViewportWidth(); // run once on page load


