document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Toggle (Cycle: Colorful -> Dark -> Light) ---
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('i');
    
    const setTheme = (theme) => {
        document.body.classList.remove('dark-mode', 'colorful-mode');
        themeIcon.classList.remove('fa-sun', 'fa-moon', 'fa-palette');
        
        if (theme === 'colorful') {
            document.body.classList.add('colorful-mode');
            themeIcon.classList.add('fa-palette');
        } else if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            themeIcon.classList.add('fa-moon');
        } else {
            themeIcon.classList.add('fa-sun');
        }
        localStorage.setItem('theme', theme);
    };

    // Initialize theme
    let currentTheme = localStorage.getItem('theme') || 'colorful';
    setTheme(currentTheme);
    
    themeToggle.addEventListener('click', () => {
        if (currentTheme === 'colorful') {
            currentTheme = 'dark';
        } else if (currentTheme === 'dark') {
            currentTheme = 'light';
        } else {
            currentTheme = 'colorful';
        }
        setTheme(currentTheme);
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

    // --- Scroll Reveal Animations (Intersection Observer) ---
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
            
            // Animate progress bars if present (dynamically selected)
            if (entry.target.classList.contains('skills') || entry.target.closest('#skills')) {
                const activeProgressBars = entry.target.querySelectorAll('.progress');
                activeProgressBars.forEach(bar => {
                    const width = bar.getAttribute('data-width');
                    bar.style.width = width;
                });
            }

            // Animate counters if present
            if (entry.target.classList.contains('counter-card') || entry.target.closest('#counter-section')) {
                const targets = entry.target.querySelectorAll('.counter-number');
                const runCounter = (el) => {
                    if (el.classList.contains('counted')) return;
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

    // Initial observe
    document.querySelectorAll('.reveal').forEach(el => {
        revealObserver.observe(el);
    });


    // --- Supabase Dynamic Content Loading ---
    // Safe lookup of config variables from config.js
    const sUrl = (typeof SUPABASE_URL !== 'undefined') ? SUPABASE_URL : 'https://YOUR_PROJECT_ID.supabase.co';
    const sKey = (typeof SUPABASE_ANON_KEY !== 'undefined') ? SUPABASE_ANON_KEY : 'YOUR_ANON_KEY';
    
    const loadDynamicContent = async () => {
        if (sUrl === 'https://YOUR_PROJECT_ID.supabase.co' || !sUrl || !sKey) {
            console.log('Supabase not configured. Using static HTML defaults.');
            return;
        }

        try {
            const supabaseClient = supabase.createClient(sUrl, sKey);
            
            // 1. Fetch Profile
            const { data: profile, error: profError } = await supabaseClient.from('profile').select('*').single();
            if (profile && !profError) {
                // Update Name / Logo
                if (profile.full_name) {
                    document.querySelectorAll('.logo').forEach(logo => {
                        logo.innerHTML = `<i class="fa-solid fa-boxes-packing"></i> ${profile.full_name.toUpperCase()}`;
                    });
                    const footerBrandH3 = document.querySelector('.footer-brand h3');
                    if (footerBrandH3) footerBrandH3.innerText = profile.full_name;
                }

                // Update Title
                if (profile.title) {
                    const highlightEl = document.querySelector('.hero-title .highlight');
                    if (highlightEl) highlightEl.innerText = profile.title;
                    
                    const footerBrandP = document.querySelector('.footer-brand p');
                    if (footerBrandP) footerBrandP.innerText = profile.title;
                }

                // Update About / Bio text (supports paragraphs separated by double-newlines)
                if (profile.about_text) {
                    const aboutContainer = document.querySelector('.about-text');
                    if (aboutContainer) {
                        const titleHTML = `
                            <div class="section-header">
                                <h2>About Me</h2>
                                <div class="divider left"></div>
                            </div>
                        `;
                        const paragraphs = profile.about_text.split('\n\n')
                            .filter(p => p.trim())
                            .map(p => `<p>${p.trim()}</p>`)
                            .join('');
                        aboutContainer.innerHTML = titleHTML + paragraphs;
                    }
                }

                // Update Location
                if (profile.location) {
                    const locBadge = document.querySelector('.location-badge');
                    if (locBadge) locBadge.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${profile.location}`;
                }

                // Update CV
                if (profile.cv_url) {
                    const modalDownload = document.querySelector('.modal-body a[download]');
                    if (modalDownload) modalDownload.href = profile.cv_url;
                }

                // Update Contact details based on font-awesome icons
                const contactCards = document.querySelectorAll('.contact-card');
                contactCards.forEach(card => {
                    const icon = card.querySelector('.contact-icon i');
                    const p = card.querySelector('.contact-details p');
                    const link = card.querySelector('.contact-details a');
                    if (icon && p) {
                        if (icon.classList.contains('fa-envelope') && profile.email) {
                            p.innerHTML = `<a href="mailto:${profile.email}" style="color:var(--text-color);text-decoration:none;">${profile.email}</a>`;
                        } else if (icon.classList.contains('fa-phone') && profile.phone) {
                            p.innerHTML = profile.phone.split(',').map(num => `<a href="tel:${num.trim()}" style="color:var(--text-color);text-decoration:none;">${num.trim()}</a>`).join('<br>');
                        } else if (icon.classList.contains('fa-location-dot') && profile.location) {
                            p.innerText = profile.location;
                        } else if (icon.classList.contains('fa-linkedin') && profile.linkedin_url) {
                            if (link) {
                                link.href = profile.linkedin_url;
                            } else {
                                p.innerHTML = `<a href="${profile.linkedin_url}" target="_blank" style="color:var(--text-color);text-decoration:none;">Connect with me</a>`;
                            }
                        }
                    }
                });

                // Update social links (LinkedIn and Email) in header/footer/hero
                if (profile.linkedin_url) {
                    document.querySelectorAll('a[href*="linkedin.com"]').forEach(el => el.href = profile.linkedin_url);
                }
                if (profile.email) {
                    document.querySelectorAll('a[href^="mailto:"]').forEach(el => el.href = `mailto:${profile.email}`);
                }
                if (profile.phone) {
                    const phoneVal = profile.phone.split(',')[0].trim();
                    document.querySelectorAll('a[href^="tel:"]').forEach(el => el.href = `tel:${phoneVal}`);
                }
            }

            // 2. Fetch Experience
            const { data: experience, error: expError } = await supabaseClient.from('experience').select('*').order('order_index');
            if (experience && !expError && experience.length > 0) {
                const currentJobContainer = document.getElementById('current-job-card');
                const timelineContainer = document.getElementById('experience-timeline');
                
                const currentJobs = experience.filter(item => item.is_current);
                const pastJobs = experience.filter(item => !item.is_current);

                // Update current job card
                if (currentJobContainer) {
                    if (currentJobs.length > 0) {
                        currentJobContainer.style.display = 'block';
                        const job = currentJobs[0];
                        const respHTML = job.responsibilities ? job.responsibilities.map(r => `<li><i class="fa-solid fa-check-circle"></i> ${r}</li>`).join('') : '';
                        currentJobContainer.innerHTML = `
                            <div class="job-header">
                                <div>
                                    <h3 class="job-role">${job.role}</h3>
                                    <div class="job-company"><i class="fa-solid fa-building"></i> ${job.company} – ${job.location || ''}</div>
                                </div>
                                <div class="job-date"><i class="fa-solid fa-calendar-days"></i> ${job.dates}</div>
                            </div>
                            <div class="job-body">
                                <ul class="responsibility-list">
                                    ${respHTML}
                                </ul>
                            </div>
                        `;
                    } else {
                        currentJobContainer.style.display = 'none'; // hide if none current
                    }
                }

                // Update timeline
                if (timelineContainer && pastJobs.length > 0) {
                    timelineContainer.innerHTML = '';
                    pastJobs.forEach(job => {
                        const desc = job.responsibilities && job.responsibilities.length > 0 ? job.responsibilities[0] : '';
                        const item = document.createElement('div');
                        item.className = 'timeline-item reveal slide-up';
                        item.innerHTML = `
                            <div class="timeline-dot"></div>
                            <div class="timeline-content">
                                <div class="timeline-date">${job.dates}</div>
                                <h4 class="timeline-title">${job.role}</h4>
                                <div class="timeline-company">${job.company}${job.location ? ', ' + job.location : ''}</div>
                                <p>${desc}</p>
                            </div>
                        `;
                        timelineContainer.appendChild(item);
                    });
                }
            }

            // 3. Fetch Skills
            const { data: skills, error: skillsError } = await supabaseClient.from('skills').select('*').order('level', { ascending: false });
            if (skills && !skillsError && skills.length > 0) {
                const opColumn = document.getElementById('operational-skills-column');
                const keyTags = document.getElementById('key-proficiencies-tags');
                const techTags = document.getElementById('technical-skills-tags');

                const opSkills = skills.filter(s => s.category === 'operational');
                const keySkills = skills.filter(s => s.category === 'tag'); // 'tag' maps to Key Proficiencies
                const techSkills = skills.filter(s => s.category === 'technical');

                if (opColumn && opSkills.length > 0) {
                    const titleHTML = `<h3 class="skills-category-title"><i class="fa-solid fa-gear"></i> Operational Expertise</h3>`;
                    const barsHTML = opSkills.map(skill => `
                        <div class="skill-bar-wrapper">
                            <div class="skill-info"><span>${skill.name}</span><span>${skill.level}%</span></div>
                            <div class="progress-bar"><div class="progress" data-width="${skill.level}%"></div></div>
                        </div>
                    `).join('');
                    opColumn.innerHTML = titleHTML + barsHTML;
                }

                if (keyTags && keySkills.length > 0) {
                    keyTags.innerHTML = keySkills.map(skill => `<span class="skill-tag">${skill.name}</span>`).join('');
                }

                if (techTags && techSkills.length > 0) {
                    techTags.innerHTML = techSkills.map(skill => `<span class="skill-tag outline">${skill.name}</span>`).join('');
                }
            }

            // 4. Fetch Certificates
            const { data: certificates, error: certsError } = await supabaseClient.from('certificates').select('*').order('created_at', { ascending: false });
            if (certificates && !certsError && certificates.length > 0) {
                const certsList = document.getElementById('certifications-list');
                if (certsList) {
                    certsList.innerHTML = '';
                    certificates.forEach(cert => {
                        const li = document.createElement('li');
                        li.innerHTML = `
                            <i class="fa-solid fa-check"></i>
                            <span>
                                ${cert.file_url ? `<a href="${cert.file_url}" target="_blank" style="color:var(--text-color);text-decoration:none;font-weight:600;">${cert.name} <i class="fa-solid fa-up-right-from-square" style="font-size:0.75rem;margin-left:4px;"></i></a>` : cert.name}
                                ${cert.issuer ? `<small style="display:block;color:var(--text-light);font-size:0.8rem;margin-top:2px;">Issued by ${cert.issuer}</small>` : ''}
                            </span>
                        `;
                        certsList.appendChild(li);
                    });
                }
            }

            // Re-register newly created DOM elements for scroll reveal observer
            document.querySelectorAll('.reveal').forEach(el => {
                revealObserver.observe(el);
            });

        } catch (err) {
            console.error('Failed to load dynamic content:', err);
        }
    };

    loadDynamicContent();


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
