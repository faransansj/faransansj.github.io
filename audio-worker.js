/**
 * Audio Service Worker for Cross-Page Audio Continuity
 * Manages persistent audio state across page navigations
 * Audio processing happens in main thread, Service Worker handles coordination
 */

const CACHE_NAME = 'audio-cache-v1';
const AUDIO_STATE_KEY = 'persistent-audio-state';

// Audio state storage (no direct audio processing)
let audioState = {
    currentTime: 0,
    isPlaying: false,
    trackInfo: null,
    volume: 1,
    duration: 0,
    audioUrl: null,
    timestamp: Date.now()
};

self.addEventListener('install', event => {
    console.log('Audio Service Worker installing...');
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
    console.log('Audio Service Worker activated');
    event.waitUntil(self.clients.claim());
});

// Handle messages from main thread
self.addEventListener('message', event => {
    const { type, data } = event.data;

    switch (type) {
        case 'UPDATE_STATE':
            updateAudioState(data);
            event.ports[0].postMessage({ success: true });
            broadcastState();
            break;

        case 'GET_STATE':
            event.ports[0].postMessage({
                success: true,
                state: audioState
            });
            break;

        case 'CACHE_AUDIO':
            cacheAudioFile(data.url)
                .then(() => {
                    event.ports[0].postMessage({ success: true });
                })
                .catch(error => {
                    event.ports[0].postMessage({ success: false, error: error.message });
                });
            break;
    }
});

function updateAudioState(newState) {
    audioState = {
        ...audioState,
        ...newState,
        timestamp: Date.now()
    };
    console.log('Audio state updated:', audioState);
}

async function cacheAudioFile(url) {
    try {
        const cache = await caches.open(CACHE_NAME);
        const response = await fetch(url);
        if (response.ok) {
            await cache.put(url, response);
            console.log('Audio file cached:', url);
        }
    } catch (error) {
        console.error('Error caching audio:', error);
        throw error;
    }
}

function broadcastState() {
    // Broadcast current audio state to all clients
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: 'AUDIO_STATE_SYNC',
                state: audioState
            });
        });
    });

    // Store state persistently
    self.registration.sync.register('audio-state-sync').catch(() => {
        console.log('Background sync not supported');
    });
}

// Handle background sync
self.addEventListener('sync', event => {
    if (event.tag === 'audio-state-sync') {
        event.waitUntil(syncAudioState());
    }
});

async function syncAudioState() {
    try {
        // Store state in IndexedDB or send to server if needed
        console.log('Syncing audio state:', audioState);
    } catch (error) {
        console.error('Error syncing audio state:', error);
    }
}

console.log('Audio Service Worker loaded and ready');