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

    // Event delegation for project cards
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.slide, .project-card');
      if (card) {
        this.handleCardClick(card);
      }
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
    
    if (filtered.length === 0) {
      this.showNoResultsPopup();
    } else if (filtered.length === 1) {
      window.showPopup(filtered[0]);
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
        <button class="close-button">×</button>
        <div class="project-popup-header">
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
    // Show all bento cards
    document.querySelectorAll('.project-bento-card').forEach(card => card.style.display = 'block');
    // Show all category sections
    document.querySelectorAll('.category-bento').forEach(categoryBento => categoryBento.style.display = 'block');
    // Remove any filter popups
    document.querySelectorAll('.popup-overlay.filter-popup').forEach(el => el.remove());
  }

  handleCardClick(card) {
    if (this.autoSlideInterval) {
      this.stopAutoSlide();
    }
    
    // Remove any existing popups first
    document.querySelectorAll('.popup-overlay').forEach(el => el.remove());
    
    const template = document.querySelector('#project-popup-template');
    const popup = template.content.cloneNode(true);
    
    this.populatePopupContent(popup, card);
    document.body.appendChild(popup);
    
    this.setupPopupClose(popup, card);
  }

  populatePopupContent(popup, card) {
    const title = card.querySelector('h3').textContent;
    const tags = Array.from(card.querySelectorAll('.project-tags .tag')).map(tag => tag.cloneNode(true));
    
    const leadName = card.dataset.leadName || 'Project Lead Name';
    const leadRole = card.dataset.leadRole || 'Project Role';
    const leadEmail = card.dataset.leadEmail || '';
    const leadPhone = card.dataset.leadPhone || '';
    
    popup.querySelector('h2').textContent = title;
    popup.querySelector('.member-name').textContent = leadName;
    popup.querySelector('.member-role').textContent = leadRole;
    
    const popupTags = popup.querySelector('.project-tags');
    popupTags.innerHTML = '';
    tags.forEach(tag => popupTags.appendChild(tag));
    
    // Setup contact info
    this.setupContactInfo(popup, leadEmail, leadPhone);
    
    // Setup project description
    const descriptionContent = popup.querySelector('.description-content');
    if (card.dataset.description) {
      descriptionContent.innerHTML = `<p>${card.dataset.description}</p>`;
    } else {
      descriptionContent.innerHTML = '<p>No description available for this project.</p>';
    }
    
    // Setup project links
    const projectLinks = popup.querySelector('.project-links');
    const links = [];
    
    // Add website link if available
    if (card.dataset.website) {
      links.push({
        url: card.dataset.website,
        label: 'Visit Project Website',
        icon: '🌐',
        className: 'primary-button'
      });
    }
    
    // Add additional link if available
    if (card.dataset.additionalLink && card.dataset.additionalLinkLabel) {
      links.push({
        url: card.dataset.additionalLink,
        label: card.dataset.additionalLinkLabel,
        icon: '📋',
        className: 'secondary-button'
      });
    }
    
    // If no links available, show placeholder
    if (links.length === 0) {
      projectLinks.innerHTML = `
        <a href="#" class="project-link secondary-button disabled">
          <span class="link-icon">📋</span>
          No links available
        </a>
      `;
    } else {
      projectLinks.innerHTML = links.map(link => `
        <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="project-link ${link.className}">
          <span class="link-icon">${link.icon}</span>
          ${link.label}
        </a>
      `).join('');
    }
  }

  setupContactInfo(popup, email, phone) {
    const contactDetails = popup.querySelector('.contact-details');
    const emailElement = contactDetails.querySelector('.contact-method:first-child .contact-value');
    const phoneElement = contactDetails.querySelector('.contact-method:last-child .contact-value');
    
    emailElement.textContent = email;
    phoneElement.textContent = phone;
    
    if (!email && !phone) {
      phoneElement.parentElement.style.display = 'none';
      emailElement.parentElement.style.display = 'none';
    } else {
      if (!email) emailElement.parentElement.style.display = 'none';
      if (!phone) phoneElement.parentElement.style.display = 'none';
    }
  }

  setupPopupClose(popup, card) {
    const overlay = document.querySelector('.popup-overlay');
    const closeButton = overlay.querySelector('.close-button');
    
    if (overlay) {
      const closePopup = () => {
        overlay.remove();
        if (card.classList.contains('slide')) {
          this.startAutoSlide();
        }
      };
      
      // Add click handler for overlay background
      overlay.onclick = (e) => {
        if (e.target === overlay) {
          closePopup();
        }
      };
      
      // Add click handler for close button
      if (closeButton) {
        closeButton.onclick = (e) => {
          e.stopPropagation(); // Prevent event from bubbling to overlay
          closePopup();
        };
      }
    }
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
        this.communityPrevButton.innerHTML = '<span class="button-icon">←</span> Back to Project Hub';
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
    const projectCards = document.querySelectorAll('.project-bento-card, .event-tile');
    let visibleCount = 0;
    let totalCount = projectCards.length;

    projectCards.forEach(card => {
      const title = card.querySelector('.project-bento-title, .event-tile-title')?.textContent?.toLowerCase() || '';
      const description = card.querySelector('.project-bento-type')?.textContent?.toLowerCase() || '';
      // For bento cards, we need to get the project data from the dataset
      let projectData = null;
      if (card.dataset.project) {
        try {
          projectData = JSON.parse(card.dataset.project);
        } catch (e) {}
      }
      const category = projectData?.category?.toLowerCase() || '';
      const type = projectData?.type?.toLowerCase() || '';

      const matchesSearch = !searchTerm || 
        title.includes(searchTerm) ||
        description.includes(searchTerm) ||
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
    
    // Update category visibility based on search
    if (searchTerm) {
      document.querySelectorAll('.category-bento').forEach(categoryBento => {
        const visibleCards = categoryBento.querySelectorAll('.project-bento-card[style*="display: block"]').length;
        if (visibleCards === 0) {
          categoryBento.style.display = 'none';
        } else {
          categoryBento.style.display = 'block';
        }
      });
    } else {
      document.querySelectorAll('.category-bento').forEach(categoryBento => {
        categoryBento.style.display = 'block';
      });
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
        <button class="close-button">×</button>
        <div class="project-popup-header">
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
      card.className = 'project-bento-card popup-mini-card';
      card.innerHTML = `
        <h4 class="project-bento-title">${project.title}</h4>
        <div class="project-bento-type">${project.type || 'Project'}</div>
        <button class="project-bento-view-btn">View Details</button>
      `;
      card.onclick = () => window.showPopup(project);
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
  const grid = document.querySelector('.bento-categories-grid');
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

  // Popup logic - make it accessible to click handlers
  const showPopup = (project) => {
    console.log('showPopup called with project:', project);
    
    // Remove any existing popups first
    document.querySelectorAll('.popup-overlay').forEach(el => el.remove());
    
    const template = document.getElementById('project-popup-template');
    if (!template) {
      console.error('Template not found!');
      return;
    }
    console.log('Template found:', template);
    
    const popup = template.content.cloneNode(true);
    popup.querySelector('h2').textContent = project.title;
    const tags = popup.querySelector('.project-tags');
    tags.innerHTML = '';
    if (project.type) tags.innerHTML += `<span class="tag tag-type">${project.type}</span>`;
    if (project.stage) tags.innerHTML += `<span class="tag tag-stage">${project.stage}</span>`;
    if (project.category) {
      const categoryClass = project.category.toLowerCase().replace(/\s+/g, '-');
      tags.innerHTML += `<span class="tag tag-category ${categoryClass}">${project.category}</span>`;
    }
    if (project.modality) tags.innerHTML += `<span class="tag tag-modality">${project.modality}</span>`;
    if (project.team) tags.innerHTML += `<span class="tag tag-team">${project.team}</span>`;
    if (project.marketReach) tags.innerHTML += `<span class="tag tag-market">${project.marketReach}</span>`;
    if (project.duration) tags.innerHTML += `<span class="tag tag-duration">${project.duration}</span>`;
    if (project.status && Array.isArray(project.status)) {
      project.status.forEach(st => {
        tags.innerHTML += `<span class="tag tag-status">${st}</span>`;
      });
    }
    
    // Setup project lead info
    popup.querySelector('.member-name').textContent = project.leadName || 'Project Lead Name';
    popup.querySelector('.member-role').textContent = project.leadRole || 'Project Role';
    
    // Setup contact info
    const contactDetails = popup.querySelector('.contact-details');
    contactDetails.querySelector('.contact-method:first-child .contact-value').textContent = project.leadEmail || 'email@example.com';
    contactDetails.querySelector('.contact-method:last-child .contact-value').textContent = project.leadPhone || 'Phone number';
    if (!project.leadEmail) contactDetails.querySelector('.contact-method:first-child').style.display = 'none';
    if (!project.leadPhone) contactDetails.querySelector('.contact-method:last-child').style.display = 'none';

    // Setup project description
    const descriptionContent = popup.querySelector('.description-content');
    if (project.description) {
      descriptionContent.innerHTML = `<p>${project.description}</p>`;
    } else {
      descriptionContent.innerHTML = '<p>No description available for this project.</p>';
    }
    
    // Setup project links
    const projectLinks = popup.querySelector('.project-links');
    const links = [];
    
    // Add website link if available
    if (project.website) {
      links.push({
        url: project.website,
        label: 'Visit Project Website',
        icon: '🌐',
        className: 'primary-button'
      });
    }
    
    // Add additional link if available
    if (project.additionalLink && project.additionalLinkLabel) {
      links.push({
        url: project.additionalLink,
        label: project.additionalLinkLabel,
        icon: '📋',
        className: 'secondary-button'
      });
    }
    
    // If no links available, show placeholder
    if (links.length === 0) {
      projectLinks.innerHTML = `
        <a href="#" class="project-link secondary-button disabled">
          <span class="link-icon">📋</span>
          No links available
        </a>
      `;
    } else {
      projectLinks.innerHTML = links.map(link => `
        <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="project-link ${link.className}">
          <span class="link-icon">${link.icon}</span>
          ${link.label}
        </a>
      `).join('');
    }

    document.body.appendChild(popup);
    
    const overlay = document.querySelector('.popup-overlay');
    const closeButton = overlay.querySelector('.close-button');
    
    const closePopup = () => {
      overlay.remove();
    };
    
    // Add click handler for overlay background
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        closePopup();
      }
    };
    
    // Add click handler for close button
    if (closeButton) {
      closeButton.onclick = (e) => {
        e.stopPropagation(); // Prevent event from bubbling to overlay
        closePopup();
      };
    }
  };

  // Render projects
  async function renderProjects(projects) {
    const grid = document.querySelector('.bento-categories-grid');
    grid.innerHTML = '';
    
    // Group projects by category
    const projectsByCategory = {};
    
    projects.forEach(project => {
      const category = project.category || 'Other';
      if (!projectsByCategory[category]) {
        projectsByCategory[category] = [];
      }
      projectsByCategory[category].push(project);
    });
    
    // Create category sections
    Object.entries(projectsByCategory).forEach(([category, categoryProjects]) => {
      const categorySection = document.createElement('div');
      categorySection.className = `category-bento category-${category.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-')}`;
      
      // Get category icon
      const categoryIcon = getCategoryIcon(category);
      
      categorySection.innerHTML = `
        <div class="category-header">
          <div class="category-icon">${categoryIcon}</div>
          <h3 class="category-title">${category}</h3>
          <div class="category-count">${categoryProjects.length} project${categoryProjects.length !== 1 ? 's' : ''}</div>
        </div>
        <div class="projects-bento-grid">
          ${categoryProjects.map(project => createProjectBentoCard(project)).join('')}
        </div>
      `;
      
      grid.appendChild(categorySection);
    });
    
    // Add click handlers to bento cards directly
    setTimeout(() => {
      document.querySelectorAll('.project-bento-card').forEach((card, index) => {
        card.addEventListener('click', (e) => {
          try {
            // Get the project data from the card
            const projectData = JSON.parse(card.dataset.project);
            
            // Show popup when clicking anywhere on the card
            showPopup(projectData);
          } catch (error) {
            console.error('Error parsing project data:', error);
            console.log('Card dataset:', card.dataset);
          }
        });
      });
    }, 100);
  }

  // Helper function to create a project bento card
  function createProjectBentoCard(project) {
    const projectType = project.type || 'Project';
    const projectData = JSON.stringify(project);
    return `
      <div class="project-bento-card" data-project='${projectData}'>
        <h4 class="project-bento-title">${project.title}</h4>
        <div class="project-bento-type">${projectType}</div>
        <button class="project-bento-view-btn">View Details</button>
      </div>
    `;
  }

  // Helper function to get category icons
  function getCategoryIcon(category) {
    const iconMap = {
      'Health': '🏥',
      'Education': '📚',
      'Environment': '🌱',
      'Social Impact': '🤝',
      'Art / Design': '🎨',
      'Technology': '💻',
      'Food / Culture': '🍽️',
      'Wellness / Beauty': '✨'
    };
    return iconMap[category] || '📋';
  }

  // Make functions globally accessible
  window.showPopup = showPopup;
  window.projectsPage = projectsPage;
  
  // Also make the renderProjects function accessible for debugging
  window.renderProjects = renderProjects;
}); 