// ============================================
// SI-KONCI - MAIN JAVASCRIPT
// SMPN 13 Penajam Paser Utara
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // ---------- NAVBAR ----------
    const navbar = document.querySelector('.navbar');
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    // Toggle mobile menu
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Close menu on link click
    document.querySelectorAll('.nav-link, .btn-nav').forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        if (window.scrollY > 60) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // ---------- FEATURES TABS ----------
    const tabButtons = document.querySelectorAll('.tab-btn');
    const panels = {
        siswa: document.getElementById('panel-siswa'),
        guru: document.getElementById('panel-guru'),
        ortu: document.getElementById('panel-ortu')
    };

    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active from all tabs
            tabButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Hide all panels
            Object.values(panels).forEach(p => p.classList.remove('active'));

            // Show selected panel
            const tab = this.dataset.tab;
            if (panels[tab]) {
                panels[tab].classList.add('active');
            }
        });
    });

    // ---------- COUNTER ANIMATION ----------
    const statNumbers = document.querySelectorAll('.stat-number');

    function animateCounter(el) {
        const target = parseInt(el.dataset.count);
        // Lewati elemen tanpa data-count valid (mis. kartu statistik dashboard
        // guru/admin yang diisi sendiri oleh skrip halaman) agar tidak jadi "NaN%".
        if (isNaN(target)) return;
        const duration = 2000;
        const startTime = performance.now();

        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * target);

            el.textContent = current + (target > 100 ? '+' : '%');

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        }

        requestAnimationFrame(updateCounter);
    }

    // Intersection Observer for counter animation
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    if (!el.dataset.animated) {
                        el.dataset.animated = 'true';
                        animateCounter(el);
                    }
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(el => observer.observe(el));
    } else {
        // Fallback
        statNumbers.forEach(el => animateCounter(el));
    }

    // ---------- SMOOTH SCROLL ----------
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ---------- ACTIVE NAV LINK ----------
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    function updateActiveLink() {
        let current = '';
        const scrollPos = window.scrollY + 120;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', updateActiveLink);
    updateActiveLink();

    console.log('SI-KONCI SMPN 13 PPU - Inovasi Daerah 2026');
});