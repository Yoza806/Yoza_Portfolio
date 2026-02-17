document.addEventListener('DOMContentLoaded', () => {
    
    // --- Mobile Menu Toggle ---
    const menuToggle = document.getElementById('menu-toggle');
    const closeMenu = document.getElementById('close-menu');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    function toggleMenu() {
        mobileMenu.classList.toggle('active');
        document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    }

    if (menuToggle) menuToggle.addEventListener('click', toggleMenu);
    if (closeMenu) closeMenu.addEventListener('click', toggleMenu);

    // Close menu when a link is clicked
    mobileLinks.forEach(link => {
        link.addEventListener('click', toggleMenu);
    });


    // --- Modal System ---
    const overlay = document.getElementById('modal-overlay');
    const triggers = document.querySelectorAll('.trigger-modal');
    const closeButtons = document.querySelectorAll('.close-modal');
    const modals = document.querySelectorAll('.modal');

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            overlay.classList.add('active');
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }

    function closeModal() {
        overlay.classList.remove('active');
        modals.forEach(m => m.classList.remove('active'));
        document.body.style.overflow = '';
    }

    // Attach click events to triggers
    triggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const modalId = trigger.getAttribute('data-modal');
            openModal(modalId);
        });
    });

    // Attach click events to close buttons
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // Close when clicking overlay
    if (overlay) overlay.addEventListener('click', closeModal);

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // --- Simple Scroll Reveal using IntersectionObserver ---
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.section-title, .project-card, .book-card, .gallery-item, .skills-column');
    
    // Add initial CSS via JS or we could do it in CSS style sheet
    revealElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });

    // Handle the "in-view" state update specifically for the styles we just set inline
    // We need a mutation observer or simpler: just modify the callback
    // Let's monkey-patch the style in the observer callback above? 
    // Actually, let's just use a class and add it to style.css for cleanliness next time.
    // For now, I'll update the observer callback to set styles directly to ensure it works without extra CSS.
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                revealObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    revealElements.forEach(el => revealObserver.observe(el));

});
