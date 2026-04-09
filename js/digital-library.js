/**
 * digital-library.js — SOSTTI Digital Library Logic
 * Handles filtering, searching, and rendering of library resources.
 */
(function () {
    'use strict';

    // State
    let allResources = [];
    let activeFilter = 'all';
    let searchQuery = '';

    // DOM Elements
    const container = document.getElementById('resource-container');
    const searchInput = document.getElementById('library-search');
    const searchBtn = document.getElementById('library-search-btn');
    const filterChips = document.querySelectorAll('.filter-chip');
    const resultMeta = document.getElementById('result-meta');

    /**
     * Initialize the library
     */
    function init() {
        if (!container) return;

        // Load data from global variable (populated by resources-open-inline.js)
        if (window.OPEN_PDFS && Array.isArray(window.OPEN_PDFS)) {
            allResources = window.OPEN_PDFS;
            render();
        } else {
            console.warn('Library data not found. Ensure resources-open-inline.js is loaded.');
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load resources. Please try again later.</p>
                </div>
            `;
        }

        // Event Listeners
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value.toLowerCase().trim();
                render();
            });
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    searchQuery = searchInput.value.toLowerCase().trim();
                    render();
                }
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                searchQuery = searchInput.value.toLowerCase().trim();
                render();
            });
        }

        filterChips.forEach(chip => {
            chip.addEventListener('click', () => {
                // Toggle active class
                filterChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');

                // Update filter and render
                activeFilter = chip.dataset.filter;
                render();
            });
        });
    }

    /**
     * Render the resource cards based on current filter and search query
     */
    function render() {
        // Filter logic
        let filtered = allResources.filter(res => {
            const matchesFilter = activeFilter === 'all' || (res.tags && res.tags.includes(activeFilter));
            const matchesSearch = !searchQuery ||
                (res.title && res.title.toLowerCase().includes(searchQuery)) ||
                (res.desc && res.desc.toLowerCase().includes(searchQuery));
            return matchesFilter && matchesSearch;
        });

        // Update Meta
        if (resultMeta) {
            if (filtered.length === 0) {
                resultMeta.textContent = 'No resources found';
            } else {
                resultMeta.textContent = `Showing ${filtered.length} resources ${searchQuery ? `for "${searchQuery}"` : ''}`;
            }
        }

        // Render HTML
        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>No resources found matching your criteria. Try adjusting your search or filters.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map((res, index) => `
            <div class="resource-card reveal" style="transition-delay: ${index % 10 * 0.05}s">
                <div class="resource-tag">${(res.tags && res.tags[0]) || 'General'}</div>
                <div class="resource-icon">
                    <i class="${res.iconClass || 'fas fa-file-pdf'}"></i>
                </div>
                <div class="resource-info">
                    <h3>${res.title}</h3>
                </div>
                <div class="resource-footer">
                    <a href="${res.url}" target="_blank" rel="noopener" class="btn-download">
                        <span>Open Resource</span>
                        <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
            </div>
        `).join('');
        
        // Initialize reveal for newly added cards
        if (window.initReveal) {
            window.initReveal();
        }
    }

    // Run init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
