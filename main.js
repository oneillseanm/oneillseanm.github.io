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

const sections = document.querySelectorAll("article[id]");
const navLinks = document.querySelectorAll(".nav-wrapper a");

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      navLinks.forEach((link) => link.classList.remove("active"));

      const targetId = entry.target.id;
      const activeLink = document.querySelector(`.nav-wrapper a[href="#${targetId}"]`);
      if (activeLink) activeLink.classList.add("active");
    }
  });
}, {
  threshold: 0.25, // fires when 25% of the section is visible
  rootMargin: "-40% 0px -55% 0px" // triggers when section top is around middle of screen
});

sections.forEach((section) => observer.observe(section));



// menu blur on scroll

window.addEventListener('scroll', () => {
  document.querySelector('nav').classList.toggle('blurred', window.scrollY > 10);
});