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
            const publicPages = ['index.html', 'login.html', 'signup.html'];
            if (!publicPages.includes(pageName) && !currentUser) {
                // Try to restore session first
                const restored = await checkSession();
                if (!restored) {
                    console.log('Access denied to', pageName);
                    loadPage('login.html');
                    return;
                }
            }

            // Redirect logged in users away from auth pages
            if ((pageName === 'login.html' || pageName === 'signup.html') && currentUser) {
                loadPage('dashboard.html');
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
            
            // Re-initialize logic based on page
            if (pageName === 'job.html') initJob();
            if (pageName === 'result.html') initResults();
            if (pageName === 'upload.html') initUpload();
            if (pageName === 'dashboard.html') initDashboard();
            if (pageName === 'login.html') initAuth('login');
            if (pageName === 'signup.html') initAuth('signup');
            if (pageName === 'index.html') initLanding();
            
        } catch (err) {
            console.error('Navigation failed', err);
        }
    };

    // === Auth Logic ===
    const checkSession = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/auth/me', {
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
        const form = document.getElementById(type === 'login' ? 'loginForm' : 'signupForm');
        const errorDiv = document.getElementById('authError');

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                errorDiv.style.display = 'none';
                errorDiv.textContent = '';

                const formData = {};
                if (type === 'signup') formData.name = document.getElementById('name').value;
                formData.email = document.getElementById('email').value;
                formData.password = document.getElementById('password').value;

                try {
                    const endpoint = type === 'login' ? '/api/auth/login' : '/api/auth/signup';
                    const res = await fetch(`http://localhost:3000${endpoint}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData),
                        credentials: 'include'
                    });

                    const data = await res.json();

                    if (!res.ok) throw new Error(data.error || 'Auth failed');

                    currentUser = data.user;
                    loadPage('dashboard.html');

                } catch (err) {
                    errorDiv.textContent = err.message;
                    errorDiv.style.display = 'block';
                }
            });
        }
    };

    const initDashboard = () => {
        const nameSpan = document.getElementById('userName');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (currentUser && nameSpan) {
            nameSpan.textContent = currentUser.name;
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await fetch('http://localhost:3000/api/auth/logout', { 
                    method: 'POST',
                    credentials: 'include'
                });
                currentUser = null;
                loadPage('login.html');
            });
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
                handleFiles(e.dataTransfer.files);
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
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

        function handleFiles(newFiles) {
            Array.from(newFiles).forEach(file => {
                if (file.type === 'application/pdf') {
                    uploadedFiles.push(file);
                } else {
                    alert(`Skipped ${file.name}: Only PDF allowed.`);
                }
            });
            renderFileList();
            updateNextButton();
        }

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
                    const res = await fetch('http://localhost:3000/api/shortlist', {
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
                    
                    // Store results and jobId
                    sessionStorage.setItem(STATE_KEY_RESULTS, JSON.stringify(data.data));
                    sessionStorage.setItem('currentJobId', data.jobId);
                    
                    // Navigate
                    loadPage('result.html');

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
                            const res = await fetch(`http://localhost:3000/api/jobs/${jobId}/candidates/${encodeURIComponent(fileName)}/status`, {
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

    return {
        initUpload,
        initJob,
        initResults,
        loadPage,
        removeFile,
        initAuth
    };
})();
