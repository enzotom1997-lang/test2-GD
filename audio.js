// Audio management

export const menuMusic = new Audio('/584131_Geometry-Dash-Menu-Theme.mp3');
menuMusic.loop = true;
menuMusic.volume = 0.85;

let _musicPlaying = false;
let _retryTimer = null;
let _retryDelay = 600;
const _maxRetryDelay = 8000;
const _retryBackoff = 1.8;

export function tryPlayMusic() {
    if (_musicPlaying) return Promise.resolve();
    return menuMusic.play().then(() => {
        _musicPlaying = true;
        if (_retryTimer) {
            clearTimeout(_retryTimer);
            _retryTimer = null;
        }
    });
}

export function scheduleRetry() {
    if (_musicPlaying) return;
    if (_retryTimer) clearTimeout(_retryTimer);
    _retryTimer = setTimeout(() => {
        tryPlayMusic().catch(() => {
            _retryDelay = Math.min(Math.round(_retryDelay * _retryBackoff), _maxRetryDelay);
            scheduleRetry();
        });
    }, _retryDelay);
}

export function fadeMenuMusicIn() {
    try {
        menuMusic.currentTime = 0;
        menuMusic.volume = 0;
        menuMusic.play();
        
        let start = null;
        const duration = 500;
        const targetVolume = 0.85;
        function fadeIn(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            menuMusic.volume = Math.min((progress / duration) * targetVolume, targetVolume);
            if (progress < duration) {
                requestAnimationFrame(fadeIn);
            }
        }
        requestAnimationFrame(fadeIn);
    } catch(err) {}
}