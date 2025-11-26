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
    LAZY_LOAD_THRESHOLD: 0.1,
    ANIMATION_CLASS: 'fade-in-visible',
    FORM_VALIDATION_DEBOUNCE: 300,
    MIN_NAME_LENGTH: 2,
    MAX_NAME_LENGTH: 100,
    MIN_MESSAGE_LENGTH: 10,
    MAX_MESSAGE_LENGTH: 1000,
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

  /**
   * Checks if IntersectionObserver is supported
   * @returns {boolean} True if supported
   */
  function isIntersectionObserverSupported() {
    return 'IntersectionObserver' in window &&
           'IntersectionObserverEntry' in window &&
           'intersectionRatio' in window.IntersectionObserverEntry.prototype;
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

    if (!isIntersectionObserverSupported()) {
      console.warn('[Navigation] IntersectionObserver not supported, skipping active nav highlighting');
      return;
    }

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
  // Lazy Loading Images
  // ============================================

  /**
   * Initializes lazy loading for images
   */
  function initLazyLoading() {
    const images = querySelectorAll('img[loading="lazy"]');
    
    if (images.length === 0) {
      console.info('[Images] No lazy-load images found');
      return;
    }

    // Check for native lazy loading support
    if ('loading' in HTMLImageElement.prototype) {
      console.info(`[Images] Native lazy loading supported for ${images.length} images`);
      trackImageLoadPerformance(images);
      return;
    }

    // Polyfill for browsers without native lazy loading
    if (!isIntersectionObserverSupported()) {
      console.warn('[Images] IntersectionObserver not supported, loading all images immediately');
      images.forEach(img => loadImage(img));
      return;
    }

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          loadImage(img);
          imageObserver.unobserve(img);
        }
      });
    }, {
      root: null,
      rootMargin: '50px',
      threshold: CONFIG.LAZY_LOAD_THRESHOLD
    });

    images.forEach(img => imageObserver.observe(img));
    
    console.info(`[Images] Lazy loading polyfill initialized for ${images.length} images`);
  }

  /**
   * Loads an image by setting its src attribute
   * @param {HTMLImageElement} img - Image element to load
   */
  function loadImage(img) {
    const src = img.getAttribute('src');
    if (!src) {
      console.warn('[Images] Image missing src attribute', img);
      return;
    }

    img.addEventListener('load', () => {
      console.info(`[Images] Loaded: ${src}`);
    }, { once: true });

    img.addEventListener('error', () => {
      console.error(`[Images] Failed to load: ${src}`);
    }, { once: true });
  }

  /**
   * Tracks image load performance
   * @param {HTMLImageElement[]} images - Array of image elements
   */
  function trackImageLoadPerformance(images) {
    if (!window.performance || !window.performance.getEntriesByType) {
      return;
    }

    window.addEventListener('load', () => {
      setTimeout(() => {
        const imageResources = performance.getEntriesByType('resource')
          .filter(entry => entry.initiatorType === 'img');
        
        if (imageResources.length > 0) {
          const totalSize = imageResources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0);
          const avgLoadTime = imageResources.reduce((sum, entry) => sum + entry.duration, 0) / imageResources.length;
          
          console.info(`[Images] Performance: ${imageResources.length} images, ${(totalSize / 1024).toFixed(2)}KB total, ${avgLoadTime.toFixed(2)}ms avg load time`);
        }
      }, 1000);
    });
  }

  // ============================================
  // Scroll-Triggered Animations
  // ============================================

  /**
   * Initializes scroll-triggered animations for feature cards
   */
  function initScrollAnimations() {
    const animatedElements = querySelectorAll('.feature-card, .benefit-item');
    
    if (animatedElements.length === 0) {
      console.info('[Animations] No animated elements found');
      return;
    }

    if (!isIntersectionObserverSupported()) {
      console.warn('[Animations] IntersectionObserver not supported, showing all elements immediately');
      animatedElements.forEach(el => el.classList.add(CONFIG.ANIMATION_CLASS));
      return;
    }

    const animationObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(CONFIG.ANIMATION_CLASS);
          animationObserver.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    });

    animatedElements.forEach(el => animationObserver.observe(el));
    
    console.info(`[Animations] Scroll animations initialized for ${animatedElements.length} elements`);
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
  // Contact Form Validation & Submission
  // ============================================

  /**
   * Validates name field
   * @param {string} name - Name to validate
   * @returns {{ valid: boolean, error: string }} Validation result
   */
  function validateName(name) {
    if (!isRequired(name)) {
      return { valid: false, error: 'Name is required' };
    }
    
    if (!hasMinLength(name, CONFIG.MIN_NAME_LENGTH)) {
      return { valid: false, error: `Name must be at least ${CONFIG.MIN_NAME_LENGTH} characters` };
    }
    
    if (name.trim().length > CONFIG.MAX_NAME_LENGTH) {
      return { valid: false, error: `Name must not exceed ${CONFIG.MAX_NAME_LENGTH} characters` };
    }
    
    return { valid: true, error: '' };
  }

  /**
   * Validates email field
   * @param {string} email - Email to validate
   * @returns {{ valid: boolean, error: string }} Validation result
   */
  function validateEmail(email) {
    if (!isRequired(email)) {
      return { valid: false, error: 'Email is required' };
    }
    
    if (!isValidEmail(email)) {
      return { valid: false, error: 'Please enter a valid email address' };
    }
    
    return { valid: true, error: '' };
  }

  /**
   * Validates message field
   * @param {string} message - Message to validate
   * @returns {{ valid: boolean, error: string }} Validation result
   */
  function validateMessage(message) {
    if (!isRequired(message)) {
      return { valid: false, error: 'Message is required' };
    }
    
    if (!hasMinLength(message, CONFIG.MIN_MESSAGE_LENGTH)) {
      return { valid: false, error: `Message must be at least ${CONFIG.MIN_MESSAGE_LENGTH} characters` };
    }
    
    if (message.trim().length > CONFIG.MAX_MESSAGE_LENGTH) {
      return { valid: false, error: `Message must not exceed ${CONFIG.MAX_MESSAGE_LENGTH} characters` };
    }
    
    return { valid: true, error: '' };
  }

  /**
   * Shows error message for a field
   * @param {HTMLElement} input - Input element
   * @param {string} errorMessage - Error message to display
   */
  function showError(input, errorMessage) {
    const errorId = input.getAttribute('aria-describedby');
    const errorElement = errorId ? document.getElementById(errorId) : null;
    
    if (errorElement) {
      errorElement.textContent = errorMessage;
      input.setAttribute('aria-invalid', 'true');
    }
  }

  /**
   * Clears error message for a field
   * @param {HTMLElement} input - Input element
   */
  function clearError(input) {
    const errorId = input.getAttribute('aria-describedby');
    const errorElement = errorId ? document.getElementById(errorId) : null;
    
    if (errorElement) {
      errorElement.textContent = '';
      input.setAttribute('aria-invalid', 'false');
    }
  }

  /**
   * Validates a single form field
   * @param {HTMLElement} input - Input element to validate
   * @returns {boolean} True if valid
   */
  function validateField(input) {
    const value = input.value;
    let result;
    
    switch (input.id) {
      case 'contact-name':
        result = validateName(value);
        break;
      case 'contact-email':
        result = validateEmail(value);
        break;
      case 'contact-message':
        result = validateMessage(value);
        break;
      default:
        return true;
    }
    
    if (result.valid) {
      clearError(input);
      return true;
    } else {
      showError(input, result.error);
      return false;
    }
  }

  /**
   * Validates all form fields
   * @param {HTMLFormElement} form - Form element
   * @returns {boolean} True if all fields are valid
   */
  function validateAllFields(form) {
    const nameInput = querySelector('#contact-name', form);
    const emailInput = querySelector('#contact-email', form);
    const messageInput = querySelector('#contact-message', form);
    
    if (!nameInput || !emailInput || !messageInput) {
      console.error('[Form] Required form fields not found');
      return false;
    }
    
    const nameValid = validateField(nameInput);
    const emailValid = validateField(emailInput);
    const messageValid = validateField(messageInput);
    
    return nameValid && emailValid && messageValid;
  }

  /**
   * Focuses the first invalid field
   * @param {HTMLFormElement} form - Form element
   */
  function focusFirstError(form) {
    const invalidInput = querySelector('[aria-invalid="true"]', form);
    if (invalidInput) {
      invalidInput.focus();
    }
  }

  /**
   * Resets the contact form
   * @param {HTMLFormElement} form - Form element
   */
  function resetContactForm(form) {
    form.reset();
    
    const inputs = querySelectorAll('input, textarea', form);
    inputs.forEach(input => clearError(input));
    
    console.info('[Form] Contact form reset');
  }

  /**
   * Shows success message and hides form
   * @param {HTMLFormElement} form - Form element
   */
  function showSuccessMessage(form) {
    const successElement = querySelector('#form-success');
    
    if (successElement) {
      form.style.display = 'none';
      successElement.style.display = 'block';
      successElement.focus();
      
      console.info('[Form] Success message displayed');
    }
  }

  /**
   * Handles form submission
   * @param {Event} event - Submit event
   */
  function handleFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = querySelector('button[type="submit"]', form);
    
    console.info('[Form] Form submission initiated');
    
    // Validate all fields
    const isValid = validateAllFields(form);
    
    if (!isValid) {
      console.warn('[Form] Form validation failed');
      focusFirstError(form);
      return;
    }
    
    // Disable submit button during processing
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
    }
    
    // Simulate form submission (no backend yet)
    setTimeout(() => {
      console.info('[Form] Form submitted successfully');
      
      // Show success message
      showSuccessMessage(form);
      
      // Reset form
      resetContactForm(form);
      
      // Re-enable submit button
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.setAttribute('aria-busy', 'false');
      }
    }, 500);
  }

  /**
   * Initializes contact form validation and submission
   */
  function initContactForm() {
    const form = querySelector('#contact-form');
    
    if (!form) {
      console.info('[Form] Contact form not found');
      return;
    }
    
    // Add submit event listener
    form.addEventListener('submit', handleFormSubmit);
    
    // Add real-time validation with debouncing
    const nameInput = querySelector('#contact-name', form);
    const emailInput = querySelector('#contact-email', form);
    const messageInput = querySelector('#contact-message', form);
    
    if (nameInput) {
      const debouncedValidateName = debounce(() => validateField(nameInput), CONFIG.FORM_VALIDATION_DEBOUNCE);
      nameInput.addEventListener('blur', () => validateField(nameInput));
      nameInput.addEventListener('input', debouncedValidateName);
    }
    
    if (emailInput) {
      const debouncedValidateEmail = debounce(() => validateField(emailInput), CONFIG.FORM_VALIDATION_DEBOUNCE);
      emailInput.addEventListener('blur', () => validateField(emailInput));
      emailInput.addEventListener('input', debouncedValidateEmail);
    }
    
    if (messageInput) {
      const debouncedValidateMessage = debounce(() => validateField(messageInput), CONFIG.FORM_VALIDATION_DEBOUNCE);
      messageInput.addEventListener('blur', () => validateField(messageInput));
      messageInput.addEventListener('input', debouncedValidateMessage);
    }
    
    console.info('[Form] Contact form validation initialized');
  }

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
      initLazyLoading();
      initScrollAnimations();
      initContactForm();

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
      isIntersectionObserverSupported,
      FormValidation,
      validateName,
      validateEmail,
      validateMessage,
      resetContactForm
    });
  }

})();