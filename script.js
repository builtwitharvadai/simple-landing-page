/**
 * Landing Page Interactive Script
 * Handles smooth scrolling, navigation highlighting, and basic interactivity
 * 
 * @generated-from: task-id:TASK-002 sprint:current
 * @modifies: index.html:v1.0.0
 * @dependencies: []
 */

(function() {
  'use strict';

  // ============================================
  // Configuration & Constants
  // ============================================
  const CONFIG = Object.freeze({
    SCROLL_OFFSET: 80,
    DEBOUNCE_DELAY: 100,
    INTERSECTION_THRESHOLD: 0.5,
    SMOOTH_SCROLL_BEHAVIOR: 'smooth',
    ACTIVE_NAV_CLASS: 'active',
    LOADED_CLASS: 'loaded',
  });

  // ============================================
  // Utility Functions
  // ============================================

  /**
   * Creates a debounced version of a function
   * @param {Function} func - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  function debounce(func, delay) {
    let timeoutId = null;
    
    return function debounced(...args) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        timeoutId = null;
      }, delay);
    };
  }

  /**
   * Safely queries a single element
   * @param {string} selector - CSS selector
   * @param {Element} context - Context element (default: document)
   * @returns {Element|null} Found element or null
   */
  function querySelector(selector, context = document) {
    try {
      return context.querySelector(selector);
    } catch (error) {
      console.error(`[Navigation] Invalid selector: ${selector}`, error);
      return null;
    }
  }

  /**
   * Safely queries multiple elements
   * @param {string} selector - CSS selector
   * @param {Element} context - Context element (default: document)
   * @returns {Element[]} Array of found elements
   */
  function querySelectorAll(selector, context = document) {
    try {
      return Array.from(context.querySelectorAll(selector));
    } catch (error) {
      console.error(`[Navigation] Invalid selector: ${selector}`, error);
      return [];
    }
  }

  /**
   * Checks if smooth scroll is supported
   * @returns {boolean} True if supported
   */
  function isSmoothScrollSupported() {
    return 'scrollBehavior' in document.documentElement.style;
  }

  /**
   * Polyfill for smooth scrolling
   * @param {number} targetPosition - Target scroll position
   * @param {number} duration - Animation duration in ms
   */
  function smoothScrollPolyfill(targetPosition, duration = 500) {
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    const startTime = performance.now();

    function animation(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function: easeInOutCubic
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      window.scrollTo(0, startPosition + distance * ease);
      
      if (progress < 1) {
        requestAnimationFrame(animation);
      }
    }
    
    requestAnimationFrame(animation);
  }

  // ============================================
  // Smooth Scrolling Navigation
  // ============================================

  /**
   * Initializes smooth scrolling for navigation links
   */
  function initSmoothScrolling() {
    const navLinks = querySelectorAll('a[href^="#"]');
    
    if (navLinks.length === 0) {
      console.warn('[Navigation] No anchor links found for smooth scrolling');
      return;
    }

    navLinks.forEach(link => {
      link.addEventListener('click', handleSmoothScroll);
    });

    console.info(`[Navigation] Smooth scrolling initialized for ${navLinks.length} links`);
  }

  /**
   * Handles smooth scroll click events
   * @param {Event} event - Click event
   */
  function handleSmoothScroll(event) {
    const href = event.currentTarget.getAttribute('href');
    
    if (!href || href === '#') {
      return;
    }

    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);
    
    if (!targetElement) {
      console.warn(`[Navigation] Target element not found: #${targetId}`);
      return;
    }

    event.preventDefault();
    
    const targetPosition = targetElement.getBoundingClientRect().top + 
                          window.pageYOffset - 
                          CONFIG.SCROLL_OFFSET;

    if (isSmoothScrollSupported()) {
      window.scrollTo({
        top: targetPosition,
        behavior: CONFIG.SMOOTH_SCROLL_BEHAVIOR
      });
    } else {
      smoothScrollPolyfill(targetPosition);
    }

    // Update URL without triggering scroll
    if (history.pushState) {
      history.pushState(null, '', href);
    }

    // Update focus for accessibility
    targetElement.setAttribute('tabindex', '-1');
    targetElement.focus({ preventScroll: true });
    targetElement.removeAttribute('tabindex');
  }

  // ============================================
  // Active Navigation Highlighting
  // ============================================

  /**
   * Initializes Intersection Observer for active nav highlighting
   */
  function initActiveNavHighlighting() {
    const sections = querySelectorAll('section[id]');
    const navLinks = querySelectorAll('.nav-menu a[href^="#"]');
    
    if (sections.length === 0 || navLinks.length === 0) {
      console.warn('[Navigation] Sections or nav links not found for highlighting');
      return;
    }

    // Create map of section IDs to nav links
    const navLinkMap = new Map();
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href !== '#') {
        const sectionId = href.substring(1);
        navLinkMap.set(sectionId, link);
      }
    });

    // Intersection Observer options
    const observerOptions = {
      root: null,
      rootMargin: `-${CONFIG.SCROLL_OFFSET}px 0px -50% 0px`,
      threshold: CONFIG.INTERSECTION_THRESHOLD
    };

    // Track currently active section
    let activeSection = null;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          
          if (activeSection !== sectionId) {
            activeSection = sectionId;
            updateActiveNavLink(sectionId, navLinkMap);
          }
        }
      });
    }, observerOptions);

    // Observe all sections
    sections.forEach(section => observer.observe(section));

    console.info(`[Navigation] Active highlighting initialized for ${sections.length} sections`);
  }

  /**
   * Updates active navigation link
   * @param {string} sectionId - Active section ID
   * @param {Map} navLinkMap - Map of section IDs to nav links
   */
  function updateActiveNavLink(sectionId, navLinkMap) {
    // Remove active class from all links
    navLinkMap.forEach(link => {
      link.classList.remove(CONFIG.ACTIVE_NAV_CLASS);
      link.removeAttribute('aria-current');
    });

    // Add active class to current link
    const activeLink = navLinkMap.get(sectionId);
    if (activeLink) {
      activeLink.classList.add(CONFIG.ACTIVE_NAV_CLASS);
      activeLink.setAttribute('aria-current', 'page');
    }
  }

  // ============================================
  // Mobile Menu Toggle (Future Enhancement)
  // ============================================

  /**
   * Initializes mobile menu toggle functionality
   * Note: HTML structure doesn't include hamburger menu yet
   */
  function initMobileMenu() {
    const menuToggle = querySelector('.menu-toggle');
    const navMenu = querySelector('.nav-menu');
    
    if (!menuToggle || !navMenu) {
      console.info('[Navigation] Mobile menu elements not found (expected for current design)');
      return;
    }

    menuToggle.addEventListener('click', () => {
      const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
      
      menuToggle.setAttribute('aria-expanded', !isExpanded);
      navMenu.classList.toggle('open');
      
      // Trap focus in menu when open
      if (!isExpanded) {
        const firstLink = querySelector('a', navMenu);
        if (firstLink) {
          firstLink.focus();
        }
      }
    });

    // Close menu on escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navMenu.classList.contains('open')) {
        menuToggle.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('open');
        menuToggle.focus();
      }
    });

    console.info('[Navigation] Mobile menu initialized');
  }

  // ============================================
  // Form Validation Helpers (Future Use)
  // ============================================

  /**
   * Validates email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid
   */
  function isValidEmail(email) {
    if (typeof email !== 'string') {
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Validates required field
   * @param {string} value - Value to validate
   * @returns {boolean} True if not empty
   */
  function isRequired(value) {
    if (typeof value !== 'string') {
      return false;
    }
    
    return value.trim().length > 0;
  }

  /**
   * Validates minimum length
   * @param {string} value - Value to validate
   * @param {number} minLength - Minimum length
   * @returns {boolean} True if meets minimum
   */
  function hasMinLength(value, minLength) {
    if (typeof value !== 'string' || typeof minLength !== 'number') {
      return false;
    }
    
    return value.trim().length >= minLength;
  }

  /**
   * Form validation utilities object
   */
  const FormValidation = Object.freeze({
    isValidEmail,
    isRequired,
    hasMinLength
  });

  // Make available globally for future use
  window.FormValidation = FormValidation;

  // ============================================
  // Scroll Event Handling
  // ============================================

  /**
   * Initializes debounced scroll event listener
   */
  function initScrollHandler() {
    const debouncedScrollHandler = debounce(() => {
      const scrollPosition = window.pageYOffset;
      
      // Add/remove header shadow based on scroll position
      const header = querySelector('header');
      if (header) {
        if (scrollPosition > 10) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      }
    }, CONFIG.DEBOUNCE_DELAY);

    window.addEventListener('scroll', debouncedScrollHandler, { passive: true });
    
    console.info('[Navigation] Scroll handler initialized');
  }

  // ============================================
  // Page Load Animations
  // ============================================

  /**
   * Adds loaded class to body for CSS animations
   */
  function initPageLoadAnimations() {
    // Add loaded class after a brief delay to trigger CSS animations
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.classList.add(CONFIG.LOADED_CLASS);
        console.info('[Navigation] Page load animations triggered');
      });
    });
  }

  // ============================================
  // Initialization
  // ============================================

  /**
   * Main initialization function
   */
  function init() {
    console.info('[Navigation] Initializing landing page interactivity...');

    try {
      // Initialize all features
      initSmoothScrolling();
      initActiveNavHighlighting();
      initMobileMenu();
      initScrollHandler();
      initPageLoadAnimations();

      console.info('[Navigation] All features initialized successfully');
    } catch (error) {
      console.error('[Navigation] Initialization error:', error);
    }
  }

  // ============================================
  // Entry Point
  // ============================================

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM already loaded
    init();
  }

  // Expose utilities for testing/debugging (non-production)
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    window.LandingPageDebug = Object.freeze({
      CONFIG,
      debounce,
      isSmoothScrollSupported,
      FormValidation
    });
  }

})();