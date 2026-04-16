document.addEventListener('DOMContentLoaded', () => {
    // --- Dark Mode Toggle ---
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('i');
    
    // Check saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-mode');
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    } else {
        document.body.classList.add('dark-mode');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    }
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
            localStorage.setItem('theme', 'dark');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
            localStorage.setItem('theme', 'light');
        }
    });

    // --- Sticky Navbar ---
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // --- Mobile Menu Toggle ---
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const navLinks = document.getElementById('nav-links');
    const navItems = document.querySelectorAll('.nav-link');

    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = menuToggle.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-xmark');
        } else {
            icon.classList.remove('fa-xmark');
            icon.classList.add('fa-bars');
        }
    });

    // Close mobile menu on clicking a link
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const icon = menuToggle.querySelector('i');
            icon.classList.remove('fa-xmark');
            icon.classList.add('fa-bars');
        });
    });

    // --- Scroll Reveal Animations (Intersection Observer) ---
    const revealElements = document.querySelectorAll('.reveal');
    const progressBars = document.querySelectorAll('.progress');
    const counters = document.querySelectorAll('.counter-number');

    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            }
            
            // Add active class to fade/slide in
            entry.target.classList.add('active');
            
            // Animate progress bars if present
            if (entry.target.classList.contains('skills') || entry.target.closest('#skills')) {
                progressBars.forEach(bar => {
                    const width = bar.getAttribute('data-width');
                    bar.style.width = width;
                });
            }

            // Animate counters if present
            if (entry.target.classList.contains('counter-card') || entry.target.closest('#counter-section')) {
                // Find counters inside this specific element
                const targets = entry.target.querySelectorAll('.counter-number');
                const runCounter = (el) => {
                    if (el.classList.contains('counted')) return; // perform once
                    el.classList.add('counted');
                    
                    const target = +el.getAttribute('data-target');
                    const duration = 2000; // ms
                    const increment = target / (duration / 16); // 60fps
                    let current = 0;

                    const updateCounter = () => {
                        current += increment;
                        if (current < target) {
                            el.innerText = Math.ceil(current);
                            requestAnimationFrame(updateCounter);
                        } else {
                            el.innerText = target;
                        }
                    };
                    updateCounter();
                };

                if (entry.target.classList.contains('counter-number')) {
                    runCounter(entry.target);
                } else {
                    targets.forEach(runCounter);
                }
            }

            // Stop observing once revealed
            observer.unobserve(entry.target);
        });
    }, revealOptions);

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // --- Modal Logic ---
    const modal = document.getElementById('cv-modal');
    const openBtn = document.getElementById('open-cv-modal');
    const closeBtn = document.getElementById('close-modal');

    // Open modal
    openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // prevent scrolling behind modal
    });

    // Close modal
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    // Close modal on click outside content
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

});
