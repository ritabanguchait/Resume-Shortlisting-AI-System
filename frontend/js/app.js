// --- FIREBASE AUTH SERVICE ---
window.FirebaseAuth = window.FirebaseAuth || {};

(function() {
    console.log('App-inlined Auth Service running');
    
    const firebaseConfig = {
        apiKey: "YOUR_FIREBASE_API_KEY",
        authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_PROJECT_ID.appspot.com",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
    };

    let auth = null;

            const initializeFirebase = () => {
                console.log('Initializing Firebase...');
                try {
                    // Check explicitly for window.firebase
                    if (window.firebase) {
                        if (!window.firebase.apps.length) {
                            window.firebase.initializeApp(firebaseConfig);
                        }
                        // Use window.firebase.auth()
                        auth = window.firebase.auth();
                        console.log('Firebase initialized successfully');
                        return true;
                    } else {
                        console.warn('Firebase SDK not loaded (window.firebase is undefined)');
                        console.log('Available window keys:', Object.keys(window).filter(k => k.startsWith('fire')));
                        return false;
                    }
                } catch (error) {
                    console.error('Firebase initialization error:', error);
                    return false;
                }
            };

            const signInWithGoogle = async () => {
                try {
                    if (!auth) {
                         const initialized = initializeFirebase();
                         if (!initialized) throw new Error('Firebase SDK failed to load. Check console.');
                    }
                    const provider = new window.firebase.auth.GoogleAuthProvider();
                    provider.addScope('email');
                    provider.addScope('profile');
                    const result = await auth.signInWithPopup(provider);
                    const user = result.user;
                    const idToken = await user.getIdToken();
                    return { idToken, email: user.email, name: user.displayName, photoURL: user.photoURL, provider: 'google' };
                } catch (error) { console.error('Google sign-in error:', error); throw error; }
            };

            const signInWithGitHub = async () => {
                try {
                    if (!auth) {
                         const initialized = initializeFirebase();
                         if (!initialized) throw new Error('Firebase SDK failed to load. Check console.');
                    }
                    const provider = new window.firebase.auth.GithubAuthProvider();
                    provider.addScope('user:email');
                    const result = await auth.signInWithPopup(provider);
                    const user = result.user;
                    const idToken = await user.getIdToken();
                    return { idToken, email: user.email, name: user.displayName || user.email.split('@')[0], photoURL: user.photoURL, provider: 'github' };
                } catch (error) { console.error('GitHub sign-in error:', error); throw error; }
            };

    const authenticateWithBackend = async (oauthData) => {
        try {
            const response = await fetch('http://localhost:5000/api/auth/oauth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(oauthData)
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Authentication failed');
            }
            return await response.json();
        } catch (error) { console.error('Backend authentication error:', error); throw error; }
    };

    const signOut = async () => { try { if (auth) await auth.signOut(); } catch (error) { console.error('Sign out error:', error); } };

    window.FirebaseAuth = { initialize: initializeFirebase, signInWithGoogle, signInWithGitHub, authenticateWithBackend, signOut };
    console.log('App-inlined Firebase Auth module loaded.');
})();
// --- END AUTH SERVICE ---

const App = (function() {
    // Store state in sessionStorage or module scope
    const STATE_KEY_RESULTS = 'analysisResults';
    
    // Module-level state for files to persist across "page loads" (view swaps)
    let uploadedFiles = [];
    let currentUser = null;

    // Helper to navigate/swap views
    const loadPage = async (pageName) => {
        try {
            // Check auth for protected pages
            const publicPages = ['index.html', 'student-login.html', 'student-signup.html', 'hr-login.html', 'hr-signup.html'];
            
            // Redirect root to student login if no session
            if (pageName === 'login.html') pageName = 'student-login.html';
            if (pageName === 'signup.html') pageName = 'student-signup.html';

            if (!publicPages.includes(pageName) && !currentUser) {
                // Try to restore session first
                const restored = await checkSession();
                if (!restored) {
                    console.log('Access denied to', pageName);
                    loadPage('student-login.html');
                    return;
                }
            }

            // Redirect logged in users away from auth pages
            if (publicPages.includes(pageName) && currentUser && pageName !== 'index.html') {
                if (currentUser.role === 'hr') loadPage('dashboard-hr.html');
                else loadPage('dashboard-student.html');
                return;
            }

            const response = await fetch(pageName);
            if (!response.ok) throw new Error(`Page not found: ${pageName}`);
            
            const html = await response.text();
            
            // Parse the HTML to extract the container content
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newContent = doc.querySelector('#app').innerHTML;
            
            document.getElementById('app').innerHTML = newContent;
            
            // Execute scripts in the new content
            const scripts = document.getElementById('app').querySelectorAll('script');
            scripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                oldScript.parentNode.replaceChild(newScript, oldScript);
            });
            
            // Re-initialize logic based on page
            if (pageName === 'job.html') initJob();
            if (pageName === 'result.html') initResults();
            if (pageName === 'result-student.html') initStudentResult();
            if (pageName === 'upload.html') initUpload();
            if (pageName === 'dashboard-hr.html' || pageName === 'dashboard.html') initHRDashboard();
            if (pageName === 'dashboard-student.html') initStudentDashboard();
            if (pageName.includes('login.html')) initAuth('login');
            if (pageName.includes('signup.html')) initAuth('signup');
            if (pageName === 'index.html') initLanding();
            
        } catch (err) {
            console.error('Navigation failed', err);
        }
    };

    // === Auth Logic ===
    const checkSession = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/auth/me', {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                currentUser = data.user;
                return true;
            }
        } catch (e) { console.error(e); }
        return false;
    };

    const initAuth = (type) => {
        const form = document.getElementById('loginForm') || document.getElementById('signupForm');
        const errorDiv = document.getElementById('authError');

        // Initialize Firebase
        if (typeof window.FirebaseAuth !== 'undefined') {
            window.FirebaseAuth.initialize();
        }

        // OAuth Button Handlers
        const googleBtn = document.getElementById('googleSignInBtn');
        const githubBtn = document.getElementById('githubSignInBtn');

        if (googleBtn) {
            googleBtn.addEventListener('click', async () => {
                await handleOAuthSignIn('google', errorDiv);
            });
        }

        if (githubBtn) {
            githubBtn.addEventListener('click', async () => {
                await handleOAuthSignIn('github', errorDiv);
            });
        }

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                errorDiv.style.display = 'none';
                errorDiv.textContent = '';
                
                const role = form.dataset.role; // 'student' or 'hr'

                const formData = {};
                if (type === 'signup') {
                    formData.name = document.getElementById('name').value;
                    formData.role = role;
                }
                formData.email = document.getElementById('email').value;
                formData.password = document.getElementById('password').value;

                try {
                    const endpoint = type === 'login' ? '/api/auth/login' : '/api/auth/signup';
                    const res = await fetch(`http://localhost:5000${endpoint}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData),
                        credentials: 'include'
                    });

                    const data = await res.json();

                    if (!res.ok) throw new Error(data.error || 'Auth failed');

                    currentUser = data.user;
                    
                    if (currentUser.role === 'hr') loadPage('dashboard-hr.html');
                    else loadPage('dashboard-student.html');

                } catch (err) {
                    errorDiv.textContent = err.message;
                    errorDiv.style.display = 'block';
                }
            });
        }
    };

    // Handle OAuth Sign In
    const handleOAuthSignIn = async (provider, errorDiv) => {
        const btn = document.getElementById(provider === 'google' ? 'googleSignInBtn' : 'githubSignInBtn');
        let originalText = '';
        
        try {
            // Log verification
            console.log('Checking FirebaseAuth...', window.FirebaseAuth);

            // Check if Firebase is available
            if (!window.FirebaseAuth || typeof window.FirebaseAuth.initialize !== 'function') {
                console.error('FirebaseAuth not found on window object');
                throw new Error('Firebase authentication module not initialized. Check console for errors.');
            }

            // Ensure initialized
            window.FirebaseAuth.initialize();

            if (errorDiv) {
                errorDiv.style.display = 'none';
                errorDiv.textContent = '';
            }

            // Show loading state
            if (btn) {
                originalText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<span>Signing in...</span>';
            }

            // Perform OAuth sign in
            let oauthData;
            if (provider === 'google') {
                oauthData = await window.FirebaseAuth.signInWithGoogle();
            } else if (provider === 'github') {
                oauthData = await window.FirebaseAuth.signInWithGitHub();
            }

            // Authenticate with backend
            const response = await window.FirebaseAuth.authenticateWithBackend(oauthData);

            if (response.success) {
                currentUser = response.user;
                
                // Redirect to appropriate dashboard
                if (currentUser.role === 'hr') {
                    loadPage('dashboard-hr.html');
                } else {
                    loadPage('dashboard-student.html');
                }
            } else {
                throw new Error('Backend authentication failed');
            }

        } catch (error) {
            console.error('OAuth sign in error:', error);
            
            // Show user-friendly error message
            let errorMessage = 'Authentication failed. Please try again.';
            
            if (error.code === 'auth/popup-blocked') {
                errorMessage = 'Popup was blocked. Please allow popups for this site.';
            } else if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'Sign-in cancelled.';
            } else if (error.code === 'auth/cancelled-popup-request') {
                errorMessage = 'Sign-in cancelled.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            if (errorDiv) {
                errorDiv.textContent = errorMessage;
                errorDiv.style.display = 'block';
            } else {
                // Fallback: show alert if error div doesn't exist
                alert(errorMessage);
            }

            // Restore button state
            if (btn && originalText) {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        }
    };

    const initHRDashboard = async () => {
        const nameSpan = document.getElementById('userName');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (currentUser && nameSpan) {
            nameSpan.textContent = currentUser.name;
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }


        // Fetch Dashboard Data
        const statsTotal = document.getElementById('statTotalCandidates');
        const statsShortlisted = document.getElementById('statShortlisted');
        const statsActive = document.getElementById('statActiveJobs');
        const tableBody = document.getElementById('recentJobsList');

        try {
            const res = await fetch('http://localhost:5000/api/jobs', { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to load jobs');
            
            const data = await res.json();
            const jobs = data.data || [];

            // Calculate Stats
            let totalCandidates = 0;
            let totalShortlisted = 0;

            jobs.forEach(job => {
                const cands = job.candidates || [];
                totalCandidates += cands.length;
                totalShortlisted += cands.filter(c => c.status === 'Shortlisted').length;
            });

            if (statsTotal) statsTotal.textContent = totalCandidates;
            if (statsShortlisted) statsShortlisted.textContent = totalShortlisted;
            if (statsActive) statsActive.textContent = jobs.length;

            // Render Table
            if (tableBody) {
                if (jobs.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">No analyses found. Start one!</td></tr>';
                    return;
                }

                // Sort by new
                jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                tableBody.innerHTML = jobs.map(job => {
                    const date = new Date(job.createdAt).toLocaleDateString();
                    const snippet = job.jobDescription.substring(0, 50) + '...';
                    const count = (job.candidates || []).length;
                    const shortlistedCount = (job.candidates || []).filter(c => c.status === 'Shortlisted').length;
                    
                    return `
                        <tr>
                            <td>${date}</td>
                            <td><div title="${job.jobDescription.replace(/"/g, '&quot;')}">${snippet}</div></td>
                            <td>
                                <span class="badge badge-neutral">${count} Total</span>
                            </td>
                            <td>
                                <span class="badge badge-success">${shortlistedCount} Shortlisted</span>
                            </td>
                            <td>
                                <button class="btn btn-secondary btn-sm" onclick="App.viewJobResults('${job.id}')">View Results</button>
                            </td>
                        </tr>
                    `;
                }).join('');
            }

        } catch (error) {
            console.error('Dashboard Load Error:', error);
        }
    };

    const initStudentDashboard = () => {
         const nameSpan = document.getElementById('studentName');
         const logoutBtn = document.getElementById('logoutBtn');
         
         if (currentUser && nameSpan) {
             nameSpan.textContent = currentUser.name;
         }
         if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
    };

    const handleLogout = async () => {
        await fetch('http://localhost:5000/api/auth/logout', { 
            method: 'POST',
            credentials: 'include'
        });
        currentUser = null;
        loadPage('student-login.html');
    };
    
    // New Helper to view past results
    const viewJobResults = async (jobId) => {
        try {
            const res = await fetch(`http://3000/api/jobs/${jobId}`, { credentials: 'include' });
            if (res.ok) {
                const result = await res.json();
                
                sessionStorage.setItem(STATE_KEY_RESULTS, JSON.stringify(result.data));
                uploadedFiles = []; // Clear
                
                // Redirect based on Role
                if (currentUser && currentUser.role === 'student') {
                    loadPage('result-student.html');
                } else {
                    loadPage('result.html');
                }

            }
        } catch (err) {
            alert('Failed to load job details');
        }
    };

    const initLanding = () => {
        // Update "Get Started" links based on auth
        const btn = document.querySelector('a[href="#upload-section"]');
        if (btn) {
            // Redirect logic is handled by clicking, but let's override href for better UX if possible, 
            // or just let the loadPage handle it.
            // Actually, we should just let the user click correctly.
            // But wait, the landing page has href="#upload-section" which is an anchor link.
            // We should change it to use loadPage.
            btn.removeAttribute('href');
            btn.style.cursor = 'pointer';
            btn.onclick = () => {
                if (currentUser) loadPage('dashboard.html');
                else loadPage('signup.html');
            };
        }
    };

    // === Upload Page Logic ===
    const initUpload = () => {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const fileList = document.getElementById('fileList');
        const nextBtn = document.getElementById('nextBtn');
        
        // Render existing files if returning
        renderFileList();
        updateNextButton();

        // Event Listeners
        if (dropZone) {
            dropZone.addEventListener('click', () => fileInput.click());

            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('active');
            });

            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('active');
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('active');
                dropZone.classList.remove('active');
                
                // Role-based limit check
                if (currentUser && currentUser.role === 'student' && e.dataTransfer.files.length > 1) {
                    alert('Students can only upload 1 resume. Please select a single file.');
                    return;
                }
                
                handleFiles(e.dataTransfer.files);
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                 // Role-based limit check
                if (currentUser && currentUser.role === 'student' && e.target.files.length > 1) {
                    alert('Students can only upload 1 resume. Please select a single file.');
                    fileInput.value = ''; // Clear input
                    return;
                }
                handleFiles(e.target.files);
            });
        }

        // Handle Next Button
        if (nextBtn) {
            nextBtn.onclick = () => {
                if (uploadedFiles.length > 0) {
                    loadPage('job.html');
                }
            };
        }

        const handleFiles = (files) => {
        // Enforce limit again just in case
        if (currentUser && currentUser.role === 'student') {
             if (uploadedFiles.length >= 1 || files.length > 1) {
                 // If trying to add more, replace the existing one or alert
                 // Let's replace for better UX if it's a new selection, but if dragging 2, reject.
                 if (files.length > 1) return; 
                 uploadedFiles = []; // Replace existing
             }
        }
        
        Array.from(files).forEach(file => {
            if (file.type === 'application/pdf') {
                uploadedFiles.push(file);
            } else {
                alert(`Skipped ${file.name}: Only PDF allowed`);
            }
        });
        renderFileList();
        updateNextButton();
    };

        function renderFileList() {
            if (!fileList) return;
            fileList.innerHTML = '';
            uploadedFiles.forEach((file, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${file.name}</span>
                    <button class="btn-danger" style="margin-left: 1rem; border:none; cursor:pointer;" onclick="App.removeFile(${index})">✕</button>
                `;
                fileList.appendChild(li);
            });
        }

        function updateNextButton() {
            if (nextBtn) {
                nextBtn.disabled = uploadedFiles.length === 0;
            }
        }
    };

    // Public method to remove file
    const removeFile = (index) => {
        uploadedFiles.splice(index, 1);
        const fileList = document.getElementById('fileList');
        const nextBtn = document.getElementById('nextBtn');
        
        if (fileList) {
             fileList.innerHTML = '';
             uploadedFiles.forEach((file, idx) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${file.name}</span>
                    <button class="btn-danger" style="margin-left: 1rem; border:none; cursor:pointer;" onclick="App.removeFile(${idx})">✕</button>
                `;
                fileList.appendChild(li);
            });
        }
        if (nextBtn) {
            nextBtn.disabled = uploadedFiles.length === 0;
        }
    };

    // === Job Page Logic ===
    const initJob = () => {
        const processBtn = document.getElementById('processBtn');
        const jobInput = document.getElementById('jobDescription');
        
        if (processBtn) {
            processBtn.addEventListener('click', async () => {
                const jd = jobInput.value.trim();
                if (!jd) {
                    alert('Please enter a job description.');
                    return;
                }
                if (uploadedFiles.length === 0) {
                    alert('No files found. Please start over.');
                    loadPage('upload.html');
                    return;
                }

                // Show Loading
                const loading = document.getElementById('loading');
                if (loading) loading.style.display = 'flex';

                // Prepare FormData
                const formData = new FormData();
                formData.append('jobDescription', jd);
                uploadedFiles.forEach(file => {
                    formData.append('resumes', file);
                });

                try {
                    const res = await fetch('http://localhost:5000/api/shortlist', {
                        method: 'POST',
                        body: formData,
                        credentials: 'include'
                    });
                    
                    if (res.status === 401) {
                         alert('Session expired. Please login again.');
                         loadPage('login.html');
                         return;
                    }

                    if (!res.ok) throw new Error('Processing failed');

                    const data = await res.json();
                    console.log('API Response:', data); // DEBUG
                    
                    // Store results and jobId
                    if (data.data) {
                        sessionStorage.setItem(STATE_KEY_RESULTS, JSON.stringify(data.data));
                        console.log('Saved to SessionStorage:', data.data); // DEBUG
                    } else {
                        console.error('API returned no data property');
                    }
                    sessionStorage.setItem('currentJobId', data.jobId);
                    
                    // Navigate
                    if (currentUser && currentUser.role === 'student') {
                        console.log('Redirecting to result-student.html'); // DEBUG
                        loadPage('result-student.html');
                    } else {
                        loadPage('result.html');
                    }

                } catch (error) {
                    console.error(error);
                    alert('An error occurred while processing resumes. Check console.');
                } finally {
                    if (loading) loading.style.display = 'none';
                }
            });
        }
    };

    // === Results Page Logic ===
    const initResults = () => {
        // Use new ATS-style rendering if available
        if (typeof initResultsATS === 'function') {
            initResultsATS();
            return;
        }

        // Fallback to old rendering (keeping for compatibility)
        const container = document.getElementById('resultsContainer');
        const noResults = document.getElementById('noResults');
        const filterSelect = document.getElementById('filterSelect');
        
        const resultsJson = sessionStorage.getItem(STATE_KEY_RESULTS);
        if (!resultsJson) {
            console.warn('No results in session storage, redirecting...');
            loadPage('dashboard.html'); 
            return;
        }

        let allCandidates = [];
        try {
            allCandidates = JSON.parse(resultsJson);
            // Sort by match score desc
            allCandidates.sort((a, b) => b.matchPercentage - a.matchPercentage);
        } catch (e) {
            console.error('Failed to parse results JSON', e);
        }

        if (!allCandidates || allCandidates.length === 0) {
            if (noResults) {
                noResults.style.display = 'block';
                noResults.innerHTML = `
                    <h3>No candidates could be analyzed.</h3>
                    <p>Please try uploading proper text-based PDFs.</p>
                `;
            }
            return;
        }

        window.toggleDetails = (index) => {
            const row = document.getElementById(`details-${index}`);
            if (row) {
                const isHidden = row.style.display === 'none';
                row.style.display = isHidden ? 'table-row' : 'none';
            }
        };

        const renderCandidates = (filter) => {
            if (!container) return;
            container.innerHTML = '';
            
            const filtered = allCandidates.filter(c => 
                filter === 'all' ? true : c.status === filter
            );

            if (filtered.length === 0) {
                if (noResults) {
                    noResults.style.display = 'block';
                    noResults.innerHTML = '<h3>No candidates match this filter.</h3>';
                }
            } else {
                if (noResults) noResults.style.display = 'none';
            }

            filtered.forEach((c, index) => {
                // Logic for styling
                const isShortlisted = c.status === 'Shortlisted';
                const statusClass = isShortlisted ? 'badge-success' : 'badge-danger';
                const scoreColor = c.matchPercentage >= 70 ? 'var(--success)' : (c.matchPercentage >= 40 ? 'var(--warning)' : 'var(--danger)');
                
                // HTML Generation
                const skillTags = c.skills && c.skills.length > 0
                    ? c.skills.slice(0, 3).map(s => `<span class="skill-tag">${s}</span>`).join('') + (c.skills.length > 3 ? `<span class="skill-tag">+${c.skills.length - 3}</span>` : '')
                    : '<span class="text-muted text-sm">-</span>';

                const prosHtml = (c.pros || []).map(p => `<li style="margin-bottom:0.25rem;">✅ ${p}</li>`).join('');
                const consHtml = (c.cons || []).map(co => `<li style="margin-bottom:0.25rem;">❌ ${co}</li>`).join('');
                
                // New: Extra skills display
                const extraSkillsHtml = c.extraSkills && c.extraSkills.length > 0
                    ? `<div style="margin-top:0.5rem;"><strong style="color:var(--primary)">Bonus Skills:</strong> ${c.extraSkills.slice(0, 5).join(', ')}</div>`
                    : '';

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td style="font-weight: 600; color: var(--text-muted);">#${index + 1}</td>
                    <td>
                        <div style="font-weight: 600; color: var(--text-main);">${c.fileName}</div>
                        ${c.experienceYears ? `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">📅 ${c.experienceYears} years exp</div>` : ''}
                    </td>
                    <td>
                        <div style="display: flex; align-items: center;">
                            <div class="progress-wrapper">
                                <div class="progress-fill" style="width: ${c.matchPercentage}%; background: ${scoreColor};"></div>
                            </div>
                            <span class="score-text" style="color: ${scoreColor};">${c.matchPercentage}%</span>
                        </div>
                    </td>
                    <td>
                        <select class="status-select" data-filename="${c.fileName}" style="padding: 0.4rem; border-radius: 4px; border: 1px solid #ddd; background: white; font-size: 0.85rem;">
                            <option value="Applied" ${c.status === 'Applied' ? 'selected' : ''}>Applied</option>
                            <option value="Shortlisted" ${c.status === 'Shortlisted' ? 'selected' : ''}>✅ Shortlisted</option>
                            <option value="Interview" ${c.status === 'Interview' ? 'selected' : ''}>📞 Interview</option>
                            <option value="Offer" ${c.status === 'Offer' ? 'selected' : ''}>🎉 Offer</option>
                            <option value="Rejected" ${c.status === 'Rejected' ? 'selected' : ''}>❌ Rejected</option>
                        </select>
                    </td>
                    <td>${skillTags}</td>
                    <td style="text-align: right;">
                        <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="toggleDetails(${index})">Details</button>
                        <a href="${c.downloadLink}" target="_blank" class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; text-decoration:none;">PDF</a>
                    </td>
                `;

                const detailsRow = document.createElement('tr');
                detailsRow.id = `details-${index}`;
                detailsRow.style.display = 'none';
                detailsRow.style.background = '#f8fafc';
                detailsRow.innerHTML = `
                    <td colspan="6" style="padding: 1.5rem;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                            <div>
                                <h4 style="font-size: 0.85rem; text-transform:uppercase; color: var(--success); margin-bottom: 0.5rem;">Strengths</h4>
                                <ul style="list-style: none; padding: 0; font-size: 0.9rem; color: var(--text-secondary);">
                                    ${prosHtml || '<li>No specific strengths detected</li>'}
                                </ul>
                                ${extraSkillsHtml}
                            </div>
                            <div>
                                <h4 style="font-size: 0.85rem; text-transform:uppercase; color: var(--danger); margin-bottom: 0.5rem;">Weaknesses / Gaps</h4>
                                 <ul style="list-style: none; padding: 0; font-size: 0.9rem; color: var(--text-secondary);">
                                    ${consHtml || '<li>No specific weaknesses detected</li>'}
                                </ul>
                                ${c.missingSkills && c.missingSkills.length ? `<div style="margin-top:1rem; font-size:0.85rem;"><strong style="color:var(--danger)">Missing:</strong> ${c.missingSkills.join(', ')}</div>` : ''}
                            </div>
                        </div>
                    </td>
                `;

                container.appendChild(row);
                container.appendChild(detailsRow);
            });
            
            // Add event listeners for status changes
            const jobId = sessionStorage.getItem('currentJobId');
            document.querySelectorAll('.status-select').forEach(select => {
                select.addEventListener('change', async (e) => {
                    const newStatus = e.target.value;
                    const fileName = e.target.dataset.filename;
                    
                    // Update locally first for immediate UI feedback
                    const candidate = allCandidates.find(c => c.fileName === fileName);
                    if (candidate) candidate.status = newStatus;
                    
                    // Persist to backend if jobId is available
                    if (jobId) {
                        try {
                            const res = await fetch(`http://localhost:5000/api/jobs/${jobId}/candidates/${encodeURIComponent(fileName)}/status`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: newStatus }),
                                credentials: 'include'
                            });
                            
                            if (!res.ok) {
                                console.error('Failed to update status on server');
                                alert('Failed to save status change. Please try again.');
                            } else {
                                console.log(`Status updated for ${fileName}: ${newStatus}`);
                            }
                        } catch (error) {
                            console.error('Error updating status:', error);
                        }
                    }
                });
            });
        };

        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                renderCandidates(e.target.value);
            });
        }

        // Initial Render
        renderCandidates('all');
    };

    const initStudentResult = () => {
        console.log('initStudentResult called (Final)');
        const storageData = sessionStorage.getItem(STATE_KEY_RESULTS);
        if (!storageData) { console.warn('No storage data'); return; }

        let results = [];
        try { results = JSON.parse(storageData); } catch(e) { console.error('Parse error', e); return; }
        
        // Handle both array and object wrapper from API
        if (!Array.isArray(results) && results.data) results = results.data;
        if (!Array.isArray(results)) results = [results]; // worst case

        if (results.length === 0) { console.warn('Empty results'); return; }

        const data = results[0];
        console.log('Rendering Data:', data);

        // Badge
        const badge = document.getElementById('selectionBadge');
        if (badge) {
            badge.textContent = (data.selectionChance || 'Low') + " SELECTION CHANCE";
            badge.className = 'badge ' + (data.selectionChance === 'High' ? 'badge-success' : (data.selectionChance === 'Medium' ? 'badge-warning' : 'badge-danger'));
            badge.style.fontSize = '1rem'; badge.style.padding = '0.5rem 1rem'; badge.style.marginBottom = '2rem';
        }

        // Score
        const scoreEl = document.getElementById('atsScore');
        if (scoreEl) {
            scoreEl.textContent = Math.round(data.matchPercentage || 0);
            // Gauge
            setTimeout(() => {
                const gauge = document.getElementById('gaugeFill');
                if (gauge) {
                    const deg = 180 * ((data.matchPercentage || 0) / 100);
                    gauge.style.transform = `rotate(${deg}deg)`;
                }
            }, 100);
        }

        // Lists
        const tipsList = document.getElementById('improvementTips');
        if (tipsList) tipsList.innerHTML = (data.improvementTips || []).map(t => `<li class="mb-2">${t}</li>`).join('') || '<li class="text-muted">No tips.</li>';

        const missingList = document.getElementById('missingSkills');
        if (missingList) missingList.innerHTML = (data.missingSkills || []).map(s => `<span class="badge badge-danger">+ ${s}</span>`).join('') || '<span class="text-muted">None.</span>';

        const prosList = document.getElementById('prosList');
        if (prosList) prosList.innerHTML = (data.pros || []).map(p => `<li class="mb-2">${p}</li>`).join('');
    };

    return {
        initUpload,
        initJob,
        initResults,
        initStudentResult,
        loadPage,
        removeFile,
        initAuth,
        initHRDashboard,
        initStudentDashboard,
        getAnalysisResults: () => JSON.parse(sessionStorage.getItem(STATE_KEY_RESULTS) || '[]'),
        viewJobResults
    };
})();
