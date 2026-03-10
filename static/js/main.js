// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const links  = document.querySelector('.nav-links');

if (toggle && links) {
  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
  });
}

// Scroll-reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.pillar, .offering-card, .resource-card, .leader-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});
