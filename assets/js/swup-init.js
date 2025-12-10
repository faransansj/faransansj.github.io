// Initialize Swup for PJAX transitions
console.log('Swup Init: Starting...');
if (typeof Swup === 'undefined') {
    console.error('Swup Init: Swup library not loaded!');
} else {
    try {
        const swup = new Swup({
            containers: [
                '#site-nav',     // Navigation needs to update active states
                '.initial-content', // Main content area
                '#footer'        // Footer content might change
            ],
            plugins: [
                new SwupHeadPlugin(), // Updates title and meta tags
                new SwupScriptsPlugin({
                    head: true,
                    body: false
                })
            ]
        });
        window.swup = swup;
        console.log('Swup Init: Success', swup);

        // Re-initialize Global Mini Player components after page transitions
        // Since GMP is global and persistent, we don't 're-init' the class, 
        // but we might need to tell it that a page transition happened to update its internal state if needed.

        swup.hooks.on('page:view', () => {
            // Re-initialize things that might have broken
            if (window.MathJax) {
                // Simple re-process for MathJax if it's there
                // MathJax 3
                if (window.MathJax.typesetPromise) {
                    window.MathJax.typesetPromise();
                }
                // MathJax 2
                else if (window.MathJax.Hub) {
                    window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
                }
            }

            // Google Analytics (GA4) manual pageview trigger
            if (typeof gtag === 'function') {
                gtag('event', 'page_view', {
                    page_title: document.title,
                    page_location: location.href
                });
            }

            // Inform Global Player (if needed)
            // We check both global references for maximum compatibility
            const player = window.globalMiniPlayer || window.__globalMiniPlayer;
            if (player && typeof player.fastRestore === 'function') {
                player.fastRestore();
            }
        });
    } catch (e) {
        console.error('Swup Init: Failed', e);
    }
}
