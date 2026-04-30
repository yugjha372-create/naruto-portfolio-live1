document.addEventListener('DOMContentLoaded', () => {
    
    // --- PRELOADER ---
    const preloader = document.getElementById('preloader');
    if (preloader) {
        const minLoadTime = 2500; // Match CSS animation duration
        const hidePreloader = () => {
            document.body.classList.add('loaded');
        };
        
        setTimeout(() => {
            if (document.readyState === 'complete') {
                hidePreloader();
            } else {
                window.addEventListener('load', hidePreloader);
            }
        }, minLoadTime);
    }

    // --- CUSTOM CURSOR ---
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');
    
    if (cursor && follower) {
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
            
            // Follower has slight delay
            setTimeout(() => {
                follower.style.left = e.clientX + 'px';
                follower.style.top = e.clientY + 'px';
            }, 50);
        });

        // Hover effects
        const interactiveElements = document.querySelectorAll('a, button, .video-card');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                document.body.classList.add('cursor-hover');
            });
            el.addEventListener('mouseleave', () => {
                document.body.classList.remove('cursor-hover');
            });
        });
    }

    // --- APPLE UI SCROLL ANIMATIONS ---
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                // Optional: stop observing once it has animated in
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.animate-on-scroll, .animate-slide-up, .animate-fade-in, .animate-slide-left, .animate-slide-right, .animate-scale-up');
    animatedElements.forEach(el => {
        observer.observe(el);
    });

    // --- SOUND POPUP & BUTTON CLICK ---
    // Create the popup toast element
    const popup = document.createElement('div');
    popup.className = 'sound-popup';
    popup.innerHTML = `
        <div class="icon-wrapper">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <span>Action Confirmed</span>
    `;
    document.body.appendChild(popup);

    let popupTimeout;

    function playClickSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        } catch (e) {
            console.error("Audio failed", e);
        }
    }

    const buttons = document.querySelectorAll('.btn-primary, .contact-btn, .nav-links a');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Only trigger if it's not a link that navigates away immediately (or just let it trigger briefly)
            playClickSound();
            
            // Show popup
            popup.classList.remove('show');
            // small delay to restart animation
            setTimeout(() => {
                popup.classList.add('show');
            }, 10);

            // Hide popup after 2.5s
            clearTimeout(popupTimeout);
            popupTimeout = setTimeout(() => {
                popup.classList.remove('show');
            }, 2500);
        });
    });
});
