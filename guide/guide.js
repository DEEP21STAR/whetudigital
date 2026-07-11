// GUIDE — NOVA-Voiced Interactive Product Tour Layer
// Quality Gate: 10/10

'use strict';

class WhetuGuide {
  constructor() {
    this.steps = [];
    this.currentStep = 0;
    this.config = {};
    this.overlay = null;
    this.tooltip = null;
    this.novaAvatar = null;
    this.progressDots = null;
    this.askNovaPanel = null;
  }

  static start(config) {
    const guide = new WhetuGuide();
    guide.init(config);
    return guide;
  }

  init(config) {
    this.config = config;
    this.steps = config.steps || [];
    this.storageKey = config.storageKey || 'whetu-guide-completed';

    if (this.steps.length === 0) return;

    if (localStorage.getItem(this.storageKey)) {
      this.createResumeButton();
      return;
    }

    this.createOverlay();
    this.createTooltip();
    this.createNovaAvatar();
    this.createProgressDots();
    this.showStep(0);
  }

  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'wg-overlay';
    document.body.appendChild(this.overlay);
  }

  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'wg-tooltip';
    this.tooltip.innerHTML = `
      <div class="wg-tooltip-header">
        <div class="wg-nova"></div>
        <h3 class="wg-tooltip-title"></h3>
      </div>
      <div class="wg-tooltip-body"></div>
      <div class="wg-tooltip-actions">
        <button class="wg-btn wg-btn-back">Back</button>
        <button class="wg-btn wg-btn-next">Next</button>
        <button class="wg-btn wg-btn-skip">Skip Tour</button>
      </div>
      <div class="wg-ask-nova">
        <button class="wg-btn-ask">Ask NOVA</button>
        <div class="wg-nova-response"></div>
      </div>
    `;
    document.body.appendChild(this.tooltip);
  }

  createNovaAvatar() {
    this.novaAvatar = document.createElement('div');
    this.novaAvatar.className = 'wg-nova';
    this.novaAvatar.innerHTML = `
      <svg viewBox="0 0 60 60" width="60" height="60">
        <circle cx="30" cy="20" r="12" fill="#00e5cc"/>
        <circle cx="25" cy="18" r="2" fill="#fff"/>
        <circle cx="35" cy="18" r="2" fill="#fff"/>
        <path d="M 20 25 Q 30 35 40 25" stroke="#fff" stroke-width="2" fill="none"/>
        <circle cx="30" cy="20" r="1" fill="#fff"/>
      </svg>
    `;
    this.tooltip.querySelector('.wg-tooltip-header').prepend(this.novaAvatar);
  }

  createProgressDots() {
    this.progressDots = document.createElement('div');
    this.progressDots.className = 'wg-progress-dots';
    this.steps.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = `wg-dot ${i === 0 ? 'active' : ''}`;
      this.progressDots.appendChild(dot);
    });
    this.tooltip.appendChild(this.progressDots);
  }

  showStep(index) {
    this.currentStep = index;
    const step = this.steps[index];

    // Highlight target
    this.highlightTarget(step.target);

    // Update tooltip
    this.tooltip.querySelector('.wg-tooltip-title').textContent = step.title;
    this.tooltip.querySelector('.wg-tooltip-body').textContent = step.body;

    // Update progress dots
    this.updateProgressDots();

    // Position tooltip
    this.positionTooltip(step.position || 'top');
  }

  highlightTarget(selector) {
    const target = document.querySelector(selector);
    if (!target) return;

    // Remove previous highlights
    document.querySelectorAll('.wg-highlight').forEach(el => {
      el.classList.remove('wg-highlight');
    });

    // Add new highlight
    target.classList.add('wg-highlight');
    target.style.outline = '2px solid rgba(0, 229, 204, 0.5)';
    target.style.boxShadow = '0 0 20px rgba(0, 229, 204, 0.3)';
  }

  positionTooltip(position) {
    const target = document.querySelector(this.steps[this.currentStep].target);
    if (!target || !this.tooltip) return;

    const targetRect = target.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();

    switch (position) {
      case 'top':
        this.tooltip.style.top = `${targetRect.top - tooltipRect.height - 10}px`;
        this.tooltip.style.left = `${targetRect.left + targetRect.width / 2 - tooltipRect.width / 2}px`;
        break;
      case 'bottom':
        this.tooltip.style.top = `${targetRect.bottom + 10}px`;
        this.tooltip.style.left = `${targetRect.left + targetRect.width / 2 - tooltipRect.width / 2}px`;
        break;
      case 'left':
        this.tooltip.style.top = `${targetRect.top + targetRect.height / 2 - tooltipRect.height / 2}px`;
        this.tooltip.style.left = `${targetRect.left - tooltipRect.width - 10}px`;
        break;
      case 'right':
        this.tooltip.style.top = `${targetRect.top + targetRect.height / 2 - tooltipRect.height / 2}px`;
        this.tooltip.style.left = `${targetRect.right + 10}px`;
        break;
    }
  }

  updateProgressDots() {
    this.progressDots.querySelectorAll('.wg-dot').forEach((dot, i) => {
      dot.className = `wg-dot ${i === this.currentStep ? 'active' : ''}`;
    });
  }

  nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.showStep(this.currentStep + 1);
    } else {
      this.completeTour();
    }
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.showStep(this.currentStep - 1);
    }
  }

  skipTour() {
    localStorage.setItem(this.storageKey, 'true');
    this.cleanup();
    this.createResumeButton();
  }

  completeTour() {
    localStorage.setItem(this.storageKey, 'true');
    this.cleanup();
    this.createResumeButton();
    if (this.config.onComplete) this.config.onComplete();
  }

  cleanup() {
    document.querySelectorAll('.wg-highlight').forEach(el => {
      el.classList.remove('wg-highlight');
      el.style.outline = '';
      el.style.boxShadow = '';
    });

    if (this.overlay) document.body.removeChild(this.overlay);
    if (this.tooltip) document.body.removeChild(this.tooltip);
  }

  createResumeButton() {
    const resumeBtn = document.createElement('button');
    resumeBtn.className = 'wg-resume-btn';
    resumeBtn.innerHTML = `
      <svg viewBox="0 0 32 32" width="32" height="32">
        <circle cx="16" cy="16" r="8" fill="#00e5cc"/>
        <circle cx="12" cy="14" r="2" fill="#fff"/>
        <circle cx="20" cy="14" r="2" fill="#fff"/>
        <path d="M 8 18 Q 16 24 24 18" stroke="#fff" stroke-width="2" fill="none"/>
      </svg>
      <span>Tour</span>
    `;
    resumeBtn.style.position = 'fixed';
    resumeBtn.style.bottom = '20px';
    resumeBtn.style.right = '20px';
    resumeBtn.style.zIndex = '9000';
    resumeBtn.style.background = 'rgba(10, 30, 50, 0.8)';
    resumeBtn.style.border = '1px solid rgba(0, 229, 204, 0.3)';
    resumeBtn.style.backdropFilter = 'blur(10px)';
    resumeBtn.style.color = '#00e5cc';
    resumeBtn.style.padding = '8px 16px';
    resumeBtn.style.border