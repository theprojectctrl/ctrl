// Chatbot functionality for CTRL Word Finder
class CTRLChatbot {
  constructor() {
    this.messages = [];
    this.recentSearches = [];
    this.isTyping = false;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadRecentSearches();
    this.showWelcomeMessage();
    this.setupVoiceRecognition();
  }

  bindEvents() {
    const input = document.querySelector('.chatbot-input');
    const sendBtn = document.querySelector('.send-btn');
    const voiceBtn = document.querySelector('.voice-input-btn');
    const expandBtn = document.querySelector('.expand-btn');

    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleUserInput();
        }
      });

      input.addEventListener('input', () => {
        this.handleInputChange();
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        this.handleUserInput();
      });
    }

    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => {
        this.startVoiceInput();
      });
    }

    if (expandBtn) {
      expandBtn.addEventListener('click', () => {
        this.toggleRecentSearches();
      });
    }

    // Quick action cards
    document.addEventListener('click', (e) => {
      if (e.target.closest('.action-card')) {
        const actionCard = e.target.closest('.action-card');
        const action = actionCard.dataset.action;
        this.handleQuickAction(action);
      }

      if (e.target.closest('.result-card')) {
        const resultCard = e.target.closest('.result-card');
        this.handleResultClick(resultCard);
      }

      if (e.target.closest('.recent-item')) {
        const recentItem = e.target.closest('.recent-item');
        const searchText = recentItem.dataset.search;
        this.repeatSearch(searchText);
      }
    });
  }

  showWelcomeMessage() {
    const welcomeMessage = {
      type: 'bot',
      content: `
        <p>👋 Welcome to CTRL Word Finder! I'm your AI-powered innovation assistant.</p>
        <p>I can help you:</p>
        <ul>
          <li>🔍 Find projects and resources by keywords</li>
          <li>💡 Discover innovation opportunities</li>
          <li>🚀 Connect with like-minded innovators</li>
          <li>📚 Access curated knowledge resources</li>
        </ul>
        <p>Try typing something like "sustainability projects" or "AI innovation" to get started!</p>
      `
    };

    this.addMessage(welcomeMessage);
  }

  handleUserInput() {
    const input = document.querySelector('.chatbot-input');
    const userText = input.value.trim();

    if (!userText) return;

    // Add user message
    this.addMessage({
      type: 'user',
      content: `<p>${this.escapeHtml(userText)}</p>`
    });

    // Clear input
    input.value = '';

    // Add to recent searches
    this.addToRecentSearches(userText);

    // Show typing indicator
    this.showTypingIndicator();

    // Process the search
    setTimeout(() => {
      this.processSearch(userText);
    }, 1000);
  }

  async processSearch(query) {
    this.hideTypingIndicator();

    // Search through projects and resources
    const results = await this.searchData(query);
    
    if (results.length > 0) {
      this.showSearchResults(query, results);
    } else {
      this.showNoResults(query);
    }
  }

  async searchData(query) {
    const searchTerm = query.toLowerCase();
    const results = [];

    try {
      // Search in projects
      const projectsResponse = await fetch('projects.json');
      if (projectsResponse.ok) {
        const projects = await projectsResponse.json();
        const projectMatches = projects.filter(project => 
          project.title.toLowerCase().includes(searchTerm) ||
          project.description.toLowerCase().includes(searchTerm) ||
          project.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
        
        projectMatches.forEach(project => {
          results.push({
            type: 'project',
            title: project.title,
            description: project.description,
            tags: project.tags,
            icon: '🚀',
            url: `projects.html?id=${project.id}`
          });
        });
      }

      // Search in resources
      const resourcesResponse = await fetch('resources.json');
      if (resourcesResponse.ok) {
        const resources = await resourcesResponse.json();
        const resourceMatches = resources.filter(resource => 
          resource.title.toLowerCase().includes(searchTerm) ||
          resource.description.toLowerCase().includes(searchTerm) ||
          resource.category.toLowerCase().includes(searchTerm)
        );
        
        resourceMatches.forEach(resource => {
          results.push({
            type: 'resource',
            title: resource.title,
            description: resource.description,
            tags: [resource.category],
            icon: '📚',
            url: `resources.html?id=${resource.id}`
          });
        });
      }
    } catch (error) {
      console.error('Error searching data:', error);
    }

    return results.slice(0, 6); // Limit to 6 results
  }

  showSearchResults(query, results) {
    const message = {
      type: 'bot',
      content: `
        <p>🔍 I found <strong>${results.length}</strong> results for "<strong>${this.escapeHtml(query)}</strong>":</p>
        <div class="search-results">
          <h3>Search Results</h3>
          <div class="results-grid">
            ${results.map(result => `
              <div class="result-card" data-url="${result.url}">
                <div class="result-icon">${result.icon}</div>
                <div class="result-content">
                  <h4>${this.escapeHtml(result.title)}</h4>
                  <p>${this.escapeHtml(result.description)}</p>
                  <div class="result-tags">
                    ${result.tags.map(tag => `<span class="result-tag">${this.escapeHtml(tag)}</span>`).join('')}
                  </div>
                </div>
                <div class="result-arrow">→</div>
              </div>
            `).join('')}
          </div>
        </div>
      `
    };

    this.addMessage(message);
  }

  showNoResults(query) {
    const message = {
      type: 'bot',
      content: `
        <div class="no-results">
          <div class="no-results-icon">🔍</div>
          <h3>No results found for "${this.escapeHtml(query)}"</h3>
          <p>Don't worry! Try searching with different keywords or explore these popular categories:</p>
          <div class="suggested-categories">
            <button class="category-btn" onclick="chatbot.handleQuickAction('sustainability')">Sustainability</button>
            <button class="category-btn" onclick="chatbot.handleQuickAction('ai')">AI & Tech</button>
            <button class="category-btn" onclick="chatbot.handleQuickAction('health')">Health</button>
            <button class="category-btn" onclick="chatbot.handleQuickAction('education')">Education</button>
          </div>
        </div>
      `
    };

    this.addMessage(message);
  }

  handleQuickAction(action) {
    const actionMessages = {
      'sustainability': '🌱 Let me find sustainability and environmental innovation projects for you...',
      'ai': '🤖 Searching for AI, machine learning, and technology innovation projects...',
      'health': '🏥 Looking for healthcare and medical innovation projects...',
      'education': '🎓 Finding educational technology and learning innovation projects...',
      'submit': '📝 Ready to submit your project! Let me guide you through the process.',
      'resources': '📚 Here are some valuable resources to help with your innovation journey:',
      'community': '👥 Connect with other innovators in the CTRL community!'
    };

    const message = actionMessages[action] || 'Let me help you with that...';
    
    this.addMessage({
      type: 'bot',
      content: `<p>${message}</p>`
    });

    // Process the quick action
    setTimeout(() => {
      this.processQuickAction(action);
    }, 1000);
  }

  async processQuickAction(action) {
    this.hideTypingIndicator();

    if (action === 'submit') {
      window.location.href = 'submit-project.html';
      return;
    }

    if (action === 'resources') {
      window.location.href = 'resources.html';
      return;
    }

    if (action === 'community') {
      window.location.href = 'ctrl-cohort.html';
      return;
    }

    // Search for category-specific results
    const results = await this.searchData(action);
    
    if (results.length > 0) {
      this.showSearchResults(action, results);
    } else {
      this.showNoResults(action);
    }
  }

  handleResultClick(resultCard) {
    const url = resultCard.dataset.url;
    if (url) {
      window.location.href = url;
    }
  }

  addMessage(message) {
    this.messages.push(message);
    this.renderMessages();
    this.scrollToBottom();
  }

  renderMessages() {
    const messagesContainer = document.querySelector('.chat-messages');
    if (!messagesContainer) return;

    messagesContainer.innerHTML = this.messages.map(message => `
      <div class="message ${message.type}-message">
        <div class="message-avatar">
          ${message.type === 'bot' ? '🤖' : '👤'}
        </div>
        <div class="message-content">
          ${message.content}
        </div>
      </div>
    `).join('');
  }

  showTypingIndicator() {
    this.isTyping = true;
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
      typingIndicator.style.display = 'flex';
    }
  }

  hideTypingIndicator() {
    this.isTyping = false;
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
      typingIndicator.style.display = 'none';
    }
  }

  scrollToBottom() {
    const messagesContainer = document.querySelector('.chat-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  addToRecentSearches(searchText) {
    const search = {
      text: searchText,
      timestamp: new Date(),
      id: Date.now()
    };

    // Remove if already exists
    this.recentSearches = this.recentSearches.filter(s => s.text !== searchText);
    
    // Add to beginning
    this.recentSearches.unshift(search);
    
    // Keep only last 10 searches
    this.recentSearches = this.recentSearches.slice(0, 10);
    
    this.saveRecentSearches();
    this.renderRecentSearches();
  }

  renderRecentSearches() {
    const recentList = document.querySelector('.recent-list');
    if (!recentList) return;

    recentList.innerHTML = this.recentSearches.map(search => `
      <div class="recent-item" data-search="${this.escapeHtml(search.text)}">
        <div class="recent-icon">🔍</div>
        <div class="recent-text">${this.escapeHtml(search.text)}</div>
        <div class="recent-time">${this.formatTime(search.timestamp)}</div>
      </div>
    `).join('');
  }

  repeatSearch(searchText) {
    const input = document.querySelector('.chatbot-input');
    if (input) {
      input.value = searchText;
      input.focus();
    }
  }

  toggleRecentSearches() {
    const recentList = document.querySelector('.recent-list');
    const expandBtn = document.querySelector('.expand-btn');
    
    if (recentList && expandBtn) {
      recentList.classList.toggle('collapsed');
      expandBtn.textContent = recentList.classList.contains('collapsed') ? '▼' : '▲';
    }
  }

  loadRecentSearches() {
    const saved = localStorage.getItem('ctrl-recent-searches');
    if (saved) {
      try {
        this.recentSearches = JSON.parse(saved).map(search => ({
          ...search,
          timestamp: new Date(search.timestamp)
        }));
        this.renderRecentSearches();
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }

  saveRecentSearches() {
    localStorage.setItem('ctrl-recent-searches', JSON.stringify(this.recentSearches));
  }

  formatTime(timestamp) {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return timestamp.toLocaleDateString();
  }

  handleInputChange() {
    const input = document.querySelector('.chatbot-input');
    const sendBtn = document.querySelector('.send-btn');
    
    if (input && sendBtn) {
      if (input.value.trim()) {
        sendBtn.style.opacity = '1';
        sendBtn.style.transform = 'scale(1)';
      } else {
        sendBtn.style.opacity = '0.7';
        sendBtn.style.transform = 'scale(0.95)';
      }
    }
  }

  setupVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const input = document.querySelector('.chatbot-input');
        if (input) {
          input.value = transcript;
          this.handleUserInput();
        }
      };

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };
    }
  }

  startVoiceInput() {
    if (this.recognition) {
      this.recognition.start();
      const voiceBtn = document.querySelector('.voice-input-btn');
      if (voiceBtn) {
        voiceBtn.style.background = 'var(--success-color)';
        voiceBtn.style.color = 'white';
        
        setTimeout(() => {
          voiceBtn.style.background = '';
          voiceBtn.style.color = '';
        }, 2000);
      }
    } else {
      alert('Voice recognition is not supported in your browser.');
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.chatbot = new CTRLChatbot();
}); 