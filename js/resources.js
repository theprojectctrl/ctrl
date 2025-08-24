// Resources Page JavaScript
class ResourcesPage {
  constructor() {
    this.resourcesData = null;
    this.allResources = [];
    this.filteredResources = [];
    this.currentFilter = 'all';
    this.searchTerm = '';
    
    this.searchInput = document.getElementById('resources-search');
    this.resourcesGrid = document.getElementById('resources-grid');
    this.filterTags = document.querySelectorAll('.filter-tag');
    this.searchResultsCount = document.querySelector('.search-results-count');
    this.noResultsElement = document.getElementById('no-results');
    
    this.init();
  }

  async init() {
    await this.loadResources();
    this.setupEventListeners();
    this.renderResources();
  }

  async loadResources() {
    try {
      const response = await fetch('resources.json');
      this.resourcesData = await response.json();
      // Now resourcesData is a flat array
      this.allResources = Array.isArray(this.resourcesData) ? this.resourcesData : [];
      this.filteredResources = [...this.allResources];
    } catch (error) {
      console.error('Error loading resources:', error);
    }
  }

  setupEventListeners() {
    // Search functionality
    this.searchInput.addEventListener('input', (e) => {
      this.searchTerm = e.target.value.toLowerCase();
      this.filterAndRender();
    });

    // Filter tags
    this.filterTags.forEach(tag => {
      tag.addEventListener('click', () => {
        this.filterTags.forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        this.currentFilter = tag.dataset.filter;
        this.filterAndRender();
      });
    });

    // Ctrl+F functionality
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        this.searchInput.focus();
        this.searchInput.select();
      }
    });

    // Search button
    const searchButton = document.querySelector('.search-button');
    if (searchButton) {
      searchButton.addEventListener('click', () => {
        this.searchInput.focus();
      });
    }
  }

  filterAndRender() {
    this.filteredResources = this.allResources.filter(resource => {
      // Apply tag filter
      const matchesFilter = this.currentFilter === 'all' || 
        (resource.tags && resource.tags.includes(this.currentFilter));
      // Apply search filter
      const matchesSearch = !this.searchTerm || 
        resource.title.toLowerCase().includes(this.searchTerm) ||
        resource.description.toLowerCase().includes(this.searchTerm) ||
        (resource.tags && resource.tags.some(tag => tag.toLowerCase().includes(this.searchTerm)));
      return matchesFilter && matchesSearch;
    });
    this.renderResources();
  }

  renderResources() {
    if (this.filteredResources.length === 0) {
      this.resourcesGrid.style.display = 'none';
      this.noResultsElement.style.display = 'block';
      this.searchResultsCount.textContent = 'No resources found';
    } else {
      this.resourcesGrid.style.display = 'grid';
      this.noResultsElement.style.display = 'none';
      const totalCount = this.allResources.length;
      const filteredCount = this.filteredResources.length;
      if (this.searchTerm || this.currentFilter !== 'all') {
        this.searchResultsCount.textContent = `Showing ${filteredCount} of ${totalCount} resources`;
      } else {
        this.searchResultsCount.textContent = `Showing all ${totalCount} resources`;
      }
      this.resourcesGrid.innerHTML = this.filteredResources.map(resource => 
        this.createResourceCard(resource)
      ).join('');
    }
  }

  createResourceCard(resource) {
    const priceDisplay = resource.price > 0 ? `$${resource.price}` : 'Free';
    const priceClass = resource.price > 0 ? 'price-paid' : 'price-free';
    // Determine the best link to use
    let resourceUrl = '';
    if (resource.viewResourceLink && resource.viewResourceLink !== '#') {
      resourceUrl = resource.viewResourceLink;
    } else if (resource.link && resource.link !== '#') {
      resourceUrl = resource.link;
    }
    // Only show the button if there is a valid URL
    const viewResourceButton = resourceUrl ? `
      <a href="${resourceUrl}"
         class="resource-link"
         target="_blank"
         rel="noopener noreferrer">
        View Resource
        <span class="link-icon">→</span>
      </a>
    ` : '';
    return `
      <div class="resource-card" data-tags="${resource.tags ? resource.tags.join(',') : ''}">
        <div class="resource-header">
          <div class="resource-icon">${resource.icon}</div>
          <div class="resource-meta">
            <div class="resource-category">&nbsp;</div>
            <div class="resource-price ${priceClass}">${priceDisplay}</div>
          </div>
        </div>
        <div class="resource-content">
          <h3 class="resource-title">${resource.title}</h3>
          <p class="resource-description">${resource.description}</p>
          <div class="resource-tags">
            ${resource.tags ? resource.tags.map(tag => 
              `<span class="resource-tag">${this.formatTag(tag)}</span>`
            ).join('') : ''}
          </div>
        </div>
        <div class="resource-footer">
          ${viewResourceButton}
        </div>
      </div>
    `;
  }

  formatTag(tag) {
    // Capitalize each word, keep CTRL philosophy as is
    if (tag === 'CTRL philosophy') return 'CTRL Philosophy';
    return tag.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
}

// Global function for clearing all filters
function clearAllFilters() {
  const resourcesPage = window.resourcesPage;
  if (resourcesPage) {
    resourcesPage.searchInput.value = '';
    resourcesPage.searchTerm = '';
    resourcesPage.currentFilter = 'all';
    // Reset filter tags
    resourcesPage.filterTags.forEach(tag => {
      tag.classList.toggle('active', tag.dataset.filter === 'all');
    });
    resourcesPage.filterAndRender();
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.resourcesPage = new ResourcesPage();

  
}); 

<script>
(async function () {
  // 1) Fetch JSON
  const res = await fetch('data/resources.json'); // adjust path if needed
  const data = await res.json();

  // If your old code expects an array, keep it working:
  const resources = Array.isArray(data) ? data : (data.resources || []);
  const founderAdvice = Array.isArray(data) ? [] : (data.founderAdvice || []);

  // 2) Render your existing resources as usual (you likely already do this)
  if (window.renderResourcesGrid) {
    window.renderResourcesGrid(resources);
  } else {
    // If you don't have a function, your current code already populates #resources-grid.
    // Nothing to do here.
  }

  // 3) Render Founder Advice by category
  renderFounderAdvice(founderAdvice);

  function groupByCategory(items) {
    const map = new Map();
    items.forEach(item => {
      const key = (item.category || 'Other').trim();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return map;
  }

  function slugify(str) {
    return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function renderFounderAdvice(notes) {
    const mount = document.getElementById('founder-advice-categories');
    if (!mount) return;
    mount.innerHTML = '';

    const byCat = groupByCategory(notes);

    byCat.forEach((items, category) => {
      const catSlug = slugify(category);
      const wrapper = document.createElement('div');
      wrapper.className = `category-bento category-${catSlug}`;

      // header
      const header = document.createElement('div');
      header.className = 'category-header';
      header.innerHTML = `
        <div class="category-icon">💡</div>
        <h3 class="category-title">${category}</h3>
        <span class="category-count">${items.length}</span>
      `;
      wrapper.appendChild(header);

      // grid
      const grid = document.createElement('div');
      grid.className = 'founder-advice-grid';

      items.forEach(note => {
        const card = document.createElement('div');
        card.className = 'founder-advice-card';

        const img = document.createElement('img');
        img.className = 'founder-advice-img';
        if (note.image && note.image.trim()) {
          img.src = note.image;
          img.alt = note.title || 'Founder advice';
          img.style.display = 'block';
        }

        const title = document.createElement('h4');
        title.className = 'founder-advice-title';
        title.textContent = note.title || 'Untitled';

        const content = document.createElement('p');
        content.className = 'founder-advice-content';
        content.textContent = note.content || '';

        const credit = document.createElement('span');
        credit.className = 'founder-advice-credit';
        credit.textContent = note.credit ? `— ${note.credit}` : '';

        card.appendChild(img);
        card.appendChild(title);
        card.appendChild(content);
        card.appendChild(credit);
        grid.appendChild(card);
      });

      wrapper.appendChild(grid);
      mount.appendChild(wrapper);
    });
  }
})();
</script>
