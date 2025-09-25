/**
 * Player Bridge - Compatibility layer for existing code
 * Provides backward compatibility while using the new Global Mini Player
 */

// Ensure global references exist
window.addEventListener('load', function() {
    const globalPlayer = window.globalMiniPlayer || window.__globalMiniPlayer;

    if (globalPlayer) {
        // Backward compatibility aliases
        window.persistentAudioPlayer = globalPlayer;
        window.globalAudioPlayer = globalPlayer;

        console.log('🔗 Player bridge established - compatibility ensured');
    }
});

// Legacy API bridge for old function calls
window.initializePersistentAudioPlayer = function() {
    if (window.globalMiniPlayer || window.__globalMiniPlayer) {
        console.log('✅ Global Mini Player already initialized');
        return;
    }

    // Force initialization if needed
    new GlobalMiniPlayer();
};

// Fast track initialization
document.addEventListener('DOMContentLoaded', function() {
    // Ensure player is available immediately
    if (!window.globalMiniPlayer && !window.__globalMiniPlayer) {
        new GlobalMiniPlayer();
    }
});