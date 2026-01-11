const App = (function() {
    // Store state in sessionStorage or module scope
    const STATE_KEY_RESULTS = 'analysisResults';
    
    // Module-level state for files to persist across "page loads" (view swaps)
    let uploadedFiles = [];

    // Helper to navigate/swap views
    const loadPage = async (pageName) => {
        try {
            const response = await fetch(pageName);
            const html = await response.text();
            
            // Parse the HTML to extract the container content
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newContent = doc.querySelector('#app').innerHTML;
            
            document.getElementById('app').innerHTML = newContent;
            
            // Re-initialize logic based on page
            if (pageName === 'job.html') initJob();
            if (pageName === 'result.html') initResults();
            if (pageName === 'index.html') initUpload();
            
        } catch (err) {
            console.error('Navigation failed', err);
        }
    };

    // === Upload Page Logic ===
    const initUpload = () => {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const fileList = document.getElementById('fileList');
        const nextBtn = document.getElementById('nextBtn');
        
        // Reset state? Maybe keep it if user comes back.
        // If coming back, render existing files.
        if (uploadedFiles.length === 0) {
            // New session or empty
        }

        // Re-render list immediately in case we have files
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
                    // Avoid duplicates? Or allow. 
                    // Let's allow for now.
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
        // We need to re-render. 
        // Since we are inside the module, we can call initUpload's render? 
        // No, initUpload's render is local.
        // We probably should just re-run initUpload logic or check if we are on that page.
        // Or simpler: grab elements again.
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
                    loadPage('index.html');
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
                        body: formData
                    });
                    
                    if (!res.ok) throw new Error('Processing failed');

                    const data = await res.json();
                    
                    // Store results
                    sessionStorage.setItem(STATE_KEY_RESULTS, JSON.stringify(data.data));
                    
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
        const container = document.getElementById('resultsContainer');
        const noResults = document.getElementById('noResults');
        const filterSelect = document.getElementById('filterSelect');
        
        const resultsJson = sessionStorage.getItem(STATE_KEY_RESULTS);
        if (!resultsJson) {
            console.warn('No results in session storage, redirecting...');
            loadPage('index.html');
            return;
        }

        let allCandidates = [];
        try {
            allCandidates = JSON.parse(resultsJson);
        } catch (e) {
            console.error('Failed to parse results JSON', e);
        }

        console.log('Rendering candidates:', allCandidates.length);

        if (!allCandidates || allCandidates.length === 0) {
            if (noResults) {
                noResults.style.display = 'block';
                noResults.innerHTML = `
                    <h3>No candidates could be analyzed.</h3>
                    <p>This usually happens if the PDF text is not selectable (scanned images).<br>Please try uploading proper text-based PDFs.</p>
                `;
            }
            return;
        }

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

            filtered.forEach(c => {
                const card = document.createElement('div');
                card.className = 'candidate-card';
                
                // Logic for styling
                const isShortlisted = c.status === 'Shortlisted';
                const isHighMatch = c.matchPercentage >= 50;
                const badgeType = isHighMatch ? 'high' : 'low';
                const statusType = isShortlisted ? 'shortlisted' : 'rejected';
                
                // HTML Generation
                const skillTags = c.skills && c.skills.length > 0
                    ? c.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')
                    : '<span style="color:var(--text-muted); font-size:0.9rem;">No specific skills detected</span>';

                const missingSkillsHtml = c.missingSkills && c.missingSkills.length > 0
                    ? `<div class="missing-skills"><strong>Missing Skills:</strong> ${c.missingSkills.slice(0, 5).join(', ')}</div>`
                    : '';

                const prosHtml = (c.pros || []).map(p => `<li>${p}</li>`).join('');
                const consHtml = (c.cons || []).map(co => `<li>${co}</li>`).join('');

                card.innerHTML = `
                   <div class="card-header">
                        <div class="match-badge ${badgeType}">
                            <span class="match-percent">${c.matchPercentage}%</span>
                            <span class="match-label">Match</span>
                        </div>
                        <div class="candidate-info">
                            <h3 class="candidate-name">${c.fileName}</h3>
                            <span class="status-pill ${statusType}">${c.status}</span>
                        </div>
                   </div>
                   
                   <div class="card-body">
                       <div>
                           <div class="section-title">Extracted Skills</div>
                           <div class="skills-container">
                                ${skillTags}
                           </div>
                       </div>
                       
                       ${missingSkillsHtml}

                       <div class="analysis-grid">
                            <div class="analysis-col">
                                <div class="section-title" style="color:var(--success)">Pros</div>
                                <ul class="analysis-list pros-list">
                                    ${prosHtml}
                                </ul>
                            </div>
                            <div class="analysis-col">
                                <div class="section-title" style="color:var(--danger)">Cons</div>
                                <ul class="analysis-list cons-list">
                                    ${consHtml}
                                </ul>
                            </div>
                       </div>
                   </div>

                   <div class="card-footer">
                        <a href="${c.downloadLink}" target="_blank" class="btn-view">View Resume PDF</a>
                   </div>
                `;
                container.appendChild(card);
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
        removeFile
    };
})();
