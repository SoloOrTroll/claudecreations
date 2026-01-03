/**
 * Claude Creations - Interactive functionality
 * A warm, organic community showcase
 */

// ============================================
// CONFIGURATION
// ============================================

// UPDATE THIS after deploying your Cloudflare Worker!
// Replace YOUR-SUBDOMAIN with your Cloudflare Workers subdomain
const WORKER_URL = 'https://claudecreations-submit.YOUR-SUBDOMAIN.workers.dev';

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initStatCounters();
    initFilterTags();
    initFormSubmission();
    initScrollAnimations();
    initSmoothScroll();
    initNavScroll();
    initLoadMore();
});

// ============================================
// ANIMATED STAT COUNTERS
// ============================================

function initStatCounters() {
    const statNumbers = document.querySelectorAll('.stat-number[data-count]');

    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    statNumbers.forEach(stat => observer.observe(stat));
}

function animateCounter(element) {
    const target = parseInt(element.dataset.count);
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    let current = 0;
    const increment = target / steps;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, stepDuration);
}

// ============================================
// PROJECT FILTERING
// ============================================

function initFilterTags() {
    const filterTags = document.querySelectorAll('.filter-tag');
    const projectCards = document.querySelectorAll('.project-card');

    filterTags.forEach(tag => {
        tag.addEventListener('click', () => {
            // Update active state
            filterTags.forEach(t => t.classList.remove('active'));
            tag.classList.add('active');

            const filter = tag.dataset.filter;

            // Filter projects with animation
            projectCards.forEach(card => {
                const category = card.dataset.category;

                if (filter === 'all' || category === filter) {
                    card.classList.remove('hidden');
                    card.style.animation = 'fadeIn 0.4s ease-out';
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });
}

// ============================================
// FORM SUBMISSION
// ============================================

function initFormSubmission() {
    const form = document.getElementById('submissionForm');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalContent = submitBtn.innerHTML;

        // Remove any existing status message
        const existingStatus = form.querySelector('.submit-status');
        if (existingStatus) existingStatus.remove();

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <span>Submitting to Claude for review...</span>
            <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                </circle>
            </svg>
        `;

        // Collect form data
        const formData = new FormData(form);
        const data = {
            projectName: formData.get('projectName'),
            creatorName: formData.get('creatorName'),
            email: formData.get('email'),
            projectUrl: formData.get('projectUrl'),
            imageUrl: formData.get('imageUrl'),
            category: formData.get('category'),
            description: formData.get('description'),
            firstProject: formData.get('firstProject') === 'on'
        };

        try {
            // Submit to Cloudflare Worker
            const response = await fetch(WORKER_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                // Reset form and show success
                form.reset();
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalContent;

                // Show success modal with custom message
                showModalWithMessage(
                    'Project Approved!',
                    result.message || 'Your project has been added to the gallery!'
                );
            } else {
                // Show error status
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalContent;

                const statusDiv = document.createElement('div');
                statusDiv.className = 'submit-status error';
                statusDiv.innerHTML = `<strong>Submission flagged:</strong> ${result.reason || result.error || 'Please try again.'}`;
                form.appendChild(statusDiv);
            }
        } catch (error) {
            console.error('Submission error:', error);

            // Reset button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalContent;

            // Show error
            const statusDiv = document.createElement('div');
            statusDiv.className = 'submit-status error';
            statusDiv.innerHTML = '<strong>Connection error:</strong> Please check your internet and try again.';
            form.appendChild(statusDiv);
        }
    });
}

// ============================================
// MODAL FUNCTIONALITY
// ============================================

function showModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function showModalWithMessage(title, message) {
    const modal = document.getElementById('successModal');
    if (modal) {
        const titleEl = modal.querySelector('h3');
        const messageEl = modal.querySelector('p');
        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        // Reset modal text
        const titleEl = modal.querySelector('h3');
        const messageEl = modal.querySelector('p');
        if (titleEl) titleEl.textContent = 'Submission Received!';
        if (messageEl) messageEl.textContent = "Thank you for sharing your creation! We'll review it and add it to the gallery soon.";
    }
}

// Close modal on backdrop click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
        closeModal();
    }
});

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Make closeModal available globally for onclick
window.closeModal = closeModal;

// ============================================
// SCROLL ANIMATIONS
// ============================================

function initScrollAnimations() {
    const animatedElements = document.querySelectorAll(
        '.project-card, .benefit, .stack-item, .about-text p'
    );

    animatedElements.forEach(el => el.classList.add('animate-on-scroll'));

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Stagger the animation
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animatedElements.forEach(el => observer.observe(el));
}

// ============================================
// SMOOTH SCROLLING
// ============================================

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const headerOffset = 100;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ============================================
// NAVIGATION SCROLL EFFECT
// ============================================

function initNavScroll() {
    const nav = document.querySelector('.nav');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        // Add shadow when scrolled
        if (currentScroll > 50) {
            nav.style.boxShadow = '0 4px 20px rgba(45, 42, 38, 0.1)';
        } else {
            nav.style.boxShadow = 'none';
        }

        lastScroll = currentScroll;
    });
}

// ============================================
// LOAD MORE FUNCTIONALITY
// ============================================

function initLoadMore() {
    const loadMoreBtn = document.getElementById('loadMore');
    const projectCards = document.querySelectorAll('.project-card');
    const INITIAL_VISIBLE = 9;

    if (!loadMoreBtn || projectCards.length <= INITIAL_VISIBLE) {
        // Hide button if not enough cards
        if (loadMoreBtn && projectCards.length <= INITIAL_VISIBLE) {
            loadMoreBtn.style.display = 'none';
        }
        return;
    }

    // Initially hide cards after the first 9
    projectCards.forEach((card, index) => {
        if (index >= INITIAL_VISIBLE) {
            card.classList.add('load-more-hidden');
            card.style.display = 'none';
        }
    });

    // Update button text to show count
    const hiddenCount = projectCards.length - INITIAL_VISIBLE;
    loadMoreBtn.innerHTML = `
        Load ${hiddenCount} More Creations
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12l7 7 7-7"/>
        </svg>
    `;

    loadMoreBtn.addEventListener('click', () => {
        // Show loading state briefly
        loadMoreBtn.innerHTML = `
            <span>Loading...</span>
            <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                </circle>
            </svg>
        `;

        setTimeout(() => {
            // Show all hidden cards with staggered animation
            const hiddenCards = document.querySelectorAll('.project-card.load-more-hidden');
            hiddenCards.forEach((card, index) => {
                setTimeout(() => {
                    card.style.display = '';
                    card.classList.remove('load-more-hidden');
                    card.style.animation = 'fadeIn 0.4s ease-out';
                }, index * 80);
            });

            // Hide the button
            loadMoreBtn.style.display = 'none';
        }, 500);
    });
}

// ============================================
// PROJECT DATA STRUCTURE
// ============================================

// Sample data structure for projects (can be expanded)
const sampleProjects = [
    {
        id: 1,
        title: "Winamp Audio Visualizer",
        description: "A nostalgic audio visualizer inspired by Winamp, built by someone with zero coding experience. Features reactive waveforms and retro aesthetics.",
        category: "visualizer",
        author: "u/CosmicHippie",
        url: "#",
        featured: true,
        firstProject: true,
        gradient: "gradient-1",
        icon: "🌈"
    },
    {
        id: 2,
        title: "Retro Platformer",
        description: "A charming 2D platformer with procedurally generated levels and hand-crafted pixel art style.",
        category: "game",
        author: "@pixelcrafter",
        url: "#",
        featured: false,
        firstProject: false,
        gradient: "gradient-2",
        icon: "🎮"
    }
    // Add more projects as needed
];

// Function to render a project card (for dynamic loading)
function renderProjectCard(project) {
    const card = document.createElement('article');
    card.className = `project-card ${project.featured ? 'featured' : ''} animate-on-scroll`;
    card.dataset.category = project.category;

    card.innerHTML = `
        <div class="card-image">
            <div class="image-placeholder ${project.gradient}">
                <span class="placeholder-icon">${project.icon}</span>
            </div>
            ${project.featured ? '<span class="card-badge">Featured</span>' : ''}
        </div>
        <div class="card-content">
            <div class="card-meta">
                <span class="meta-tag">${capitalizeFirst(project.category)}</span>
                <span class="meta-dot">·</span>
                <span class="meta-author">by ${project.author}</span>
            </div>
            <h3 class="card-title">${project.title}</h3>
            <p class="card-desc">${project.description}</p>
            <div class="card-footer">
                ${project.firstProject ? `
                    <span class="experience-badge">
                        <span class="badge-icon">✨</span>
                        First project ever
                    </span>
                ` : ''}
                <a href="${project.url}" class="card-link">View Project →</a>
            </div>
        </div>
    `;

    return card;
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================
// EASTER EGG - Konami Code
// ============================================

let konamiIndex = 0;
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
    if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
            activateEasterEgg();
            konamiIndex = 0;
        }
    } else {
        konamiIndex = 0;
    }
});

function activateEasterEgg() {
    document.body.style.transition = 'filter 0.5s ease';
    document.body.style.filter = 'hue-rotate(180deg)';

    setTimeout(() => {
        document.body.style.filter = 'none';
    }, 3000);

    // Show a fun message
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--color-terracotta);
        color: white;
        padding: 2rem 3rem;
        border-radius: 1rem;
        font-family: var(--font-display);
        font-size: 1.5rem;
        z-index: 9999;
        animation: fadeIn 0.3s ease-out;
    `;
    message.textContent = '✨ You found the secret! Keep creating! ✨';
    document.body.appendChild(message);

    setTimeout(() => {
        message.remove();
    }, 3000);
}

// ============================================
// CONSOLE GREETING
// ============================================

console.log(`
%c✦ Claude Creations ✦
%cA celebration of human + AI creativity

Built with Claude Opus 4.5
https://claudecreations.com
`,
'color: #C75B39; font-size: 24px; font-weight: bold;',
'color: #7D9B76; font-size: 14px;'
);
