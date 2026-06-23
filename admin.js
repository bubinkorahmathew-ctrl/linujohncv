/**
 * Admin Panel Logic for Linu John Portfolio
 * Built with Supabase for Backend-as-a-Service
 */

// --- CONFIGURATION ---
// Retrieve settings from the global config.js if it exists, otherwise fall back to defaults
const sUrl = (typeof SUPABASE_URL !== 'undefined') ? SUPABASE_URL : 'https://YOUR_PROJECT_ID.supabase.co';
const sKey = (typeof SUPABASE_ANON_KEY !== 'undefined') ? SUPABASE_ANON_KEY : 'YOUR_ANON_KEY';

let supabaseClient = null;
const isConfigured = sUrl !== 'https://YOUR_PROJECT_ID.supabase.co' && sUrl && sKey;

if (isConfigured) {
    // Avoid name collision with global 'supabase' object from CDN
    supabaseClient = supabase.createClient(sUrl, sKey);
}

document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const loginOverlay = document.getElementById('login-overlay');
    const adminDashboard = document.getElementById('admin-dashboard');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    
    const navItems = document.querySelectorAll('.nav-item');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const tabTitle = document.getElementById('tab-title');
    const saveGeneralBtn = document.querySelector('.save-general-btn');
    
    let profileId = null; // Track current profile primary key

    // --- Configuration Warning Banners ---
    if (!isConfigured) {
        const banner = document.createElement('div');
        banner.className = 'warn-banner';
        banner.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <span><strong>Supabase is not configured!</strong> Please update <code>config.js</code> with your project's URL and Anon Key to activate backend operations.</span>`;
        
        // Show banner in login card
        const loginCard = document.querySelector('.login-card');
        if (loginCard) {
            loginCard.prepend(banner.cloneNode(true));
        }
        // Show banner on dashboard main content
        const body = document.querySelector('.content-body');
        if (body) {
            body.prepend(banner);
        }
        console.warn('Supabase configuration missing in config.js.');
    }

    // --- Authentication Flow ---
    const checkSession = async () => {
        if (!supabaseClient) {
            showLogin();
            return;
        }
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session) {
                showDashboard();
            } else {
                showLogin();
            }
        } catch (e) {
            console.error('Session check failed:', e);
            showLogin();
        }
    };

    const showDashboard = () => {
        loginOverlay.classList.add('hidden');
        adminDashboard.classList.remove('hidden');
        loadAllData();
    };

    const showLogin = () => {
        loginOverlay.classList.remove('hidden');
        adminDashboard.classList.add('hidden');
    };

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!supabaseClient) {
            loginError.innerText = 'Cannot authenticate: Supabase is not configured.';
            return;
        }
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        loginError.innerText = 'Signing in...';
        
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            loginError.innerText = error.message;
        } else {
            loginError.innerText = '';
            showDashboard();
        }
    });

    logoutBtn.addEventListener('click', async () => {
        if (supabaseClient) {
            await supabaseClient.auth.signOut();
        }
        showLogin();
    });

    // --- Tab Navigation ---
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-tab');
            
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            tabPanes.forEach(pane => pane.classList.remove('active'));
            const targetPane = document.getElementById(target);
            if (targetPane) targetPane.classList.add('active');
            
            tabTitle.innerText = item.innerText.trim();

            // Hide/Show Save button based on active tab
            if (target === 'profile-tab') {
                saveGeneralBtn.style.display = 'inline-flex';
            } else {
                saveGeneralBtn.style.display = 'none';
            }
        });
    });

    // --- Load Data & Hydrate Panel ---
    const loadAllData = async () => {
        if (!supabaseClient) return;
        loadProfile();
        loadExperience();
        loadSkills();
        loadCertificates();
        loadFilesInfo();
    };

    const loadProfile = async () => {
        const { data, error } = await supabaseClient.from('profile').select('*').single();
        if (data && !error) {
            profileId = data.id;
            document.getElementById('prof-name').value = data.full_name || '';
            document.getElementById('prof-title').value = data.title || '';
            document.getElementById('prof-location').value = data.location || '';
            document.getElementById('prof-about').value = data.about_text || '';
            
            // Populate contact fields
            document.getElementById('prof-email').value = data.email || '';
            document.getElementById('prof-phone').value = data.phone || '';
            document.getElementById('prof-linkedin').value = data.linkedin_url || '';
        }
    };

    const loadExperience = async () => {
        const { data, error } = await supabaseClient.from('experience').select('*').order('order_index');
        const list = document.getElementById('experience-list');
        if (!list) return;
        list.innerHTML = '';
        if (data && !error) {
            if (data.length === 0) {
                list.innerHTML = '<p style="color:var(--admin-text-dim); text-align:center; padding:20px;">No experiences added yet.</p>';
                return;
            }
            data.forEach(item => {
                const card = document.createElement('div');
                card.className = 'item-card';
                card.innerHTML = `
                    <div class="item-info">
                        <h4>${item.role} ${item.is_current ? '<span style="font-size:0.75rem; background:rgba(99,102,241,0.2); color:#6366f1; padding:2px 8px; border-radius:10px; margin-left:10px;">Current</span>' : ''}</h4>
                        <p>${item.company} | ${item.dates}</p>
                        <small style="color:var(--admin-text-dim); display:block; margin-top:4px;">Sort Index: ${item.order_index}</small>
                    </div>
                    <div class="item-actions">
                        <button class="icon-btn" onclick="editExp('${item.id}')"><i class="fa-solid fa-pen"></i></button>
                        <button class="icon-btn delete" onclick="deleteExp('${item.id}')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `;
                list.appendChild(card);
            });
        }
    };

    const loadSkills = async () => {
        const { data, error } = await supabaseClient.from('skills').select('*').order('level', { ascending: false });
        const list = document.getElementById('skills-list');
        if (!list) return;
        list.innerHTML = '';
        if (data && !error) {
            if (data.length === 0) {
                list.innerHTML = '<p style="color:var(--admin-text-dim); text-align:center; padding:20px; grid-column:span 3;">No skills added yet.</p>';
                return;
            }
            data.forEach(item => {
                const card = document.createElement('div');
                card.className = 'card skill-item';
                card.style.marginBottom = '0';
                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong>${item.name}</strong>
                        <span>${item.level}%</span>
                    </div>
                    <div style="font-size:0.8rem; color:var(--admin-text-dim); margin-top:5px; text-transform:capitalize;">
                        Category: ${item.category === 'tag' ? 'key proficiency' : item.category}
                    </div>
                    <div class="item-actions" style="margin-top:15px; justify-content:flex-end;">
                        <button class="icon-btn" onclick="editSkill('${item.id}')"><i class="fa-solid fa-pen"></i></button>
                        <button class="icon-btn delete" onclick="deleteSkill('${item.id}')"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                `;
                list.appendChild(card);
            });
        }
    };

    const loadCertificates = async () => {
        const { data, error } = await supabaseClient.from('certificates').select('*').order('created_at', { ascending: false });
        const list = document.getElementById('certificates-list');
        if (!list) return;
        list.innerHTML = '';
        if (data && !error) {
            if (data.length === 0) {
                list.innerHTML = '<p style="color:var(--admin-text-dim); text-align:center; padding:20px;">No certificates uploaded yet.</p>';
                return;
            }
            data.forEach(item => {
                const card = document.createElement('div');
                card.className = 'item-card';
                card.innerHTML = `
                    <div class="item-info">
                        <h4>${item.name}</h4>
                        <p>${item.issuer ? 'Issued by ' + item.issuer : ''}</p>
                        ${item.file_url ? `<a href="${item.file_url}" target="_blank" style="color:var(--admin-primary); font-size:0.85rem; text-decoration:none;"><i class="fa-solid fa-external-link"></i> View Document</a>` : ''}
                    </div>
                    <div class="item-actions">
                        <button class="icon-btn delete" onclick="deleteCert('${item.id}')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `;
                list.appendChild(card);
            });
        }
    };

    const loadFilesInfo = async () => {
        const { data } = await supabaseClient.from('profile').select('cv_url').single();
        if (data?.cv_url) {
            document.getElementById('cv-filename').innerText = "Main CV PDF is currently uploaded";
        }
    };

    // --- Save Profile Changes ---
    saveGeneralBtn.addEventListener('click', async () => {
        if (!supabaseClient) return alert('Supabase is not configured!');
        const status = document.getElementById('save-status');
        status.innerText = 'Saving...';
        status.style.color = '#10b981';

        const profileData = {
            full_name: document.getElementById('prof-name').value,
            title: document.getElementById('prof-title').value,
            location: document.getElementById('prof-location').value,
            about_text: document.getElementById('prof-about').value,
            email: document.getElementById('prof-email').value,
            phone: document.getElementById('prof-phone').value,
            linkedin_url: document.getElementById('prof-linkedin').value,
        };

        if (profileId) {
            profileData.id = profileId;
        }

        const { data, error } = await supabaseClient.from('profile').upsert(profileData).select();
        
        if (error) {
            status.innerText = 'Error saving profile: ' + error.message;
            status.style.color = '#ef4444';
        } else {
            if (data && data.length > 0) {
                profileId = data[0].id;
            }
            status.innerText = 'Changes saved successfully!';
            status.style.color = '#10b981';
            setTimeout(() => status.innerText = '', 3000);
        }
    });

    // --- CV Upload Management ---
    document.getElementById('upload-cv-confirm').addEventListener('click', async () => {
        if (!supabaseClient) return alert('Supabase is not configured!');
        const fileInput = document.getElementById('cv-upload');
        if (!fileInput.files.length) return alert('Please choose a file first');
        
        const file = fileInput.files[0];
        const status = document.getElementById('save-status');
        status.innerText = 'Uploading CV...';
        status.style.color = '#10b981';

        const fileExt = file.name.split('.').pop();
        const fileName = `linu_john_cv_${Date.now()}.${fileExt}`;
        const filePath = `resumes/${fileName}`;

        const { error: uploadError } = await supabaseClient.storage.from('documents').upload(filePath, file);

        if (uploadError) {
            status.innerText = 'Upload failed: ' + uploadError.message;
            status.style.color = '#ef4444';
            return;
        }

        const { data: { publicUrl } } = supabaseClient.storage.from('documents').getPublicUrl(filePath);

        const profileUpdate = { cv_url: publicUrl };
        if (profileId) {
            profileUpdate.id = profileId;
        }
        
        const { error: dbError } = await supabaseClient.from('profile').upsert(profileUpdate);
        
        if (dbError) {
            status.innerText = 'Error saving CV URL: ' + dbError.message;
            status.style.color = '#ef4444';
        } else {
            status.innerText = 'CV uploaded successfully!';
            document.getElementById('cv-filename').innerText = file.name;
            setTimeout(() => status.innerText = '', 3000);
        }
    });

    // --- Certificate Upload Management ---
    document.getElementById('upload-cert-confirm').addEventListener('click', async (e) => {
        e.preventDefault();
        if (!supabaseClient) return alert('Supabase is not configured!');
        
        const certName = document.getElementById('cert-name').value.trim();
        const certIssuer = document.getElementById('cert-issuer').value.trim();
        const fileInput = document.getElementById('cert-upload');
        
        if (!certName) return alert('Please enter a certificate name.');
        if (!fileInput.files.length) return alert('Please select a file.');
        
        const file = fileInput.files[0];
        const status = document.getElementById('save-status');
        status.innerText = 'Uploading Certificate...';
        status.style.color = '#10b981';

        const fileExt = file.name.split('.').pop();
        const fileName = `cert_${Date.now()}.${fileExt}`;
        const filePath = `certificates/${fileName}`;

        const { error: uploadError } = await supabaseClient.storage.from('documents').upload(filePath, file);

        if (uploadError) {
            status.innerText = 'Upload failed: ' + uploadError.message;
            status.style.color = '#ef4444';
            return;
        }

        const { data: { publicUrl } } = supabaseClient.storage.from('documents').getPublicUrl(filePath);

        const { error: dbError } = await supabaseClient.from('certificates').insert({
            name: certName,
            issuer: certIssuer,
            file_url: publicUrl
        });

        if (dbError) {
            status.innerText = 'Database record creation failed: ' + dbError.message;
            status.style.color = '#ef4444';
        } else {
            status.innerText = 'Certificate saved successfully!';
            document.getElementById('cert-name').value = '';
            document.getElementById('cert-issuer').value = '';
            fileInput.value = '';
            document.querySelector('label[for="cert-upload"]').innerText = 'Choose File';
            loadCertificates();
            setTimeout(() => status.innerText = '', 3000);
        }
    });

    // --- Dynamic file labels ---
    const cvUpload = document.getElementById('cv-upload');
    if (cvUpload) {
        cvUpload.addEventListener('change', () => {
            const filename = cvUpload.files.length ? cvUpload.files[0].name : 'Choose PDF';
            document.getElementById('cv-filename').innerText = filename;
            document.querySelector('label[for="cv-upload"]').innerText = filename;
        });
    }

    const certUpload = document.getElementById('cert-upload');
    if (certUpload) {
        certUpload.addEventListener('change', () => {
            const filename = certUpload.files.length ? certUpload.files[0].name : 'Choose File';
            document.querySelector('label[for="cert-upload"]').innerText = filename;
        });
    }

    // --- Modals Form Submissions ---
    document.getElementById('experience-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!supabaseClient) return;
        
        const id = document.getElementById('exp-id').value;
        const resps = document.getElementById('exp-responsibilities').value
            .split('\n')
            .map(r => r.trim())
            .filter(r => r.length > 0);

        const payload = {
            role: document.getElementById('exp-role').value,
            company: document.getElementById('exp-company').value,
            location: document.getElementById('exp-location').value,
            dates: document.getElementById('exp-dates').value,
            is_current: document.getElementById('exp-current').checked,
            order_index: parseInt(document.getElementById('exp-order').value) || 0,
            responsibilities: resps
        };

        let result;
        if (id) {
            payload.id = id;
            result = await supabaseClient.from('experience').upsert(payload);
        } else {
            result = await supabaseClient.from('experience').insert(payload);
        }

        if (result.error) {
            alert('Error saving experience: ' + result.error.message);
        } else {
            closeExperienceModal();
            loadExperience();
        }
    });

    document.getElementById('skill-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!supabaseClient) return;
        
        const id = document.getElementById('skill-id').value;
        const payload = {
            name: document.getElementById('skill-name').value,
            level: parseInt(document.getElementById('skill-level').value) || 80,
            category: document.getElementById('skill-category').value
        };

        let result;
        if (id) {
            payload.id = id;
            result = await supabaseClient.from('skills').upsert(payload);
        } else {
            result = await supabaseClient.from('skills').insert(payload);
        }

        if (result.error) {
            alert('Error saving skill: ' + result.error.message);
        } else {
            closeSkillModal();
            loadSkills();
        }
    });

    // --- Modal Opening Triggers ---
    const addExpBtn = document.getElementById('add-exp-btn');
    if (addExpBtn) {
        addExpBtn.addEventListener('click', () => {
            document.getElementById('exp-id').value = '';
            document.getElementById('experience-form').reset();
            document.getElementById('exp-modal-title').innerText = 'Add Work Experience';
            document.getElementById('experience-modal').classList.remove('hidden');
        });
    }

    const addSkillBtn = document.getElementById('add-skill-btn');
    if (addSkillBtn) {
        addSkillBtn.addEventListener('click', () => {
            document.getElementById('skill-id').value = '';
            document.getElementById('skill-form').reset();
            document.getElementById('skill-modal-title').innerText = 'Add Skill / Competency';
            document.getElementById('skill-modal').classList.remove('hidden');
        });
    }

    // --- GLOBAL ACTIONS (Exposed on window) ---
    window.closeExperienceModal = () => {
        document.getElementById('experience-modal').classList.add('hidden');
    };

    window.closeSkillModal = () => {
        document.getElementById('skill-modal').classList.add('hidden');
    };

    window.editExp = async (id) => {
        if (!supabaseClient) return;
        const { data, error } = await supabaseClient.from('experience').select('*').eq('id', id).single();
        if (data && !error) {
            document.getElementById('exp-id').value = data.id;
            document.getElementById('exp-role').value = data.role || '';
            document.getElementById('exp-company').value = data.company || '';
            document.getElementById('exp-location').value = data.location || '';
            document.getElementById('exp-dates').value = data.dates || '';
            document.getElementById('exp-current').checked = data.is_current || false;
            document.getElementById('exp-order').value = data.order_index || 0;
            document.getElementById('exp-responsibilities').value = data.responsibilities ? data.responsibilities.join('\n') : '';
            
            document.getElementById('exp-modal-title').innerText = 'Edit Work Experience';
            document.getElementById('experience-modal').classList.remove('hidden');
        } else {
            alert('Failed to load experience details.');
        }
    };

    window.deleteExp = async (id) => {
        if (!supabaseClient) return;
        if (confirm('Are you sure you want to delete this experience role?')) {
            const { error } = await supabaseClient.from('experience').delete().eq('id', id);
            if (error) {
                alert('Error deleting experience: ' + error.message);
            } else {
                loadExperience();
            }
        }
    };

    window.editSkill = async (id) => {
        if (!supabaseClient) return;
        const { data, error } = await supabaseClient.from('skills').select('*').eq('id', id).single();
        if (data && !error) {
            document.getElementById('skill-id').value = data.id;
            document.getElementById('skill-name').value = data.name || '';
            document.getElementById('skill-level').value = data.level || 80;
            document.getElementById('skill-category').value = data.category || 'operational';
            
            document.getElementById('skill-modal-title').innerText = 'Edit Skill / Competency';
            document.getElementById('skill-modal').classList.remove('hidden');
        } else {
            alert('Failed to load skill details.');
        }
    };

    window.deleteSkill = async (id) => {
        if (!supabaseClient) return;
        if (confirm('Are you sure you want to delete this skill?')) {
            const { error } = await supabaseClient.from('skills').delete().eq('id', id);
            if (error) {
                alert('Error deleting skill: ' + error.message);
            } else {
                loadSkills();
            }
        }
    };

    window.deleteCert = async (id) => {
        if (!supabaseClient) return;
        if (confirm('Are you sure you want to delete this certificate?')) {
            const { error } = await supabaseClient.from('certificates').delete().eq('id', id);
            if (error) {
                alert('Error deleting certificate: ' + error.message);
            } else {
                loadCertificates();
            }
        }
    };

    // --- Init Session ---
    if (isConfigured) {
        checkSession();
    } else {
        showLogin();
    }
});
