/**
 * Claude Creations - Interactive functionality
 * A warm, organic community showcase
 */

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

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <span>Submitting...</span>
            <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                </circle>
            </svg>
        `;

        // Collect form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Simulate submission delay (replace with actual API call)
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Log submission (for now, just log to console)
        console.log('Submission received:', data);

        // Store in localStorage as a simple persistence mechanism
        const submissions = JSON.parse(localStorage.getItem('claudeCreations') || '[]');
        submissions.push({
            ...data,
            id: Date.now(),
            submittedAt: new Date().toISOString()
        });
        localStorage.setItem('claudeCreations', JSON.stringify(submissions));

        // Reset button and form
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalContent;
        form.reset();

        // Show success modal
        showModal();
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

function closeModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
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

const loadMoreBtn = document.getElementById('loadMore');
if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
        // Placeholder for loading more projects
        // In a real implementation, this would fetch from an API
        loadMoreBtn.innerHTML = `
            <span>Loading...</span>
            <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                </circle>
            </svg>
        `;

        setTimeout(() => {
            loadMoreBtn.innerHTML = `
                No more creations yet!
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14M5 12l7 7 7-7"/>
                </svg>
            `;
            loadMoreBtn.disabled = true;
            loadMoreBtn.style.opacity = '0.6';
        }, 1000);
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
