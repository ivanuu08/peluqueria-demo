// ═══════════════════════════════════════════════════════════
// Áureo Studio — JavaScript principal
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initMenuMovil();
    initScrollReveal();
});

// ── Navbar scroll ──────────────────────────────────────────
function initNavbar() {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 60);
    });
}

// ── Menú móvil ─────────────────────────────────────────────
function initMenuMovil() {
    const toggle = document.getElementById('menuToggle');
    const links = document.getElementById('navLinks');

    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        links.classList.toggle('open');
    });

    links.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            toggle.classList.remove('active');
            links.classList.remove('open');
        });
    });
}

// ── Scroll reveal ──────────────────────────────────────────
function initScrollReveal() {
    const elements = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    elements.forEach(el => observer.observe(el));
}

// ── Toast ──────────────────────────────────────────────────
function mostrarToast(mensaje, esError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = mensaje;
    toast.className = 'toast' + (esError ? ' error' : '');
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => toast.classList.remove('visible'), 4000);
}
