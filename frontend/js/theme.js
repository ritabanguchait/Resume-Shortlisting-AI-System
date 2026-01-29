/**
 * Theme Manager
 * Handles dark/light theme switching with localStorage persistence
 */

const ThemeManager = {
  STORAGE_KEY: 'resumeai-theme',
  THEME_LIGHT: 'light',
  THEME_DARK: 'dark',

  /**
   * Initialize theme on page load
   */
  init() {
    // Get saved theme or use system preference
    const savedTheme = this.getSavedTheme();
    const systemTheme = this.getSystemTheme();
    const theme = savedTheme || systemTheme;
    
    this.setTheme(theme, false);
    this.setupToggleButton();
    this.listenToSystemChanges();
  },

  /**
   * Get theme from localStorage
   */
  getSavedTheme() {
    try {
      return localStorage.getItem(this.STORAGE_KEY);
    } catch (e) {
      console.warn('localStorage not available:', e);
      return null;
    }
  },

  /**
   * Get system theme preference
   */
  getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return this.THEME_DARK;
    }
    return this.THEME_LIGHT;
  },

  /**
   * Get current theme
   */
  getTheme() {
    return document.documentElement.getAttribute('data-theme') || this.THEME_LIGHT;
  },

  /**
   * Set theme
   * @param {string} theme - 'light' or 'dark'
   * @param {boolean} save - Whether to save to localStorage
   */
  setTheme(theme, save = true) {
    // Validate theme
    if (theme !== this.THEME_LIGHT && theme !== this.THEME_DARK) {
      theme = this.THEME_LIGHT;
    }

    // Apply theme
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update toggle button icons
    this.updateToggleButton(theme);
    
    // Save to localStorage
    if (save) {
      try {
        localStorage.setItem(this.STORAGE_KEY, theme);
      } catch (e) {
        console.warn('Could not save theme:', e);
      }
    }

    // Dispatch custom event for other scripts to listen
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  },

  /**
   * Toggle between light and dark themes
   */
  toggle() {
    const currentTheme = this.getTheme();
    const newTheme = currentTheme === this.THEME_LIGHT ? this.THEME_DARK : this.THEME_LIGHT;
    this.setTheme(newTheme);
  },

  /**
   * Setup toggle button click handler
   */
  setupToggleButton() {
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggle());
      this.updateToggleButton(this.getTheme());
    }
  },

  /**
   * Update toggle button appearance
   */
  updateToggleButton(theme) {
    const lightIcon = document.querySelector('.theme-icon-light');
    const darkIcon = document.querySelector('.theme-icon-dark');
    
    if (lightIcon && darkIcon) {
      if (theme === this.THEME_DARK) {
        lightIcon.style.display = 'none';
        darkIcon.style.display = 'inline';
      } else {
        lightIcon.style.display = 'inline';
        darkIcon.style.display = 'none';
      }
    }
  },

  /**
   * Listen to system theme changes
   */
  listenToSystemChanges() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Only auto-switch if user hasn't manually set a preference
      mediaQuery.addEventListener('change', (e) => {
        if (!this.getSavedTheme()) {
          this.setTheme(e.matches ? this.THEME_DARK : this.THEME_LIGHT, false);
        }
      });
    }
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
} else {
  ThemeManager.init();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}
