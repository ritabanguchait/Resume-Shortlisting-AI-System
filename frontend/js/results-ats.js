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
    
    const resultsJson = sessionStorage.getItem('analysisResults');
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
                                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #667eea;">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                    <span style="font-weight: 600; color: #475569;">${c.experienceYears} Years</span>
                                    <span style="color: #94a3b8;">Experience</span>
                                </div>
                            ` : ''}
                            <div class="meta-item" style="background: #f1f5f9; padding: 0.5rem 1rem; border-radius: 6px;">
                                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #667eea;">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                </svg>
                                <span style="font-weight: 600; color: #475569;">Rank ${index + 1}</span>
                                <span style="color: #94a3b8;">of ${filtered.length}</span>
                            </div>
                            <div class="meta-item" style="background: #f1f5f9; padding: 0.5rem 1rem; border-radius: 6px;">
                                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #667eea;">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                <span style="color: #475569;">${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>
                    <div class="score-display">
                        <div class="score-circle ${scoreClass}" style="position: relative;">
                            <div style="position: absolute; inset: 0; border-radius: 50%; background: rgba(255,255,255,0.1);"></div>
                            <div style="position: relative; z-index: 1;">${c.matchPercentage}%</div>
                        </div>
                        <div class="score-label ${labelClass}" style="margin-top: 0.75rem; display: flex; align-items: center; gap: 0.5rem; justify-content: center;">
                            ${scoreLabel === 'Excellent Match' ? '⭐' : scoreLabel === 'Good Match' ? '👍' : scoreLabel === 'Fair Match' ? '⚠️' : '❌'}
                            <span>${scoreLabel}</span>
                        </div>
                    </div>
                </div>

                ${(c.skills && c.skills.length > 0) || (c.extraSkills && c.extraSkills.length > 0) ? `
                    <div class="skills-section" style="border-top: 2px solid #f1f5f9; padding-top: 1.5rem; margin-top: 1.5rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #667eea;">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            <div class="skills-header" style="margin: 0;">Skills & Competencies</div>
                            <div style="flex: 1;"></div>
                            <span style="font-size: 0.75rem; color: #94a3b8; font-weight: 600;">${(c.skills || []).length + (c.extraSkills || []).length} Total</span>
                        </div>
                        <div class="skills-container">
                            ${(c.skills || []).map(skill => `
                                <span class="skill-badge skill-matched" style="display: inline-flex; align-items: center; gap: 0.5rem;">
                                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                                    </svg>
                                    ${skill}
                                </span>
                            `).join('')}
                            ${(c.extraSkills || []).map(skill => `
                                <span class="skill-badge skill-extra" style="display: inline-flex; align-items: center; gap: 0.5rem;">
                                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd"/>
                                    </svg>
                                    ${skill}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${c.missingSkills && c.missingSkills.length > 0 ? `
                    <div style="margin-top: 1.5rem; padding: 1.25rem; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-left: 4px solid #ef4444; border-radius: 8px; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20" style="color: #dc2626;">
                                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                            </svg>
                            <div style="font-size: 0.9rem; font-weight: 700; color: #991b1b;">Missing Required Skills</div>
                            <div style="flex: 1;"></div>
                            <span style="background: #dc2626; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 700;">${c.missingSkills.length}</span>
                        </div>
                        <div class="skills-container">
                            ${c.missingSkills.map(skill => `
                                <span class="skill-badge skill-missing" style="display: inline-flex; align-items: center; gap: 0.5rem;">
                                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                                    </svg>
                                    ${skill}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="candidate-actions" style="display: grid; grid-template-columns: 1fr auto auto; gap: 1rem; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <label style="font-size: 0.85rem; font-weight: 600; color: #475569; white-space: nowrap;">Status:</label>
                        <select class="status-dropdown status-select" data-filename="${c.fileName}" style="flex: 1;">
                            <option value="Applied" ${c.status === 'Applied' ? 'selected' : ''}>📝 Applied</option>
                            <option value="Shortlisted" ${c.status === 'Shortlisted' ? 'selected' : ''}>✅ Shortlisted</option>
                            <option value="Interview" ${c.status === 'Interview' ? 'selected' : ''}>📞 Interview</option>
                            <option value="Offer" ${c.status === 'Offer' ? 'selected' : ''}>🎉 Offer</option>
                            <option value="Rejected" ${c.status === 'Rejected' ? 'selected' : ''}>❌ Rejected</option>
                        </select>
                    </div>
                    <button class="btn btn-secondary" onclick="toggleCandidateDetails(${index})" style="white-space: nowrap;">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        View Details
                    </button>
                    <a href="${c.downloadLink}" target="_blank" class="btn btn-primary" style="text-decoration: none; white-space: nowrap;">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Download
                    </a>
                </div>

                <div id="details-${index}" class="details-section">
                    <div class="details-grid">
                        <div class="details-column" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 1.5rem; border-radius: 8px; border: 1px solid #a7f3d0;">
                            <h4 style="color: #059669; display: flex; align-items: center; gap: 0.75rem;">
                                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                                </svg>
                                Strengths & Highlights
                            </h4>
                            <ul style="margin-top: 1rem;">
                                ${(c.pros || []).map(p => `<li style="color: #065f46;">• ${p}</li>`).join('') || '<li style="color: #6ee7b7;">No specific strengths noted</li>'}
                            </ul>
                        </div>
                        <div class="details-column" style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); padding: 1.5rem; border-radius: 8px; border: 1px solid #fca5a5;">
                            <h4 style="color: #dc2626; display: flex; align-items: center; gap: 0.75rem;">
                                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                                </svg>
                                Areas for Improvement
                            </h4>
                            <ul style="margin-top: 1rem;">
                                ${(c.cons || []).map(co => `<li style="color: #991b1b;">• ${co}</li>`).join('') || '<li style="color: #fca5a5;">No specific concerns noted</li>'}
                            </ul>
                        </div>
                    </div>
                </div>
            `;

            container.appendChild(card);
        });

        // Add status change listeners
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
                        const res = await fetch(`http://localhost:3000/api/jobs/${jobId}/candidates/${encodeURIComponent(fileName)}/status`, {
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
