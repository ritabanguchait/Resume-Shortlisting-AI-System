// ATS Results Page - Modern Card-Based Rendering
// This file contains the updated initResults function for the modernized ATS dashboard

function initResultsATS() {
    const container = document.getElementById('resultsContainer');
    const statsContainer = document.getElementById('statsContainer');
    const noResults = document.getElementById('noResults');
    
    // Get filter elements
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const scoreFilter = document.getElementById('scoreFilter');
    const experienceFilter = document.getElementById('experienceFilter');
    const sortSelect = document.getElementById('sortSelect');
    
    // View Toggle
    let currentView = 'cards'; // 'cards' or 'table'
    const viewToggleBtn = document.getElementById('viewToggleBtn');
    if (viewToggleBtn) {
        viewToggleBtn.addEventListener('click', () => {
            currentView = currentView === 'cards' ? 'table' : 'cards';
            viewToggleBtn.textContent = currentView === 'cards' ? 'Switch to Table View' : 'Switch to Card View';
            renderCandidates();
        });
    }
    if (!resultsJson) {
        console.warn('No results in session storage, redirecting...');
        App.loadPage('dashboard.html');
        return;
    }

    let allCandidates = [];
    try {
        allCandidates = JSON.parse(resultsJson);
    } catch (e) {
        console.error('Failed to parse results JSON', e);
        return;
    }

    if (!allCandidates || allCandidates.length === 0) {
        if (noResults) {
            noResults.style.display = 'block';
        }
        return;
    }

    // Render stats
    renderStats(allCandidates, statsContainer);

    // Helper functions
    function getScoreClass(score) {
        if (score >= 80) return 'score-excellent';
        if (score >= 60) return 'score-good';
        if (score >= 40) return 'score-fair';
        return 'score-poor';
    }

    function getScoreLabel(score) {
        if (score >= 80) return 'Excellent Match';
        if (score >= 60) return 'Good Match';
        if (score >= 40) return 'Fair Match';
        return 'Needs Review';
    }

    function filterCandidates(candidates) {
        let filtered = [...candidates];

        // Search filter
        const searchTerm = searchInput?.value.toLowerCase() || '';
        if (searchTerm) {
            filtered = filtered.filter(c => 
                c.fileName.toLowerCase().includes(searchTerm) ||
                (c.skills || []).some(skill => skill.toLowerCase().includes(searchTerm))
            );
        }

        // Status filter
        const status = statusFilter?.value || 'all';
        if (status !== 'all') {
            filtered = filtered.filter(c => c.status === status);
        }

        // Score filter
        const scoreRange = scoreFilter?.value || 'all';
        if (scoreRange !== 'all') {
            filtered = filtered.filter(c => {
                const score = c.matchPercentage;
                switch(scoreRange) {
                    case 'excellent': return score >= 80;
                    case 'good': return score >= 60 && score < 80;
                    case 'fair': return score >= 40 && score < 60;
                    case 'poor': return score < 40;
                    default: return true;
                }
            });
        }

        // Experience filter
        const expRange = experienceFilter?.value || 'all';
        if (expRange !== 'all') {
            filtered = filtered.filter(c => {
                const exp = c.experienceYears || 0;
                switch(expRange) {
                    case '0-2': return exp >= 0 && exp <= 2;
                    case '3-5': return exp >= 3 && exp <= 5;
                    case '6+': return exp >= 6;
                    default: return true;
                }
            });
        }

        return filtered;
    }

    function sortCandidates(candidates) {
        const sortBy = sortSelect?.value || 'score-desc';
        const sorted = [...candidates];

        switch(sortBy) {
            case 'score-desc':
                return sorted.sort((a, b) => b.matchPercentage - a.matchPercentage);
            case 'score-asc':
                return sorted.sort((a, b) => a.matchPercentage - b.matchPercentage);
            case 'name-asc':
                return sorted.sort((a, b) => a.fileName.localeCompare(b.fileName));
            case 'name-desc':
                return sorted.sort((a, b) => b.fileName.localeCompare(a.fileName));
            case 'experience-desc':
                return sorted.sort((a, b) => (b.experienceYears || 0) - (a.experienceYears || 0));
            case 'experience-asc':
                return sorted.sort((a, b) => (a.experienceYears || 0) - (b.experienceYears || 0));
            default:
                return sorted;
        }
    }

    function renderCandidates() {
        if (!container) return;

        let filtered = filterCandidates(allCandidates);
        filtered = sortCandidates(filtered);

        if (filtered.length === 0) {
            container.innerHTML = '';
            if (noResults) noResults.style.display = 'block';
            return;
        }

        if (noResults) noResults.style.display = 'none';
        
        if (currentView === 'table') {
            renderTable(container, filtered);
        } else {
            renderCards(container, filtered);
        }
    }

    function renderStats(candidates, container) {
        if (!container) return;
        
        const total = candidates.length;
        const shortlisted = candidates.filter(c => c.status === 'Shortlisted' || c.matchPercentage >= 50).length;
        const avgScore = Math.round(candidates.reduce((acc, c) => acc + c.matchPercentage, 0) / (total || 1));
        const highPotential = candidates.filter(c => c.matchPercentage >= 75).length;

        container.innerHTML = `
            <div class="card text-center">
                <div class="stat-value text-primary">${total}</div>
                <div class="stat-label">Total Applications</div>
            </div>
            <div class="card text-center">
                <div class="stat-value text-success">${shortlisted}</div>
                <div class="stat-label">Shortlisted</div>
            </div>
            <div class="card text-center">
                <div class="stat-value">${avgScore}%</div>
                <div class="stat-label">Avg. Match Score</div>
            </div>
            <div class="card text-center">
                <div class="stat-value text-warning">${highPotential}</div>
                <div class="stat-label">High Potential</div>
            </div>
        `;
    }

    function renderTable(container, candidates) {
        // Use card-based table for better aesthetics in the new design
        const html = `
            <div class="card" style="padding: 0; overflow: hidden;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="padding-left: 1.5rem;">Rank</th>
                            <th>Candidate</th>
                            <th>Match Score</th>
                            <th>Experience</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${candidates.map((c, i) => `
                            <tr>
                                <td style="padding-left: 1.5rem;">
                                    <span style="font-weight:700; color:var(--text-muted);">#${i + 1}</span>
                                </td>
                                <td>
                                    <div style="font-weight: 600; color: var(--text-main);">${c.fileName}</div>
                                    <div style="font-size: 0.8rem; color: var(--text-muted);">${c.skills.length} skills detected</div>
                                </td>
                                <td>
                                    <span class="badge ${c.matchPercentage >= 75 ? 'badge-success' : (c.matchPercentage >= 50 ? 'badge-warning' : 'badge-danger')}">
                                        ${c.matchPercentage}%
                                    </span>
                                </td>
                                <td>${c.experienceYears} Years</td>
                                <td>
                                    <select class="form-input status-select" data-filename="${c.fileName}" style="padding: 0.25rem 0.5rem; font-size: 0.85rem; width: auto;">
                                        <option value="Applied" ${c.status === 'Applied' ? 'selected' : ''}>Applied</option>
                                        <option value="Shortlisted" ${c.status === 'Shortlisted' ? 'selected' : ''}>Shortlisted</option>
                                        <option value="Rejected" ${c.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                                    </select>
                                </td>
                                <td>
                                    <a href="${c.downloadLink}" class="btn btn-secondary btn-sm" style="padding: 0.25rem 0.5rem;">Download</a>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        container.innerHTML = html;
        attachStatusListeners();
    }

    function renderCards(container, filtered) {
        container.innerHTML = '';
        filtered.forEach((c, index) => {
            const scoreClass = getScoreClass(c.matchPercentage);
            const scoreLabel = getScoreLabel(c.matchPercentage);
            const labelClass = 'label-' + scoreClass.replace('score-', '');
            
            // Clean filename
            const cleanName = c.fileName
                .replace('.pdf', '')
                .replace(/^\d+-\d+-/, '')
                .replace(/_/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');

            const card = document.createElement('div');
            card.className = 'candidate-card';
            card.innerHTML = `
                <div class="candidate-header">
                    <div class="candidate-info">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem;">
                            <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1.25rem; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                                ${cleanName.charAt(0)}
                            </div>
                            <div>
                                <h3 style="margin: 0;">${cleanName}</h3>
                                <div style="font-size: 0.85rem; color: #94a3b8; margin-top: 0.25rem;">
                                    Candidate ID: #${String(index + 1).padStart(3, '0')}
                                </div>
                            </div>
                        </div>
                        <div class="candidate-meta">
                             ${c.experienceYears ? `
                                <div class="meta-item" style="background: #f1f5f9; padding: 0.5rem 1rem; border-radius: 6px;">
                                    <span style="font-weight: 600; color: #475569;">${c.experienceYears} Years</span>
                                    <span style="color: #94a3b8;">Experience</span>
                                </div>
                            ` : ''}
                            <div class="meta-item" style="background: #f1f5f9; padding: 0.5rem 1rem; border-radius: 6px;">
                                <span style="font-weight: 600; color: #475569;">Rank ${index + 1}</span>
                                <span style="color: #94a3b8;">of ${filtered.length}</span>
                            </div>
                        </div>
                    </div>
                    <div class="score-display">
                        <div class="score-circle ${scoreClass}">
                            <div style="position: relative; z-index: 1;">${c.matchPercentage}%</div>
                        </div>
                        <div class="text-xs text-center mt-1 text-muted">
                           Sem: ${c.semanticScore || '-'}% | Skill: ${c.skillScore || '-'}%
                        </div>
                        <div class="score-label ${labelClass}" style="margin-top: 0.5rem;">
                            ${scoreLabel}
                        </div>
                    </div>
                </div>

                <!-- Skills Section -->
                ${(c.skills && c.skills.length > 0) ? `
                    <div class="skills-section" style="border-top: 2px solid #f1f5f9; padding-top: 1rem; margin-top: 1rem;">
                        <div class="skills-container">
                            ${(c.skills || []).slice(0, 8).map(skill => `
                                <span class="skill-badge skill-matched">${skill}</span>
                            `).join('')}
                             ${c.skills.length > 8 ? `<span class="skill-badge">+${c.skills.length - 8} more</span>` : ''}
                        </div>
                    </div>
                ` : ''}

                <!-- Actions -->
                <div class="candidate-actions" style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
                     <select class="status-dropdown status-select" data-filename="${c.fileName}">
                        <option value="Applied" ${c.status === 'Applied' ? 'selected' : ''}>Applied</option>
                        <option value="Shortlisted" ${c.status === 'Shortlisted' ? 'selected' : ''}>Shortlisted</option>
                        <option value="Rejected" ${c.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                    </select>
                    <div>
                        <button class="btn btn-secondary btn-sm" onclick="toggleCandidateDetails(${index})">Details</button>
                        <a href="${c.downloadLink}" target="_blank" class="btn btn-primary btn-sm">PDF</a>
                    </div>
                </div>
                
                <div id="details-${index}" class="details-section" style="display:none;">
                    <!-- Details Content -->
                     <div class="details-grid">
                        <div class="details-column">
                            <h4 class="text-success">Strengths</h4>
                            <ul>${(c.pros || []).map(p => `<li>${p}</li>`).join('')}</ul>
                        </div>
                        <div class="details-column">
                            <h4 class="text-danger">Weaknesses</h4>
                            <ul>${(c.cons || []).map(co => `<li>${co}</li>`).join('')}</ul>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
        attachStatusListeners();
    }

    function renderStats(candidates, container) {
        if (!container) return;

        const total = candidates.length;
        const shortlisted = candidates.filter(c => c.status === 'Shortlisted').length;
        const avgScore = (candidates.reduce((sum, c) => sum + c.matchPercentage, 0) / total).toFixed(1);
        const topScore = Math.max(...candidates.map(c => c.matchPercentage));

        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${total}</div>
                <div class="stat-label">Total Candidates</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${shortlisted}</div>
                <div class="stat-label">Shortlisted</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${avgScore}%</div>
                <div class="stat-label">Average ATS Score</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${topScore}%</div>
                <div class="stat-label">Top Score</div>
            </div>
        `;
    }

    function attachStatusListeners() {
        const jobId = sessionStorage.getItem('currentJobId');
        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                const newStatus = e.target.value;
                const fileName = e.target.dataset.filename;
                
                const candidate = allCandidates.find(c => c.fileName === fileName);
                if (candidate) candidate.status = newStatus;
                
                if (jobId) {
                    try {
                        const res = await fetch(`http://localhost:5000/api/jobs/${jobId}/candidates/${encodeURIComponent(fileName)}/status`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: newStatus }),
                            credentials: 'include'
                        });
                        
                        if (res.ok) {
                            console.log(`Status updated for ${fileName}: ${newStatus}`);
                            renderStats(allCandidates, statsContainer);
                        }
                    } catch (error) {
                        console.error('Error updating status:', error);
                    }
                }
            });
        });
    }

    // Global function for toggling details
    window.toggleCandidateDetails = (index) => {
        const details = document.getElementById(`details-${index}`);
        if (details) {
            details.style.display = details.style.display === 'none' ? 'block' : 'none';
        }
    };

    // Global export function
    window.exportResults = () => {
        const csv = convertToCSV(allCandidates);
        downloadCSV(csv, 'candidate-results.csv');
    };

    function convertToCSV(data) {
        const headers = ['Rank', 'Candidate', 'ATS Score', 'Status', 'Experience', 'Skills', 'Missing Skills'];
        const rows = data.map((c, i) => [
            i + 1,
            c.fileName,
            c.matchPercentage + '%',
            c.status,
            (c.experienceYears || 0) + ' years',
            (c.skills || []).join('; '),
            (c.missingSkills || []).join('; ')
        ]);
        
        return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }

    function downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Event listeners
    searchInput?.addEventListener('input', renderCandidates);
    statusFilter?.addEventListener('change', renderCandidates);
    scoreFilter?.addEventListener('change', renderCandidates);
    experienceFilter?.addEventListener('change', renderCandidates);
    sortSelect?.addEventListener('change', renderCandidates);

    // Initial render
    renderCandidates();
}

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initResultsATS };
}
