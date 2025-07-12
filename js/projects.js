// Projects Page JavaScript
class ProjectsPage {
  constructor() {
    this.slides = document.querySelectorAll('.slide');
    this.projectCards = document.querySelectorAll('.project-card');
    this.sliderContainer = document.querySelector('.slider-container');
    this.prevButton = document.querySelector('.slider-button.prev');
    this.nextButton = document.querySelector('.slider-button.next');
    this.filterToggle = document.querySelector('.filter-toggle');
    this.filterPanel = document.querySelector('.filter-panel');
    this.filterOptions = document.querySelectorAll('.filter-option input');
    
    // Search functionality
    this.searchInput = document.getElementById('projects-search');
    this.searchResultsCount = document.querySelector('.search-results-count');
    this.searchTerm = '';
    
    this.currentPage = 0;
    this.slidesPerPage = this.getSlidesPerPage();
    this.autoSlideInterval = null;
    this.observer = null;
    
    // Spotlight pagination
    this.slidesPerPage = 3; // Show 3 slides at a time
    this.currentPage = 0;
    this.spotlightPrevButton = document.querySelector('.spotlight-section .pagination-button.prev-page');
    this.spotlightNextButton = document.querySelector('.spotlight-section .pagination-button.next-page');
    this.spotlightCurrentPageSpan = document.querySelector('.spotlight-section .current-page');
    this.spotlightTotalPagesSpan = document.querySelector('.spotlight-section .total-pages');
    
    // Community projects pagination
    this.projectsPerPage = 25; // Show 25 projects per page
    this.currentProjectsPage = window.location.pathname.includes('projects-page-2.html') ? 2 : 1;
    this.communityPrevButton = document.querySelector('.community-section .pagination-button.prev-page');
    this.communityNextButton = document.querySelector('.community-section .pagination-button.next-page');
    this.communityCurrentPageSpan = document.querySelector('.community-section .current-page');
    this.communityTotalPagesSpan = document.querySelector('.community-section .total-pages');
    
    this.allProjects = [];
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupIntersectionObserver();
    this.slides.forEach(slide => {
      slide.style.display = 'block';
      slide.classList.remove('active');
      slide.style.animation = '';
    });
    this.checkSuccessMessage();
    this.setupPagination();
    this.updateSpotlightPagination();
    this.updateCommunityPagination();
    this.updateProjectsPage();

    // Add event listener for always-visible clear filters button
    const clearBtn = document.querySelector('.cta-buttons .clear-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearFilters());
    }
  }

  getSlidesPerPage() {
    return window.innerWidth > 1024 ? 3 : window.innerWidth > 768 ? 2 : 1;
  }

  setupEventListeners() {
    // Search functionality
    this.searchInput?.addEventListener('input', (e) => {
      this.searchTerm = e.target.value.toLowerCase();
      this.updateSearchResults();
    });

    // Ctrl+F functionality
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        this.searchInput?.focus();
        this.searchInput?.select();
      }
    });

    // Search button
    const searchButton = document.querySelector('.search-button');
    if (searchButton) {
      searchButton.addEventListener('click', () => {
        this.searchInput?.focus();
      });
    }

    // Slider navigation
    this.prevButton?.addEventListener('click', () => {
      this.prevPage();
      this.stopAutoSlide();
    });

    this.nextButton?.addEventListener('click', () => {
      this.nextPage();
      this.stopAutoSlide();
    });

    // Filter toggle
    this.filterToggle?.addEventListener('click', () => {
      const isHidden = this.filterPanel.style.display === 'none' || this.filterPanel.style.display === '';
      this.filterPanel.style.display = isHidden ? 'block' : 'none';
      this.filterToggle.classList.toggle('active');
    });

    // Filter options
    this.filterOptions?.forEach(option => {
      option.addEventListener('change', () => this.updateVisibility());
    });

    // Window resize
    window.addEventListener('resize', () => {
      this.updateSlidesPerPage();
    });
  }

  setupIntersectionObserver() {
    const options = {
      threshold: 0.5,
      rootMargin: '50px'
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          const target = parseInt(counter.dataset.target);
          this.animateCounter(counter, target);
          this.observer.unobserve(counter);
        }
      });
    }, options);

    document.querySelectorAll('.metric-value').forEach(counter => {
      this.observer.observe(counter);
    });
  }

  showPage(page) {
    const totalPages = Math.ceil(this.slides.length / this.slidesPerPage);
    this.currentPage = (page + totalPages) % totalPages;

    this.slides.forEach((slide, index) => {
      const slidePosition = index - (this.currentPage * this.slidesPerPage);
      
      if (slidePosition >= 0 && slidePosition < this.slidesPerPage) {
        slide.style.display = 'block';
        slide.classList.add('active');
        slide.style.animation = 'slideIn 0.5s forwards';
        slide.style.animationDelay = `${slidePosition * 0.1}s`;
      } else {
        slide.style.display = 'none';
        slide.classList.remove('active');
        slide.style.animation = '';
      }
    });
  }

  nextPage() {
    this.showPage(this.currentPage + 1);
  }

  prevPage() {
    this.showPage(this.currentPage - 1);
  }

  startAutoSlide() {
    this.stopAutoSlide();
    this.autoSlideInterval = setInterval(() => this.nextPage(), 5000);
  }

  stopAutoSlide() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
  }

  updateSlidesPerPage() {
    this.slidesPerPage = this.getSlidesPerPage();
    this.showPage(this.currentPage);
  }

  animateCounter(counter, target) {
    let current = 0;
    const duration = 2000;
    const step = (target / duration) * 16;
    
    counter.classList.add('animate-count');
    
    const updateCounter = () => {
      current += step;
      if (current < target) {
        counter.textContent = Math.round(current);
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = target;
      }
    };
    
    updateCounter();
  }

  updateVisibility() {
    const selectedFilters = this.getSelectedFilters();
    this.updateFilterCount(selectedFilters);
    this.filterProjects(selectedFilters);
  }

  getSelectedFilters() {
    const filters = {
      category: new Set(),
      type: new Set()
    };

    this.filterOptions.forEach(option => {
      if (option.checked) {
        filters[option.name].add(option.value);
      }
    });

    return filters;
  }

  updateFilterCount(selectedFilters) {
    const totalSelected = Object.values(selectedFilters)
      .reduce((sum, set) => sum + set.size, 0);
    const filterCount = document.querySelector('.filter-count');
    
    if (totalSelected > 0) {
      filterCount.textContent = `(${totalSelected})`;
      this.filterToggle.classList.add('has-filters');
    } else {
      filterCount.textContent = '';
      this.filterToggle.classList.remove('has-filters');
    }
  }

  async filterProjects(selectedFilters) {
    const hasCategoryFilters = selectedFilters.category && selectedFilters.category.size > 0;
    const hasTypeFilters = selectedFilters.type && selectedFilters.type.size > 0;

    if (!hasCategoryFilters && !hasTypeFilters) {
      renderProjects(this.allProjects);
      return;
    }

    let filtered = this.allProjects;
    if (hasCategoryFilters) {
      filtered = filtered.filter(project =>
        Array.from(selectedFilters.category).includes(project.category)
      );
    }
    if (hasTypeFilters) {
      filtered = filtered.filter(project =>
        Array.from(selectedFilters.type).includes(project.type)
      );
    }
    if (filtered.length === 1) {
      showPopup(filtered[0]);
    } else if (filtered.length > 1) {
      this.showMultipleProjectsPopupFromData(filtered);
    } else {
      renderProjects(filtered);
    }
  }

  showMultipleProjectsPopup(cards) {
    console.log('Popup called with projects:', cards);
    // Remove any existing filter popups
    document.querySelectorAll('.popup-overlay.filter-popup').forEach(el => el.remove());
    // Create popup overlay
    const div = document.createElement('div');
    div.className = 'popup-overlay filter-popup';
    div.innerHTML = `
      <div class="project-popup" style="max-width:900px;overflow:auto;max-height:90vh;">
        <button class="close-button" style="font-size:2.5rem;line-height:2rem;width:2.5rem;height:2.5rem;top:1rem;right:1rem;position:absolute;z-index:10;background:none;border:none;cursor:pointer;">×</button>
        <div style="padding:1rem 1rem 0 1rem;text-align:center;">
          <h2>Matching Projects</h2>
        </div>
        <div class="popup-projects-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;padding:1.5rem;"></div>
      </div>
    `;
    document.body.prepend(div);
    // Render each matching card as a mini card in the popup
    const grid = div.querySelector('.popup-projects-grid');
    cards.forEach(card => {
      const miniCard = card.cloneNode(true);
      miniCard.classList.add('popup-mini-card');
      // Remove any event listeners from the clone
      miniCard.onclick = null;
      grid.appendChild(miniCard);
    });
    // Robust close button
    const closeBtn = div.querySelector('.close-button');
    if (closeBtn) {
      closeBtn.onclick = () => div.remove();
    } else {
      // Fallback: close on overlay click
      div.onclick = (e) => {
        if (e.target === div) div.remove();
      };
    }
  }

  showNoResultsPopup() {
    // Remove any existing filter popups
    document.querySelectorAll('.popup-overlay.filter-popup').forEach(el => el.remove());
    // Create a simple popup
    const div = document.createElement('div');
    div.className = 'popup-overlay filter-popup';
    div.innerHTML = `
      <div class="project-popup">
        <button class="close-button">×</button>
        <div style="padding:2rem;text-align:center;">
          <h2>No projects found in the selected category.</h2>
          <button class="secondary-button clear-filters">
            Clear Filters <span class="button-icon">×</span>
          </button>
        </div>
      </div>
    `;
    document.body.prepend(div);
    div.querySelector('.close-button').onclick = () => div.remove();
    div.querySelector('.clear-filters').onclick = () => this.clearFilters();
  }

  showAllProjects() {
    this.projectCards.forEach(card => card.style.display = 'block');
    // Remove any filter popups
    document.querySelectorAll('.popup-overlay.filter-popup').forEach(el => el.remove());
  }

  checkSuccessMessage() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('status') === 'success') {
      const successMessage = document.getElementById('submission-success');
      successMessage.style.display = 'block';
      
      window.history.replaceState({}, document.title, window.location.pathname);
      
      setTimeout(() => {
        successMessage.style.display = 'none';
      }, 10000);
    }
  }

  setupPagination() {
    // Setup spotlight pagination
    if (this.spotlightPrevButton && this.spotlightNextButton) {
      this.spotlightPrevButton.addEventListener('click', () => {
        if (this.currentPage > 0) {
          this.currentPage--;
          this.showPage(this.currentPage);
          this.updateSpotlightPagination();
        }
      });

      this.spotlightNextButton.addEventListener('click', () => {
        const totalPages = Math.ceil(this.slides.length / this.slidesPerPage);
        if (this.currentPage < totalPages - 1) {
          this.currentPage++;
          this.showPage(this.currentPage);
          this.updateSpotlightPagination();
        }
      });
    }

    // Setup community projects pagination
    if (this.communityPrevButton && this.communityNextButton) {
      this.communityPrevButton.addEventListener('click', () => {
        if (this.currentProjectsPage === 2) {
          window.location.href = 'projects.html';
        }
      });

      this.communityNextButton.addEventListener('click', () => {
        if (this.currentProjectsPage === 1) {
          window.location.href = 'projects-page-2.html';
        }
      });
    }
  }

  updateProjectsPage() {
    const startIndex = (this.currentProjectsPage - 1) * this.projectsPerPage;
    const endIndex = startIndex + this.projectsPerPage;

    this.projectCards.forEach((card, index) => {
      if (index >= startIndex && index < endIndex) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  }

  updateSpotlightPagination() {
    if (!this.spotlightCurrentPageSpan || !this.spotlightTotalPagesSpan) return;

    const totalPages = Math.ceil(this.slides.length / this.slidesPerPage);
    
    this.spotlightCurrentPageSpan.textContent = this.currentPage + 1;
    this.spotlightTotalPagesSpan.textContent = totalPages;
    
    if (this.spotlightPrevButton) {
      this.spotlightPrevButton.disabled = this.currentPage === 0;
      this.spotlightPrevButton.innerHTML = '<span class="button-icon">←</span> Previous';
    }
    
    if (this.spotlightNextButton) {
      this.spotlightNextButton.disabled = this.currentPage === totalPages - 1;
      this.spotlightNextButton.innerHTML = 'Next <span class="button-icon">→</span>';
    }
  }

  updateCommunityPagination() {
    if (!this.communityCurrentPageSpan || !this.communityTotalPagesSpan) return;
    
    this.communityCurrentPageSpan.textContent = this.currentProjectsPage;
    this.communityTotalPagesSpan.textContent = 2; // We have 2 pages total
    
    if (this.communityPrevButton) {
      this.communityPrevButton.disabled = this.currentProjectsPage === 1;
      if (this.currentProjectsPage === 2) {
        this.communityPrevButton.innerHTML = '<span class="button-icon">←</span> Back to CTRL Spotlight';
      } else {
        this.communityPrevButton.innerHTML = '<span class="button-icon">←</span> Previous';
      }
    }
    
    if (this.communityNextButton) {
      this.communityNextButton.disabled = this.currentProjectsPage === 2;
      if (this.currentProjectsPage === 1) {
        this.communityNextButton.innerHTML = 'View More Projects <span class="button-icon">→</span>';
      } else {
        this.communityNextButton.innerHTML = 'Next <span class="button-icon">→</span>';
      }
    }
  }

  clearFilters() {
    // Uncheck all filter checkboxes
    this.filterOptions.forEach(option => {
      option.checked = false;
    });

    // Reset filter count
    const filterCount = document.querySelector('.filter-count');
    if (filterCount) {
      filterCount.textContent = '';
    }

    // Remove has-filters class from filter toggle
    this.filterToggle.classList.remove('has-filters');

    // Hide filter panel
    if (this.filterPanel) {
      this.filterPanel.style.display = 'none';
    }

    // Show all projects
    this.showAllProjects();

    // Remove any filter popups
    document.querySelectorAll('.popup-overlay.filter-popup').forEach(el => el.remove());
  }

  updateSearchResults() {
    if (!this.searchInput || !this.searchResultsCount) return;

    const searchTerm = this.searchTerm.toLowerCase();
    const projectCards = document.querySelectorAll('.project-card, .event-tile');
    let visibleCount = 0;
    let totalCount = projectCards.length;

    projectCards.forEach(card => {
      const title = card.querySelector('.project-title, .event-tile-title')?.textContent?.toLowerCase() || '';
      const description = card.querySelector('.project-description, .event-tile-desc')?.textContent?.toLowerCase() || '';
      const tags = Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase());
      const category = card.querySelector('.tag-category')?.textContent?.toLowerCase() || '';
      const type = card.querySelector('.tag-type')?.textContent?.toLowerCase() || '';

      const matchesSearch = !searchTerm || 
        title.includes(searchTerm) ||
        description.includes(searchTerm) ||
        tags.some(tag => tag.includes(searchTerm)) ||
        category.includes(searchTerm) ||
        type.includes(searchTerm);

      if (matchesSearch) {
        card.style.display = 'block';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // Update search results count
    if (searchTerm) {
      this.searchResultsCount.textContent = `Showing ${visibleCount} of ${totalCount} projects`;
    } else {
      this.searchResultsCount.textContent = `Showing all ${totalCount} projects`;
    }
  }

  showMultipleProjectsPopupFromData(projects) {
    // Remove any existing filter popups
    document.querySelectorAll('.popup-overlay.filter-popup').forEach(el => el.remove());
    // Create popup overlay
    const div = document.createElement('div');
    div.className = 'popup-overlay filter-popup';
    div.innerHTML = `
      <div class="project-popup" style="max-width:900px;overflow:auto;max-height:90vh;">
        <button class="close-button" style="font-size:2.5rem;line-height:2rem;width:2.5rem;height:2.5rem;top:1rem;right:1rem;position:absolute;z-index:10;background:none;border:none;cursor:pointer;">×</button>
        <div style="padding:1rem 1rem 0 1rem;text-align:center;">
          <h2>Matching Projects</h2>
        </div>
        <div class="popup-projects-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;padding:1.5rem;"></div>
      </div>
    `;
    document.body.prepend(div);
    // Render each matching project as a mini card in the popup
    const grid = div.querySelector('.popup-projects-grid');
    projects.forEach(project => {
      const card = document.createElement('div');
      card.className = 'project-card popup-mini-card';
      card.innerHTML = `
        <div class="project-header">
          <h3 class="project-title">${project.title}</h3>
          <div class="project-tags">
            <span class="tag tag-type">${project.type || ''}</span>
            <span class="tag tag-category">${project.category || ''}</span>
            <span class="tag tag-stage">${project.stage || ''}</span>
            <span class="tag tag-team">${project.team || ''}</span>
          </div>
        </div>
        <p class="project-description">${project.description || ''}</p>
      `;
      card.onclick = () => showPopup(project);
      grid.appendChild(card);
    });
    // Robust close button
    const closeBtn = div.querySelector('.close-button');
    if (closeBtn) {
      closeBtn.onclick = () => div.remove();
    } else {
      // Fallback: close on overlay click
      div.onclick = (e) => {
        if (e.target === div) div.remove();
      };
    }
  }
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const projectsPage = new ProjectsPage();
  const grid = document.querySelector('.projects-grid');
  const template = document.getElementById('project-card-template');
  let allProjects = [];
  let filteredProjects = [];

  // Fetch project data
  fetch('projects.json')
    .then(res => res.json())
    .then(data => {
      allProjects = data;
      filteredProjects = data;
      projectsPage.allProjects = data;
      renderProjects(filteredProjects);
    });

  // Helper to format event date
  function formatEventDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleString('default', { month: 'short', day: 'numeric' });
  }

  // Render projects
  async function renderProjects(projects) {
    grid.innerHTML = '';
    
    // Separate events, services, and regular projects
    const events = projects.filter(p => p.isEvent);
    const services = projects.filter(p => p.isService);
    const regularProjects = projects.filter(p => !p.isEvent && !p.isService);
    // Interleave events, services, and projects
    const maxLen = Math.max(events.length, services.length, regularProjects.length);
    const eventTemplate = document.getElementById('event-tile-template');
    for (let i = 0; i < maxLen; i++) {
      if (i < regularProjects.length) {
        const project = regularProjects[i];
        const card = template.content.cloneNode(true).querySelector('.project-card');
        if (project.ctrlPick) {
          const badge = document.createElement('div');
          badge.className = 'ctrl-pick-badge';
          badge.innerHTML = '<span class="star-icon">⭐</span> CTRL Picks';
          card.prepend(badge);
        }
        card.querySelector('.project-title').textContent = project.title;
        const tags = card.querySelector('.project-tags');
        tags.innerHTML = '';
        if (project.type) tags.innerHTML += `<span class="tag tag-type">${project.type}</span>`;
        if (project.category) tags.innerHTML += `<span class="tag tag-category">${project.category}</span>`;
        card.dataset.leadName = project.leadName || '';
        card.dataset.leadRole = project.leadRole || '';
        card.dataset.leadEmail = project.leadEmail || '';
        card.dataset.leadPhone = project.leadPhone || '';
        card.dataset.preferredContact = project.preferredContact || '';
        card.dataset.title = project.title || '';
        card.dataset.type = project.type || '';
        card.dataset.category = project.category || '';
        card.dataset.stage = project.stage || '';
        card.dataset.team = project.team || '';
        card.dataset.modality = project.modality || '';
        card.dataset.marketReach = project.marketReach || '';
        card.dataset.duration = project.duration || '';
        card.dataset.status = project.status ? project.status.join(',') : '';
        card.dataset.description = project.description || '';
        card.dataset.ctrlPick = project.ctrlPick ? 'true' : '';
        card.dataset.website = project.website || '';
        card.addEventListener('click', () => showPopup(project));
        grid.appendChild(card);
      }
      if (i < services.length) {
        const service = services[i];
        const card = template.content.cloneNode(true).querySelector('.project-card');
        card.querySelector('.project-title').textContent = service.title;
        const tags = card.querySelector('.project-tags');
        tags.innerHTML = '';
        if (service.type) tags.innerHTML += `<span class="tag tag-type">${service.type}</span>`;
        if (service.category) tags.innerHTML += `<span class="tag tag-category">${service.category}</span>`;
        card.dataset.leadName = service.leadName || '';
        card.dataset.leadRole = service.leadRole || '';
        card.dataset.leadEmail = service.leadEmail || '';
        card.dataset.leadPhone = service.leadPhone || '';
        card.dataset.preferredContact = service.preferredContact || '';
        card.dataset.title = service.title || '';
        card.dataset.type = service.type || '';
        card.dataset.category = service.category || '';
        card.dataset.stage = service.stage || '';
        card.dataset.team = service.team || '';
        card.dataset.modality = service.modality || '';
        card.dataset.marketReach = service.marketReach || '';
        card.dataset.duration = service.duration || '';
        card.dataset.status = service.status ? service.status.join(',') : '';
        card.dataset.description = service.description || '';
        card.dataset.ctrlPick = service.ctrlPick ? 'true' : '';
        card.dataset.website = service.website || '';
        card.dataset.activityLog = service.activityLog ? JSON.stringify(service.activityLog) : '';
        card.dataset.isService = 'true';
        card.dataset.services = service.services ? JSON.stringify(service.services) : '';
        card.dataset.serviceDetails = service.serviceDetails || '';
        card.dataset.serviceNote = service.serviceNote || '';
        card.addEventListener('click', () => showPopup(service));
        grid.appendChild(card);
      }
      if (i < events.length) {
        const event = events[i];
        const card = template.content.cloneNode(true).querySelector('.project-card');
        card.querySelector('.project-title').textContent = event.title;
        const tags = card.querySelector('.project-tags');
        tags.innerHTML = '';
        if (event.category) tags.innerHTML += `<span class="tag tag-category">${event.category}</span>`;
        card.dataset.title = event.title || '';
        card.dataset.category = event.category || '';
        card.dataset.description = event.description || '';
        card.dataset.isEvent = 'true';
        card.dataset.eventDetails = event.eventDetails ? JSON.stringify(event.eventDetails) : '';
        card.dataset.activityLog = event.activityLog ? JSON.stringify(event.activityLog) : '';
        card.dataset.link = event.link || '';
        card.addEventListener('click', () => showPopup(event));
        grid.appendChild(card);
      }
    }
    if (events.length === 0 && services.length === 0 && regularProjects.length === 0) {
      const msg = document.createElement('div');
      msg.textContent = 'No projects, services, or events found.';
      msg.style.color = '#888';
      msg.style.margin = '2rem 0';
      grid.appendChild(msg);
    }
  }

  // Popup logic
  function showPopup(project) {
    // Remove any existing popups
    document.querySelectorAll('.popup-overlay').forEach(el => el.remove());

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay custom-popup-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.5)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = 10000;

    // Create popup box
    const popup = document.createElement('div');
    popup.className = 'project-popup custom-popup-box';
    popup.style.background = '#fff';
    popup.style.borderRadius = '16px';
    popup.style.boxShadow = '0 8px 32px rgba(0,0,0,0.18)';
    popup.style.padding = '2rem 2.5rem';
    popup.style.maxWidth = '500px';
    popup.style.width = '90vw';
    popup.style.position = 'relative';
    popup.style.display = 'flex';
    popup.style.flexDirection = 'column';
    popup.style.justifyContent = 'center';
    popup.style.alignItems = 'center';
    popup.style.margin = '0'; // Ensure no margin pushes it down

    // X button
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.innerHTML = '&times;';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '1rem';
    closeButton.style.right = '1rem';
    closeButton.style.fontSize = '2rem';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.cursor = 'pointer';
    closeButton.style.lineHeight = '1';
    closeButton.style.color = '#333';
    closeButton.setAttribute('aria-label', 'Close');

    closeButton.onclick = (e) => {
      e.stopPropagation();
      overlay.remove();
    };

    // Description text
    const desc = document.createElement('div');
    desc.className = 'popup-description-only';
    desc.textContent = project.description;
    desc.style.fontSize = '1.1rem';
    desc.style.color = '#222';
    desc.style.textAlign = 'left';
    desc.style.margin = '1.5rem 0 0 0';
    desc.style.width = '100%';

    popup.appendChild(closeButton);
    popup.appendChild(desc);
    overlay.appendChild(popup);

    // Clicking the overlay closes the popup
    overlay.onclick = (e) => {
      if (e.target === overlay) overlay.remove();
    };

    document.body.appendChild(overlay);
  }

  window.showPopup = showPopup;
  window.projectsPage = projectsPage;
}); 