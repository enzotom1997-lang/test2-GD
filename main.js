(function () {
const BG_SPEED_FACTOR = 0.08; 
const BASE_SPEED = 8.5; 

// Helper: wrap only capital letters in a span for the enlarged-first-letter effect.
// Returns safe string (handles falsy inputs).
function styleCaps(str) {
    if (!str) return '';
    return str.split('').map(c => (c >= 'A' && c <= 'Z') ? `<span class="lvl-first">${c}</span>` : c).join('');
}

const backgroundContainer = document.getElementById('background-container');
const groundContainer = document.getElementById('ground-container');

let scrollPosition = 0; 

 // Color tweening setup
let currentColor = { r: 0x28, g: 0x3E, b: 0xFF };
let targetColor = pickRandomColor();
let colorTransitionProgress = 0;
// Make transitions faster and avoid darker colors: shorter duration, stronger blend, and lighter random colors
const COLOR_TRANSITION_DURATION = 360; // ~6s at 60fps for a faster change
// Increase blend strength so colors appear more vibrant during transitions
const COLOR_BLEND_STRENGTH = 0.92; // stronger blend so changes feel more noticeable
// Hold between transitions in frames (shorter hold)
const HOLD_FRAMES = 45;

// Generate vivid, high-saturation colors by choosing a random hue and converting HSV->RGB.
function pickRandomColor() {
    // Random hue [0,360)
    const h = Math.random() * 360;
    const s = 0.9 + Math.random() * 0.1; // very high saturation (0.9-1.0)
    const v = 0.75 + Math.random() * 0.25; // bright values (0.75-1.0)

    // HSV to RGB
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r1 = 0, g1 = 0, b1 = 0;
    if (h < 60) { r1 = c; g1 = x; b1 = 0; }
    else if (h < 120) { r1 = x; g1 = c; b1 = 0; }
    else if (h < 180) { r1 = 0; g1 = c; b1 = x; }
    else if (h < 240) { r1 = 0; g1 = x; b1 = c; }
    else if (h < 300) { r1 = x; g1 = 0; b1 = c; }
    else { r1 = c; g1 = 0; b1 = x; }

    return {
        r: Math.round((r1 + m) * 255),
        g: Math.round((g1 + m) * 255),
        b: Math.round((b1 + m) * 255)
    };
}

function lerp(a, b, t) { return a + (b - a) * t; }

function colorToCss(c) { return `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`; }

let isLoaded = false;

function animate() {
    if (!isLoaded) {
        requestAnimationFrame(animate);
        return;
    }
    // 1. Update scroll
    scrollPosition += BASE_SPEED;

    // 2. Update color tween
    colorTransitionProgress++;

    // If we're in the hold period, colorTransitionProgress will be negative.
    // During hold we keep t = 0 so the visible color stays at the last blended state.
    let t = 0;
    if (colorTransitionProgress >= 0) {
        t = colorTransitionProgress / COLOR_TRANSITION_DURATION;
    }

    if (t >= 1) {
        // Instead of snapping fully to the target, take a subtle step toward it (fainter)
        const smoothT = 1; // finished easing
        const blendedFinal = {
            r: lerp(currentColor.r, targetColor.r, smoothT * COLOR_BLEND_STRENGTH),
            g: lerp(currentColor.g, targetColor.g, smoothT * COLOR_BLEND_STRENGTH),
            b: lerp(currentColor.b, targetColor.b, smoothT * COLOR_BLEND_STRENGTH)
        };
        // Make the blended result the new current base color, pick a new target,
        // and enter a hold period for a short pause between transitions.
        currentColor = blendedFinal;
        targetColor = pickRandomColor();
        colorTransitionProgress = -HOLD_FRAMES; // negative = holding frames
        t = 0;
    }

    const smoothT = t * t * (3 - 2 * t);
    // Apply blend strength so transitions are fainter (don't fully reach the target)
    const blended = {
        r: lerp(currentColor.r, targetColor.r, smoothT * COLOR_BLEND_STRENGTH),
        g: lerp(currentColor.g, targetColor.g, smoothT * COLOR_BLEND_STRENGTH),
        b: lerp(currentColor.b, targetColor.b, smoothT * COLOR_BLEND_STRENGTH)
    };

    // 3. Apply offsets and colors
    const groundOffset = scrollPosition;
    const backgroundOffset = scrollPosition * BG_SPEED_FACTOR;
    const cssColor = colorToCss(blended);

    groundContainer.style.backgroundPositionX = `-${groundOffset}px`;
    groundContainer.style.backgroundColor = cssColor;

    backgroundContainer.style.backgroundPositionX = `-${backgroundOffset}px`;
    backgroundContainer.style.backgroundColor = cssColor;

    requestAnimationFrame(animate);
}

function resetMenuColors() {
    // Reset to initial blue color: #283EFF (r: 40, g: 62, b: 255)
    currentColor = { r: 0x28, g: 0x3E, b: 0xFF };
    targetColor = pickRandomColor();
    colorTransitionProgress = 0;
}

/* Create and play looping menu music with robust retry + user-gesture resume */
const menuMusic = new Audio('/584131_Geometry-Dash-Menu-Theme.mp3');
menuMusic.loop = true;
menuMusic.volume = 0.85;

let _musicPlaying = false;
let _retryTimer = null;
let _retryDelay = 600; // start retry in ms
const _maxRetryDelay = 8000; // cap exponential backoff
const _retryBackoff = 1.8; // exponential factor

function tryPlayMusic() {
    if (_musicPlaying) return Promise.resolve();
    return menuMusic.play().then(() => {
        _musicPlaying = true;
        // clear any scheduled retries once playing
        if (_retryTimer) {
            clearTimeout(_retryTimer);
            _retryTimer = null;
        }
    });
}

function scheduleRetry() {
    if (_musicPlaying) return;
    if (_retryTimer) clearTimeout(_retryTimer);
    _retryTimer = setTimeout(() => {
        tryPlayMusic().catch(() => {
            // failed again — increase delay with backoff and try later
            _retryDelay = Math.min(Math.round(_retryDelay * _retryBackoff), _maxRetryDelay);
            scheduleRetry();
        });
    }, _retryDelay);
}

// --- Loading Screen Logic ---
(async function handleLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    const fill = document.getElementById('loading-bar-fill');
    const textEl = document.getElementById('loading-text');
    
    // Pick random text from the user-defined list
    const loadingTexts = [
        "Geometry Dash for life!!",
        "lol did you actually think this was a math game?",
        "Shhhh! You're gonna wake up the big one!",
        "bwomp",
        "this is proof that people can make actually good things in websim",
        "fire in the hole!",
        "Does anyone even read this?",
        "Pro tip: don't crash",
        "Sorry robtop!",
        "I love you gemini 3",
        "Play, Crash, Rage, Quit, Repeat",
        "This is such an impossible game",
        "Can you beat them all?"
    ];

    const rawText = loadingTexts[Math.floor(Math.random() * loadingTexts.length)];
    
    // Helper to wrap text into lines of up to `limit` characters without breaking words:
    // - Build lines word-by-word. If adding the next word would exceed the limit, move it to the next line.
    // - If a single word itself is longer than `limit` and the line is empty, allow that word to occupy the line (do not forcibly split it).
    function wrapText(str, limit) {
        if (!str) return '';
        const words = str.split(/\s+/);
        const lines = [];
        let current = '';

        for (let i = 0; i < words.length; i++) {
            const w = words[i];
            // If current line is empty, just set it to the word (allow long single words to exceed the limit)
            if (current.length === 0) {
                current = w;
                continue;
            }
            // Check if adding this word (with a space) would stay within limit
            if ((current.length + 1 + w.length) <= limit) {
                current += ' ' + w;
            } else {
                // commit current line and start a new one with this word
                lines.push(current);
                current = w;
            }
        }
        if (current.length > 0) lines.push(current);
        return lines.join('\n');
    }

    textEl.textContent = wrapText(rawText, 27);

    const assetsToLoad = [
        // Core Menu & Backgrounds
        '/R (1).png', '/PLANNER.png', '/slidergroove-uhd.png', '/Background1.png', '/Playsong.png',
        '/Ground1.png', '/Ground2.png', '/Icon.png', '/GJ_playBtn_001.png', '/online-button.png',
        '/settings-button.png', '/Menu line.png', '/Line.png', '/CornerBar.png',
        '/blueI.png', '/IMG_0075.png', '/GJ_button_01-uhd.png', '/arrow.png',
        '/Bar2.png', '/Menubackbutton.png', '/pinkarrow.png', '/editorpausebutton.png',
        '/zoomin.png', '/zoomout.png', '/Playlevel.png', '/Easy.png', '/StarA.webp',
        '/uncollectedcoin.png', '/Orbs.png', '/Selectionbox.png', '/Resume.png',
        '/Level complete.png', '/New best.png', '/lock.png', '/Starcoin.png',
        '/Menu button.png', '/StartPosition.webp', '/portal_03_front_0011.png',
        '/ship_portal.png', '/ship_12 (1).png', '/shipnotselected.png', '/shipselected.png',
        '/ChainDecor01.webp', '/ChainDecor02.webp', '/ChainDecor03.webp', '/ChainDecor04.webp',
        '/ChainLinkDecor01.webp', '/ChainLinkDecor02.webp', '/SmallPulsator01.webp', '/SmallPulsator02.webp',
        '/Spike.png', '/RegularSpike02.webp', '/RegularSpike03.webp', '/RegularSpike04.webp',
        '/ColourSpike01.webp', '/ColourSpike02.webp', '/ColourSpike03.webp', '/ColourSpike04.webp',
        '/OutlineSpike01.webp', '/OutlineSpike02.webp', '/OutlineSpike03.webp',
        '/FakeSpike01.webp', '/FakeSpike02.webp', '/FakeSpike03.webp', '/FakeSpike04.webp',
        '/ThornPit01.webp', '/ThornPit02.webp', '/ThornPit03.webp', '/ThornPit06.webp',
        '/RegularPlatform01.webp', '/RegularPlatform02.webp', '/RegularPlatform03.webp', '/GeometryDashingBlock.png', '/RegularPlatform05.webp',
        '/GridBlock01.webp', '/GridBlock02.png', '/GridBlock03.webp', '/GridBlock04.webp', '/GridBlock05.webp', '/GridBlock06.webp', '/GridBlock07.png', '/GridBlock08.webp',
        '/Beacon01.webp', '/Beacon02.webp', '/Beacon03.webp', '/ColourTrigger.webp', '/dialogIcon_008-uhd.png',
        // Cube Icons (fixed /canonical filenames) — swapped cube_1 and cube_5 variants as requested
        '/cube_1 (6).png', '/cube_1 (7).png', '/cube_2 (5).png', '/cube_2 (6).png',
        '/cube_3 (5).png', '/cube_3 (4).png', '/cube_4 (5).png', '/cube_4 (6).png',
        '/cube_5 (17).png', '/cube_5 (15).png', '/cube_6 (3).png', '/cube_6 (2).png',
        // Fonts and scripts
        '/PUSAB___.otf', '/Dosis-VariableFont_wght (1).ttf', '/main.js', '/style.css', '/index.html',
        // Misc decorative and UI assets
        '/topbar.png', '/sidebar.png', '/Leaderboard.png', '/Createbutton.png', '/Searchbutton.png',
        '/GJ_button_02-uhd.png', '/GJ_button_03-uhd.png', '/GJ_button_04-uhd.png', '/GJ_button_05-uhd.png',
        '/Selectionbox.png', '/CornerBar.png', '/ChainLinkDecor01.webp', '/ChainLinkDecor02.webp',
        '/ChainDecor01.webp', '/ChainDecor02.webp', '/ChainDecor03.webp', '/ChainDecor04.webp',
        '/Beacon01.webp', '/Beacon02.webp', '/Beacon03.webp',
        // Audio
        '/584131_Geometry-Dash-Menu-Theme.mp3', '/geometry-dash-level-selected.mp3',
        '/Geometry Dash Level Complete Sound Effect.mp3', '/Geometry Dash Stereo Madness soundtrack 4.mp3',
        '/Geometry Dash Death Sound - Sound Effect (HD).mp3', '/achievement-geometry-dash.mp3'
    ];

    let loadedCount = 0;
    const totalToLoad = assetsToLoad.length + 1; // +1 for fonts

    const updateProgress = () => {
        loadedCount++;
        const progress = Math.min(loadedCount / totalToLoad, 1);

        // Simple mapping: primary fill grows smoothly from 0% to 100% and we do not create additional elements.
        const primaryPercent = Math.min(Math.round(progress * 10000) / 100, 100); // clamp to 2 decimal precision
        fill.style.width = `${primaryPercent}%`;

        // When the bar is nearly complete, smoothly change the right tip from square to a full 18px rounded end.
        // Threshold at >=99% keeps the visual transition feeling intentional and avoids flicker.
        if (primaryPercent >= 99) {
            fill.classList.add('rounded-end');
        } else {
            fill.classList.remove('rounded-end');
        }
    };

    const loadPromises = assetsToLoad.map(url => {
        if (url.endsWith('.mp3')) {
            return new Promise((resolve) => {
                const audio = new Audio();
                audio.src = url;
                audio.oncanplaythrough = () => { resolve(); updateProgress(); };
                audio.onerror = () => { resolve(); updateProgress(); }; // skip failed
                audio.load();
            });
        } else {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = url;
                img.onload = () => { resolve(); updateProgress(); };
                img.onerror = () => { resolve(); updateProgress(); }; // skip failed
            });
        }
    });

    // Wait for fonts
    const fontPromise = document.fonts.ready.then(() => {
        updateProgress();
    });

    // Minimum visual time of 1 second for the loading bar feel
    const minTimePromise = new Promise(res => setTimeout(res, 1000));

    await Promise.all([...loadPromises, fontPromise, minTimePromise]);

    // Loading complete
    isLoaded = true;
    loadingScreen.style.display = 'none'; // Instant disappearance
    startMusicAfterLoading();
    loadingScreen.remove();
})();

function startMusicAfterLoading() {
    tryPlayMusic().catch(() => {
        // Autoplay blocked — start retry loop and attach lightweight user-gesture listeners
        _retryDelay = 600;
        scheduleRetry();

        // On first user interaction, try immediately and remove listeners if successful
        const gestureEvents = ['pointerdown', 'touchstart', 'keydown', 'mousedown'];
        function onUserGestureOnce(e) {
            tryPlayMusic().catch(() => {
                // if still blocked, keep retrying normally
            }).finally(() => {
                // remove gesture listeners after the attempt (they're no longer needed)
                gestureEvents.forEach(ev => window.removeEventListener(ev, onUserGestureOnce));
            });
        }
        gestureEvents.forEach(ev => window.addEventListener(ev, onUserGestureOnce, { passive: true }));
    });
}

/* Initial set */
backgroundContainer.style.backgroundColor = colorToCss(currentColor);
groundContainer.style.backgroundColor = colorToCss(currentColor);
/* Explicitly set the ground texture to Ground1.png */
groundContainer.style.backgroundImage = "url('/Ground1.png')";

animate();

// Prevent saving images via right-click/context menu and long-press on touch devices.
// Block contextmenu when it's triggered on an image element.
document.addEventListener('contextmenu', (e) => {
    const t = e.target;
    if (t && (t.tagName === 'IMG' || t.closest && t.closest('img'))) {
        e.preventDefault();
    }
}, { passive: false });

// Extra defensive touch handler: prevent the long-press virtual context menu on touch devices by
// intercepting touchstart and preventing the subsequent contextmenu if it's coming from an IMG.
let _touchImgTimer = null;
document.addEventListener('touchstart', (e) => {
    const t = e.target;
    if (t && (t.tagName === 'IMG' || t.closest && t.closest('img'))) {
        // Prevent native behavior on long-press by preventing the upcoming contextmenu
        if (_touchImgTimer) clearTimeout(_touchImgTimer);
        _touchImgTimer = setTimeout(() => {
            // If a contextmenu would appear, we've already blocked it above; keep timer cleared.
            _touchImgTimer = null;
        }, 700);
    }
}, { passive: true });

// Also prevent dragstart on images globally (extra safety for desktop)
document.addEventListener('dragstart', (e) => {
    if (e.target && e.target.tagName === 'IMG') e.preventDefault();
}, { passive: false });

/* -------------------------------------------------------------------------- */
/* Spring (elastic) button scale animation
   - Buttons grow with an elastic spring on pointerdown/touchstart
   - Release (pointerup/touchend/cancel) returns to rest and stops the animation
   - Uses a simple critically-damped spring integration with overshoot for "elastic" feel
*/
/* tombstone: removed inline createSpringAnimator implementation; now provided by spring.js as window.createSpringAnimator */

/* Attach to all gd-button elements */
const gdButtons = document.querySelectorAll('.gd-button');
gdButtons.forEach(btn => {
    const animator = createSpringAnimator(btn, {
        grow: 1.20,     // 20% larger on press
        stiffness: 1600, // higher stiffness for a quicker, snappier bounce
        damping: 20,     // slightly stronger damping so it settles faster
        mass: 0.7        // slightly lower mass shortens the oscillation period
    });

    // Use pointer events to unify mouse/touch/pen
    function onPointerDown(e) {
        // Only primary button or touch
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        animator.press();
        // ensure focus/click still works
        btn.setPointerCapture && btn.setPointerCapture(e.pointerId);
    }
    function onPointerUp(e) {
        // Snap instantly back to rest when the click finishes.
        animator.release();
        btn.releasePointerCapture && btn.releasePointerCapture(e.pointerId);
    }
    function onPointerCancel(e) {
        // cancel should also stop the animation immediately
        animator.stopImmediate();
        btn.releasePointerCapture && btn.releasePointerCapture(e.pointerId);
    }

    btn.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerCancel, { passive: true });

    // Defensive cleanup when the page is hidden or unloaded
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) animator.release();
    });
    window.addEventListener('pagehide', () => animator.stopImmediate());
});

 // Add a slightly less exaggerated spring animator for the centered settings button
(function () {
    const settingsBtn = document.getElementById('settings-btn');
    if (!settingsBtn) return;

    // Keep the settings button centered via baseTransform so the animator won't remove translateX(-50%)
    // Enable shrink behavior so the button visibly "presses down" instead of only popping up.
    const settingsAnimator = createSpringAnimator(settingsBtn, {
        grow: 1.10,            // mild overshoot on press
        stiffness: 2000,       // snappier response
        damping: 22,           // settle quickly
        mass: 0.6,
        baseTransform: 'translateX(-50%)' // preserve centering transform
        // removed shrink behavior so the button sizes up when pressed
    });

    function onPointerDown(e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        settingsAnimator.press();
        settingsBtn.setPointerCapture && settingsBtn.setPointerCapture(e.pointerId);
    }
    function onPointerUp(e) {
        // snap instantly back on release
        settingsAnimator.release();
        settingsBtn.releasePointerCapture && settingsBtn.releasePointerCapture(e.pointerId);
    }
    function onPointerCancel(e) {
        settingsAnimator.stopImmediate();
        settingsBtn.releasePointerCapture && settingsBtn.releasePointerCapture(e.pointerId);
    }

    settingsBtn.addEventListener('pointerdown', onPointerDown, { passive: true });
    settingsBtn.addEventListener('pointerup', onPointerUp, { passive: true });
    settingsBtn.addEventListener('pointercancel', onPointerCancel, { passive: true });

    // Ensure graceful behavior when page hidden/unloaded
    document.addEventListener('visibilitychange', () => { if (document.hidden) settingsAnimator.release(); });
    window.addEventListener('pagehide', () => settingsAnimator.stopImmediate());
})();

 // --- Play button fade flow ---
 (function () {
     const playBtn = document.getElementById('play-btn');
     if (!playBtn) return;
 
     function createOverlay(className) {
         const el = document.createElement('div');
         el.className = `transition-overlay ${className}`;
         document.body.appendChild(el);
         // Force style recalc so transitions apply when we change opacity
         void el.offsetWidth;
         return el;
     }
 
     playBtn.addEventListener('click', () => {
         // Level Data Configuration
         const styleCaps = (str) => {
             if (!str) return '';
             return str.split('').map(c => (c >= 'A' && c <= 'Z') ? `<span class="lvl-first">${c}</span>` : c).join('');
         };

         const LEVELS = [
             // Stereo Madness: regular blue gradient (default)
             { 
                 name: "Stereo Madness", difficulty: "/Easy.png", stars: 1, orbs: 50, type: "normal",
                 bgGradient: 'linear-gradient(to top, #09099F 0%, #0100FF 100%)',
                 groundColor: '#0100EF',
                 cardColor: 'rgba(0, 0, 134, 0.85)',
                 normalProgress: 0,
                 practiceProgress: 0
             },
             // Back On Track: magenta gradient top->bottom
             { 
                 name: "Back On Track", difficulty: "/Easy.png", stars: 2, orbs: 75, type: "normal",
                 bgGradient: 'linear-gradient(to top, #FF00FE 0%, #9A0099 100%)',
                 groundColor: '#E301E3',
                 cardColor: 'rgba(134, 0, 134, 0.85)',
                 normalProgress: 0,
                 practiceProgress: 0
             },
             // Coming Soon page: yellow-ish gradient and different ground tint
             { 
                 name: "Coming Soon!", type: "coming-soon",
                 bgGradient: 'linear-gradient(to top, #FAFC01 0%, #8A8B00 100%)',
                 groundColor: '#CBCC01',
                 cardColor: 'rgba(134, 134, 0, 0.85)',
                 normalProgress: 0,
                 practiceProgress: 0
             }
         ];
         let currentLevelIndex = 0;
         let isAnimating = false;
         let entryAnimId = null;
         let entryTimeoutId = null;
         let nextContainerRef = null;
         let nextIndexRef = null;

         // 1) Fade everything out to black over 0.5s
         const black = createOverlay('black');
         black.style.pointerEvents = 'auto'; 
         black.style.opacity = '1';
 
         // After black has fully appeared, crossfade to blank (white) over 0.5s
         setTimeout(() => {
             const blank = createOverlay('blank');
             blank.style.opacity = '0';
             void blank.offsetWidth;
 
             // --- Background Layer ---
             const bgLayer = document.createElement('div');
             bgLayer.style.position = 'absolute';
             bgLayer.style.inset = '0';
             bgLayer.style.zIndex = '0';
             const initialLevel = LEVELS[currentLevelIndex] || {};
             bgLayer.style.background = initialLevel.bgGradient || 'linear-gradient(to top, #09099F 0%, #0100FF 100%)';
             blank.appendChild(bgLayer);

             // --- Ground ---
             const ground = document.createElement('div');
             ground.className = 'blank-ground';
             // initialize ground color based on currently selected level
             ground.style.backgroundColor = initialLevel.groundColor || '#283EFF';
             blank.appendChild(ground);
             // expose references for later navigation color fades
             const _levelPageBlank = blank;
             const _levelPageGround = ground;
             let _levelPageBg = bgLayer;
 
             // --- Corner Bars ---
             const bl = document.createElement('img');
             bl.src = '/CornerBar.png';
             bl.className = 'corner-bar corner-bottom-left';
             blank.appendChild(bl);

             const br = document.createElement('img');
             br.src = '/CornerBar.png';
             br.className = 'corner-bar corner-bottom-right flipped';
             blank.appendChild(br);

             // --- Center Line for level page ---
             const centerLine = document.createElement('img');
             centerLine.src = '/Line.png';
             centerLine.className = 'level-center-line';
             centerLine.draggable = false;
             blank.appendChild(centerLine);

             // --- Info Button (blueI rotated) ---
             // create a wrapper so we can have the blue "i" and a secondary C-button side by side
             const infoBtnWrapper = document.createElement('div');
             infoBtnWrapper.className = 'info-btn-wrapper';

             // Secondary button: create it and show only for user @Planner (hidden otherwise)
             const infoActionBtn = document.createElement('div');
             // start hidden by default
             infoActionBtn.style.display = 'none';

             // NOTE (Planner / Websim): This C-button is intentionally shown only for the Websim user named "Planner"
             // by detecting window.websim.user.username === 'Planner' or via the query string ?planner=1.
             // Keep this logic here so Planner on Websim sees the C button while other users do not.
             // (If you need to test without Websim, append ?planner=1 to the URL.)
             // Show the C button for the websim user "Planner" OR when the page is opened with ?planner=1
             // Primary method: fetch current user info and check username === 'Planner'
             // Fallbacks: window.websim object or ?planner=1 query param (dev toggle)
             (function checkPlannerVisibility() {
                 const showButton = () => { infoActionBtn.style.display = ''; };

                 // Quick fallback: query param ?planner=1 or ?simulation=1 for local testing
                 const isPlannerQuery = window.location.search && (window.location.search.includes('planner=1') || window.location.search.includes('simulation=1'));
                 if (isPlannerQuery) {
                     showButton();
                     return;
                 }

                 // If a websim global exists, prefer it (sync check). Accept both 'Planner' and 'Simulation'.
                 try {
                     if (window.websim && websim.user && (websim.user.username === 'Planner' || websim.user.username === 'Simulation')) {
                         showButton();
                         return;
                     }
                 } catch (e) {
                     // fall through to async checks
                 }

                 // Try to use the websim API to get the current user (async). Support both Planner and Simulation.
                 (async () => {
                     try {
                         if (window.websim && typeof window.websim.getCurrentUser === 'function') {
                             const cur = await window.websim.getCurrentUser();
                             if (cur && (cur.username === 'Planner' || cur.username === 'Simulation')) {
                                 showButton();
                                 return;
                             }
                         }
                     } catch (e) {
                         // ignore
                     }

                     // Fallback: attempt to fetch a server-provided /websim-user.json (legacy)
                     try {
                         const resp = await fetch('/websim-user.json', { credentials: 'same-origin' });
                         if (resp && resp.ok) {
                             const data = await resp.json();
                             if (data && (data.username === 'Planner' || data.username === 'Simulation')) {
                                 showButton();
                                 return;
                             }
                         }
                     } catch (e) {
                         // ignore network errors — leave the button hidden
                     }
                 })();
             })();

             // configure the action button (it will be appended even if hidden)
             infoActionBtn.className = 'info-action-btn gd-button';
             infoActionBtn.draggable = false;

             const actionLetter = document.createElement('span');
             actionLetter.className = 'action-letter';
             actionLetter.textContent = 'C';
             infoActionBtn.appendChild(actionLetter);

             infoBtnWrapper.appendChild(infoActionBtn);

             const infoBtn = document.createElement('img');
             infoBtn.src = '/blueI.png';
             infoBtn.className = 'info-btn';
             infoBtnWrapper.appendChild(infoBtn);

             // Use spring animator for the blue info icon (rotated) and keep previous popup behavior
             (function attachInfoSpring(btn) {
                const animator = createSpringAnimator(btn, { 
                    grow: 1.15, 
                    stiffness: 1200, 
                    damping: 14,
                    baseTransform: 'rotate(-90deg)'
                });
                btn.addEventListener('pointerdown', () => animator.press(), { passive: true });
                btn.addEventListener('pointerup', () => animator.release(), { passive: true });
                btn.addEventListener('pointercancel', () => animator.stopImmediate(), { passive: true });

                btn.addEventListener('click', () => {
                    // Create Popup Overlay
                    const overlay = document.createElement('div');
                    overlay.className = 'info-popup-overlay';
                    
                    const box = document.createElement('div');
                    box.className = 'info-popup-box';
                    
                    const title = document.createElement('h2');
                    // Use the existing styleCaps helper so each capital letter gets the enlarged span
                    title.innerHTML = styleCaps("Level Stats");
                    box.appendChild(title);

                    const desc = document.createElement('div');
                    desc.className = 'stats-content';
                    // Pull current level name if possible, else default
                    const lName = (LEVELS && LEVELS[currentLevelIndex]) ? LEVELS[currentLevelIndex].name : "Stereo Madness";
                    // Larger level name and larger stat numbers for improved readability
                    desc.innerHTML = `
                        <div style="color: #FDFE00; margin-bottom: 6px; font-size: 52px; font-weight: 400; letter-spacing: -1px;">${lName}</div>
                        <div style="color: #40E348; font-size: 50px; letter-spacing: -1px;">Total Attempts<span class="colon">:</span> <span class="stat-val" style="font-size:43px; font-weight: 400; letter-spacing: -1px;">0</span></div>
                        <div style="color: #5CA5E7; font-size: 50px; letter-spacing: -1px;">Total Jumps<span class="colon">:</span> <span class="stat-val" style="font-size:43px; font-weight: 400; letter-spacing: -1px;">0</span></div>
                        <div style="color: #F701F9; font-size: 50px; letter-spacing: -1px;">Normal<span class="colon">:</span> <span class="stat-val" style="font-size:43px; font-weight: 400; letter-spacing: -1px;">0%</span></div>
                        <div style="color: #FCA54B; font-size: 50px; letter-spacing: -1px;">Practice<span class="colon">:</span> <span class="stat-val" style="font-size:43px; font-weight: 400; letter-spacing: -1px;">0%</span></div>
                    `;
                    box.appendChild(desc);

                    const okBtn = document.createElement('div');
                    okBtn.className = 'popup-ok-btn gd-button';
                    
                    const btnText = document.createElement('span');
                    btnText.className = 'gd-gradient-text';
                    btnText.textContent = "OK";
                    okBtn.appendChild(btnText);

                    // Spring for OK button
                    const okAnimator = createSpringAnimator(okBtn, { grow: 1.1, stiffness: 1200 });
                    okBtn.addEventListener('pointerdown', (e) => {
                        okAnimator.press();
                        okBtn.setPointerCapture(e.pointerId);
                    });
                    
                    function closePopup() {
                        overlay.style.opacity = '0';
                        box.style.transform = 'scale(0.8)';
                        setTimeout(() => {
                            overlay.remove();
                        }, 200);
                    }

                    okBtn.addEventListener('pointerup', (e) => {
                        okAnimator.release();
                        okBtn.releasePointerCapture(e.pointerId);
                        closePopup();
                    });
                    
                    box.appendChild(okBtn);
                    overlay.appendChild(box);
                    
                    // Add to DOM
                    const blankWrapper = btn.closest('.transition-overlay.blank');
                    if(blankWrapper) blankWrapper.appendChild(overlay);

                    // Animate In with spring behavior
                    requestAnimationFrame(() => {
                        overlay.style.opacity = '1';
                        // Apply CSS-based spring animation
                        box.style.animation = 'popupSpringIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
                    });
                });
             })(infoBtn);

             // Attach spring animator and interactions to the new C-button so it bounces like other buttons
             if (infoActionBtn) (function attachActionSpring(btn) {
                 const animator = createSpringAnimator(btn, { grow: 1.15, stiffness: 1200, damping: 14, mass: 0.8 });
                 btn.addEventListener('pointerdown', (e) => {
                     if (e.pointerType === 'mouse' && e.button !== 0) return;
                     animator.press();
                     btn.setPointerCapture && btn.setPointerCapture(e.pointerId);
                 }, { passive: true });
                 btn.addEventListener('pointerup', (e) => {
                     // stop immediately on release to match other buttons
                     animator.stopImmediate();
                     btn.releasePointerCapture && btn.releasePointerCapture(e.pointerId);

                     // 1) Fade everything out to black
                     const black = createOverlay('black');
                     black.style.pointerEvents = 'auto'; 
                     black.style.opacity = '1';

                     setTimeout(() => {
                         // Stop the looping menu music when navigating to the separate C page
                         try { menuMusic.pause(); } catch (err) {}

                         // Create a full-page "C page" overlay (not a popup)
                         const cOverlay = document.createElement('div');
                         cOverlay.className = 'transition-overlay c-page';
                         // Background is black for the "void" effect below the ground
                         cOverlay.style.backgroundColor = '#000';
                         cOverlay.style.background = '#000';
                         // Ensure it accepts pointer events and is visible immediately
                         cOverlay.style.pointerEvents = 'auto';
                         cOverlay.style.opacity = '1';
                         document.body.appendChild(cOverlay);

                         // Ensure scrolling/dragging on the C page only begins via primary (left) mouse button
                         // and via touch presses on mobile. Also prevent the context menu / long-press menu on this overlay.
                         cOverlay.addEventListener('contextmenu', (ev) => {
                             ev.preventDefault();
                         }, { passive: false });

                         // Prevent native long-press behavior on touch devices for this overlay so our press-to-drag works reliably.
                         cOverlay.addEventListener('touchstart', (ev) => {
                             // Prevent default to stop native long-press menu; we still handle pointer events for dragging.
                             ev.preventDefault();
                         }, { passive: false });

                         // Add a static background image (non-animated) and keep a fixed tint color #287DFF
                         const bgImg = document.createElement('img');
                         bgImg.src = '/Background1.png';
                         bgImg.style.position = 'absolute';
                         bgImg.style.top = '50%';
                         bgImg.style.left = '50%';
                         bgImg.style.transform = 'translate(-50%, -50%) translateZ(0)';
                         // Reduced background size slightly and nudged it upward to better frame the editor
                         bgImg.style.width = '290%'; 
                         bgImg.style.height = '290%';
                         bgImg.style.objectFit = 'cover';
                         bgImg.style.pointerEvents = 'none';
                         bgImg.draggable = false;
                         // Increase saturation/contrast so the background reads as vivid as the ground texture
                         bgImg.style.filter = 'saturate(1.45) contrast(1.05)';
                         // Slightly boost opacity so blend with the ground tint is consistent
                         bgImg.style.opacity = '0.98';
                         cOverlay.appendChild(bgImg);

                         // Overlay a fixed tint behind the other elements so colors do not change or animate
                         const tint = document.createElement('div');
                         tint.style.position = 'absolute';
                         tint.style.inset = '0';
                         tint.style.backgroundColor = '#287DFF';
                         tint.style.opacity = '1';
                         tint.style.mixBlendMode = 'multiply';
                         tint.style.pointerEvents = 'none';
                         cOverlay.appendChild(tint);

                         // Add a background grid made from thin black lines
                         // The gridLayer is a full-viewport layer that uses two CSS linear-gradients
                         // to draw horizontal and vertical hairlines which tile via background-size.
                         // - linear-gradient(to right, ...) renders vertical lines by repeating a 2px black
                         //   stripe and transparent remainder horizontally.
                         // - linear-gradient(to bottom, ...) renders horizontal lines similarly.
                         // The result is a performant, infinitely tiling grid that can be repositioned
                         // by adjusting backgroundPosition for parallax/panning without creating many DOM nodes.
                         const gridLayer = document.createElement('div');
                         gridLayer.style.position = 'absolute';
                         // fill the overlay
                         gridLayer.style.inset = '0';
                         // keep it visually behind interactive UI but above background art
                         gridLayer.style.zIndex = '1';
                         // each gradient draws a 2px opaque line then transparent space so the grid looks thin
                         gridLayer.style.backgroundImage = [
                            "linear-gradient(to right, rgba(0,0,0,0.2) 2px, transparent 2px)",
                            "linear-gradient(to bottom, rgba(0,0,0,0.2) 2px, transparent 2px)"
                         ].join(',');
                         // cell size controls the grid spacing; this will be updated dynamically when zoom changes
                         gridLayer.style.backgroundSize = '60px 60px';
                         // grid is decorative only — don't capture pointer events
                         gridLayer.style.pointerEvents = 'none';
                         cOverlay.appendChild(gridLayer);

                         // Add the ground as a fixed element using Ground1.png and a stable color (will be moved via backgroundPosition)
                         const groundDiv = document.createElement('div');
                         groundDiv.style.position = 'absolute';
                         groundDiv.style.left = '-10%'; // extra width for safe scrolling
                         groundDiv.style.width = '120%';
                         groundDiv.style.bottom = '0';
                         groundDiv.style.height = '35%'; // made ground bigger
                         groundDiv.style.backgroundImage = "url('/Ground1.png')";
                         groundDiv.style.backgroundRepeat = 'repeat-x';
                         groundDiv.style.backgroundSize = 'auto 100%';
                         groundDiv.style.backgroundPosition = '0px center';
                         // ensure static color and no animation; blend the tint with the texture so the image reads as a saturated blue
                         groundDiv.style.backgroundColor = '#004CFF';
                         groundDiv.style.backgroundBlendMode = 'multiply';
                         groundDiv.style.pointerEvents = 'none';
                         groundDiv.style.transformOrigin = 'bottom center';
                         groundDiv.draggable = false;
                         groundDiv.style.zIndex = '10'; // Keep ground and its void above the grid
                         cOverlay.appendChild(groundDiv);

                         // Add a black void div that moves with the ground to hide background content below it
                         const voidDiv = document.createElement('div');
                         voidDiv.style.position = 'absolute';
                         voidDiv.style.top = '100%';
                         voidDiv.style.left = '0';
                         voidDiv.style.width = '100%';
                         // Increased the void height so the editor's black area extends much farther (taller black box)
                         voidDiv.style.height = '16000px'; // taller to cover larger scrolling ranges
                         voidDiv.style.backgroundColor = '#000';
                         voidDiv.style.pointerEvents = 'none';
                         groundDiv.appendChild(voidDiv);

                         // Add the centered Line graphic (static)
                         const lineImg = document.createElement('img');
                         lineImg.src = '/Line.png';
                         lineImg.style.position = 'absolute';
                         lineImg.style.left = '50%';
                         // align it exactly on top of the ground relative to the screen initially
                         lineImg.style.top = '65%'; // 100 - 35
                         lineImg.style.transform = 'translate(-50%, -50%)';
                         lineImg.style.width = '100%';
                         lineImg.style.maxWidth = '1000px';
                         lineImg.style.pointerEvents = 'none';
                         lineImg.draggable = false;
                         lineImg.style.zIndex = '11';
                         cOverlay.appendChild(lineImg);

                         // Add a slim separator line directly above the bottom box for visual separation
                         const bottomSeparator = document.createElement('div');
                         bottomSeparator.style.position = 'absolute';
                         bottomSeparator.style.left = '0';
                         bottomSeparator.style.right = '0';
                         // place it exactly at the top edge of the bottom box (bottomBox height is 30%)
                         bottomSeparator.style.bottom = '30%';
                         bottomSeparator.style.height = '6px';
                         // three-stop vertical gradient: top #3E546E, middle original #272F42, bottom #0F182B
                         bottomSeparator.style.background = 'linear-gradient(to bottom, #3E546E 0%, #272F42 50%, #0F182B 100%)';
                         bottomSeparator.style.zIndex = '12';
                         bottomSeparator.style.pointerEvents = 'none';
                         cOverlay.appendChild(bottomSeparator);

                         // Create a container for the editor's tool buttons (Block, Spike, Trigger)
                         const editorBtnContainer = document.createElement('div');
                         editorBtnContainer.style.position = 'absolute';
                         editorBtnContainer.style.left = '50%';
                         editorBtnContainer.style.transform = 'translateX(-50%)';
                         editorBtnContainer.style.bottom = '24%';
                         editorBtnContainer.style.display = 'flex';
                         editorBtnContainer.style.gap = '10px';
                         // put buttons behind the bottom box by using a lower z-index
                         editorBtnContainer.style.zIndex = '11';
                         cOverlay.appendChild(editorBtnContainer);

                         const editorTools = [
                             // Use GeometryDashingBlock in the editor and render it a bit larger
                             { icon: '/GeometryDashingBlock.png', scale: '35.5%' },
                             // Make the spike icon slightly bigger for clarity
                             { icon: '/Spike.png', scale: '36%' },
                             // Slightly smaller ColourTrigger icon
                             { icon: '/ColourTrigger.webp', scale: '27%' }
                         ];

                         let activeToolIndex = 0; // default to first tool selected
                         const toolButtons = [];

                         function updateToolSelection() {
                             toolButtons.forEach((btn, idx) => {
                                 btn.style.opacity = (idx === activeToolIndex) ? '1' : '0.5';
                             });
                         }

                         editorTools.forEach((tool, idx) => {
                             const btn = document.createElement('div');
                             btn.className = 'gd-button';
                             btn.draggable = false;
                             btn.style.width = '110px';
                             btn.style.height = '110px';
                             btn.style.pointerEvents = 'auto';
                             btn.style.backgroundImage = "url('/GJ_button_05-uhd.png')";
                             btn.style.backgroundSize = 'contain';
                             btn.style.backgroundRepeat = 'no-repeat';
                             btn.style.backgroundPosition = 'center';
                             btn.style.display = 'flex';
                             btn.style.alignItems = 'center';
                             btn.style.justifyContent = 'center';
                             btn.style.boxSizing = 'border-box';
                             
                             const innerImg = document.createElement('img');
                             innerImg.src = tool.icon;
                             innerImg.draggable = false;
                             innerImg.style.width = tool.scale;
                             innerImg.style.height = 'auto';
                             innerImg.style.pointerEvents = 'none';
                             innerImg.style.imageRendering = 'auto';
                             // nudge the icon up slightly so the visual center sits higher
                             innerImg.style.transform = 'translateY(-26px)';
                             btn.appendChild(innerImg);

                             // spring animator for feedback
                             const anim = createSpringAnimator(btn, {
                                 grow: 1.12,
                                 stiffness: 1400,
                                 damping: 16,
                                 mass: 0.8
                             });

                             btn.addEventListener('pointerdown', (e) => {
                                 if (e.pointerType === 'mouse' && e.button !== 0) return;
                                 e.stopPropagation();
                                 anim.press();
                                 btn.setPointerCapture && btn.setPointerCapture(e.pointerId);
                             }, { passive: false });

                             btn.addEventListener('pointerup', (e) => {
                                 e.stopPropagation();
                                 anim.release();
                                 btn.releasePointerCapture && btn.releasePointerCapture(e.pointerId);
                                 // select tool
                                 activeToolIndex = idx;
                                 updateToolSelection();
                             }, { passive: false });

                             btn.addEventListener('pointercancel', (e) => {
                                 anim.stopImmediate();
                                 btn.releasePointerCapture && btn.releasePointerCapture(e.pointerId);
                             }, { passive: false });

                             toolButtons.push(btn);
                             editorBtnContainer.appendChild(btn);
                         });

                         updateToolSelection();

                         // Bottom full-width solid color box (replaces previous gradient)
                         const bottomBox = document.createElement('div');
                         bottomBox.style.position = 'absolute';
                         bottomBox.style.left = '0';
                         bottomBox.style.right = '0';
                         bottomBox.style.bottom = '0';
                         bottomBox.style.width = '100%';
                         // Increased height so the bottom area is taller
                         bottomBox.style.height = '30%';
                         bottomBox.style.pointerEvents = 'auto'; // changed to auto to allow clicking items inside
                         bottomBox.style.zIndex = '12';
                         // Solid color (no gradient)
                         bottomBox.style.background = '#0E1526';
                         cOverlay.appendChild(bottomBox);

                         // Create a "swipe" button on the right side of the bottom box (toggles textures and enables swipe placement)
                         const swipeBtn = document.createElement('div');
                         swipeBtn.className = 'gd-button';
                         swipeBtn.draggable = false;
                         swipeBtn.style.position = 'absolute';
                         swipeBtn.style.right = '24px';
                         swipeBtn.style.bottom = '12%';
                         swipeBtn.style.width = '120px';
                         swipeBtn.style.height = '80px';
                         swipeBtn.style.display = 'flex';
                         swipeBtn.style.alignItems = 'center';
                         swipeBtn.style.justifyContent = 'center';
                         swipeBtn.style.boxSizing = 'border-box';
                         swipeBtn.style.cursor = 'pointer';
                         swipeBtn.style.pointerEvents = 'auto';
                         swipeBtn.style.zIndex = '30020';
                         swipeBtn.style.backgroundImage = "url('/GJ_button_01-uhd.png')";
                         swipeBtn.style.backgroundSize = 'contain';
                         swipeBtn.style.backgroundRepeat = 'no-repeat';
                         swipeBtn.style.backgroundPosition = 'center';
                         swipeBtn.setAttribute('role', 'button');
                         swipeBtn.setAttribute('aria-pressed', 'false');
                         // label
                         const swipeLabel = document.createElement('div');
                         swipeLabel.className = 'swipe-label';
                         swipeLabel.textContent = 'swipe';
                         swipeLabel.style.pointerEvents = 'none';
                         swipeLabel.style.textTransform = 'lowercase';
                         swipeLabel.style.fontFamily = 'Pusab, sans-serif';
                         swipeLabel.style.fontSize = '21px';
                         swipeLabel.style.transform = 'translateY(-4px)';
                         swipeLabel.style.color = '#fff';
                         swipeLabel.style.webkitTextStroke = '1px rgba(0,0,0,0.8)';
                         swipeBtn.appendChild(swipeLabel);
                         bottomBox.appendChild(swipeBtn);

                         // swipe mode state exposed inside this C-page scope so placement code can use it
                         let swipeMode = false;
                         const swipeAnim = createSpringAnimator(swipeBtn, { grow: 1.12, stiffness: 1400, damping: 16 });

                         swipeBtn.addEventListener('pointerdown', (e) => {
                             if (e.pointerType === 'mouse' && e.button !== 0) return;
                             e.stopPropagation();
                             swipeAnim.press();
                             swipeBtn.setPointerCapture && swipeBtn.setPointerCapture(e.pointerId);
                         }, { passive: false });

                         swipeBtn.addEventListener('pointerup', (e) => {
                             e.stopPropagation();
                             swipeAnim.release();
                             swipeBtn.releasePointerCapture && swipeBtn.releasePointerCapture(e.pointerId);

                             // Toggle swipe mode and swap the button texture instantly
                             swipeMode = !swipeMode;
                             swipeBtn.setAttribute('aria-pressed', swipeMode ? 'true' : 'false');

                             const prevTransition = swipeBtn.style.transition;
                             swipeBtn.style.transition = 'none';
                             swipeBtn.style.backgroundImage = swipeMode ? "url('/GJ_button_02-uhd.png')" : "url('/GJ_button_01-uhd.png')";
                             swipeLabel.style.opacity = swipeMode ? '0.95' : '1';
                             swipeBtn.dataset.active = swipeMode ? '1' : '0';
                             void swipeBtn.offsetWidth;
                             setTimeout(() => { swipeBtn.style.transition = prevTransition || ''; }, 0);
                         }, { passive: false });

                         swipeBtn.addEventListener('pointercancel', (e) => {
                             swipeAnim.stopImmediate();
                             swipeBtn.releasePointerCapture && swipeBtn.releasePointerCapture(e.pointerId);
                         }, { passive: false });

                         // Add 2 Line.png's inside the black box as vertical dividers
                         const lineEdgeGap = 195;
                         for (let i = 0; i < 2; i++) {
                             const lb = document.createElement('img');
                             lb.src = '/Line.png';
                             lb.style.position = 'absolute';
                             lb.style.top = '50%';
                             lb.style.width = '240px'; 
                             lb.style.height = '3.5px';
                             lb.style.opacity = '1'; 
                             lb.style.pointerEvents = 'none';
                             if (i === 0) {
                                 lb.style.left = `${lineEdgeGap}px`;
                                 lb.style.transform = 'translate(-30%, -50%) rotate(90deg)';
                             } else {
                                 lb.style.right = `${lineEdgeGap}px`;
                                 lb.style.transform = 'translate(50%, -50%) rotate(90deg)';
                             }
                             bottomBox.appendChild(lb);
                         }

                         // Add left-aligned editor action buttons (Build / Edit / Delete)
                         // Use stable wrapper elements for each editor button so the spring animator
                         // always operates on a fixed DOM node (prevents hitbox shift when swapping images).
                         const leftButtonsContainer = document.createElement('div');
                         leftButtonsContainer.style.position = 'absolute';
                         leftButtonsContainer.style.left = '20px';
                         leftButtonsContainer.style.top = '43%';
                         leftButtonsContainer.style.transform = 'translateY(-50%)';
                         leftButtonsContainer.style.display = 'flex';
                         leftButtonsContainer.style.flexDirection = 'column';
                         leftButtonsContainer.style.gap = '-25px';
                         leftButtonsContainer.style.zIndex = '20';
                         leftButtonsContainer.style.pointerEvents = 'auto';
                         bottomBox.appendChild(leftButtonsContainer);

                         const editorBtnAssets = [
                             { name: 'Build', u: '/buildbuttonunselected.png', s: '/buildbuttonselected.png', rotate: -90 },
                             { name: 'Edit', u: '/editbuttonunselected.png', s: '/editbuttonselected.png', rotate: -90 },
                             // keep Delete unrotated by default, rotate its inner image only when selected
                             { name: 'Delete', u: '/deletebuttonunselected.png', s: '/deletebuttonselected.png', rotate: 0 }
                         ];

                         let selectedEditorIndex = 0; // Build selected by default

                         editorBtnAssets.forEach((asset, idx) => {
                             // Wrapper that the spring animator will attach to (stable hitbox)
                             const wrapper = document.createElement('div');
                             wrapper.className = 'gd-button editor-btn-wrap';
                             wrapper.style.width = '200px';
                             wrapper.style.height = '200px';
                             wrapper.style.display = 'flex';
                             wrapper.style.alignItems = 'center';
                             wrapper.style.justifyContent = 'center';
                             wrapper.style.boxSizing = 'border-box';
                             wrapper.style.cursor = 'pointer';
                             wrapper.style.pointerEvents = 'auto';
                             // preserve per-button vertical offsets on the wrapper (so layout never reflows on selection)
                             if (idx === 0) wrapper.style.marginTop = '20px';
                             if (idx === 1) wrapper.style.marginTop = '-120px';
                             if (idx === 2) wrapper.style.marginTop = '-120px';

                             // Trim invisible padding inside the 200px wrapper so the active hit area matches the visual button.
                             // Adjust inset values if your button artwork height changes.
                             wrapper.style.clipPath = 'inset(60px 0px 60px 0px)';

                             // Inner image --- only this element's src/rotation will change on selection.
                             const img = document.createElement('img');
                             img.draggable = false;
                             img.style.width = '100%';
                             img.style.height = '100%';
                             img.style.objectFit = 'contain';
                             img.style.pointerEvents = 'none'; // clicks go to wrapper
                             // Set correct source immediately based on initial selection so visuals + hitbox match on first paint
                             img.src = (idx === selectedEditorIndex) ? asset.s : asset.u;
                             // apply base rotation to the inner image when appropriate (keeps wrapper transform stable)
                             img.style.transform = asset.rotate ? `rotate(${asset.rotate}deg)` : '';

                             wrapper.appendChild(img);

                             // Attach animator to the wrapper (stable element)
                             const anim = createSpringAnimator(wrapper, {
                                 grow: 1.15,
                                 stiffness: 1400,
                                 damping: 16,
                                 mass: 0.8,
                             });

                             wrapper.addEventListener('pointerdown', (e) => {
                                 if (e.pointerType === 'mouse' && e.button !== 0) return;
                                 e.stopPropagation();
                                 anim.press();
                                 wrapper.setPointerCapture && wrapper.setPointerCapture(e.pointerId);
                             }, { passive: false });

                             wrapper.addEventListener('pointerup', (e) => {
                                 e.stopPropagation();
                                 anim.release();
                                 try { wrapper.releasePointerCapture && wrapper.releasePointerCapture(e.pointerId); } catch (err) {}

                                 // Update selected index and swap visuals of inner images only.
                                 selectedEditorIndex = idx;

                                 Array.from(leftButtonsContainer.children).forEach((childWrap, i) => {
                                     const data = editorBtnAssets[i];
                                     const childImg = childWrap.querySelector('img');
                                     const usingSelected = (i === selectedEditorIndex);

                                     // If we are switching this child to the selected state, preload the selected image
                                     // and only swap it in (and apply the special rotation) after it has loaded.
                                     if (usingSelected) {
                                         // For Delete, avoid rotating the currently-displayed unselected image:
                                         // set the visual transform only after the new selected asset is ready.
                                         const pre = new Image();
                                         pre.onload = () => {
                                             childImg.src = data.s;
                                             // Apply rotation first (if applicable), then apply a subtle 1% scale for selected state
                                             const rot = (data.name === 'Delete') ? -90 : (data.rotate ? data.rotate : 0);
                                             childImg.style.transform = `rotate(${rot}deg) scale(1.01)`;
                                         };
                                         // In case loading fails or is very slow, keep showing the unselected asset as-is
                                         // but still apply the selected scale to the newly-swapped image (avoid shrinking behavior).
                                         pre.onerror = () => {
                                             try { childImg.src = data.s; } catch (e) {}
                                             const rot = (data.name === 'Delete') ? -90 : (data.rotate ? data.rotate : 0);
                                             childImg.style.transform = `rotate(${rot}deg) scale(1.01)`;
                                         };
                                         pre.src = data.s;
                                     } else {
                                         // Immediate unselected state swap: show unselected texture and set its base rotation (if any)
                                         childImg.src = data.u;
                                         // Ensure unselected state uses normal scale (no shrinking)
                                         childImg.style.transform = (data.rotate ? `rotate(${data.rotate}deg)` : '') + ' scale(1)';
                                     }

                                     // Re-apply vertical offsets to the wrapper (ensures no layout shift)

                                 });
                             }, { passive: false });

                             wrapper.addEventListener('pointercancel', (e) => {
                                 anim.stopImmediate();
                                 try { wrapper.releasePointerCapture && wrapper.releasePointerCapture(e.pointerId); } catch (err) {}
                             }, { passive: false });

                             leftButtonsContainer.appendChild(wrapper);

                             // If delete is selected initially, rotate its inner image (do not touch wrapper transform)
                             if (asset.name === 'Delete' && idx === selectedEditorIndex) {
                                 img.style.transform = 'rotate(-90deg)';
                             }
                         });

                         // State for block selection in editor
                         let selectedBlockTexture = null;

                         // Add container for the selectable block buttons in the center
                         const blockSelectors = document.createElement('div');
                         blockSelectors.style.position = 'absolute';
                         blockSelectors.style.left = '50%';
                         blockSelectors.style.top = '50%';
                         blockSelectors.style.transform = 'translate(-50%, -50%)';
                         blockSelectors.style.display = 'flex';
                         blockSelectors.style.gap = '15px';
                         blockSelectors.style.zIndex = '30';
                         bottomBox.appendChild(blockSelectors);

                         const blockConfigs = [
                             { id: 'dashBlock', texture: '/GeometryDashingBlock.png', iconScale: '75%' },
                             { id: 'gridBlock', texture: '/GridBlock01.webp', iconScale: '70%' },
                             { id: 'gridBlock2', texture: '/GridBlock02.png', iconScale: '70%' }
                         ];

                         const blockButtons = [];

                         blockConfigs.forEach(cfg => {
                             const btn = document.createElement('div');
                             btn.className = 'gd-button';
                             btn.style.width = '110px';
                             btn.style.height = '110px';
                             btn.style.backgroundImage = "url('/GJ_button_04-uhd.png')";
                             btn.style.backgroundSize = 'contain';
                             btn.style.backgroundRepeat = 'no-repeat';
                             btn.style.backgroundPosition = 'center';
                             btn.style.display = 'flex';
                             btn.style.alignItems = 'center';
                             btn.style.justifyContent = 'center';
                             btn.dataset.texture = cfg.texture;

                             const icon = document.createElement('img');
                             icon.src = cfg.texture;
                             icon.style.width = cfg.iconScale;
                             icon.style.height = 'auto';
                             icon.style.transform = 'translateY(-6px)';
                             icon.style.pointerEvents = 'none';
                             btn.appendChild(icon);

                             const anim = createSpringAnimator(btn, { grow: 1.12, stiffness: 1400 });

                             btn.addEventListener('pointerdown', (e) => {
                                 if (e.pointerType === 'mouse' && e.button !== 0) return;
                                 e.stopPropagation();
                                 anim.press();
                                 btn.setPointerCapture(e.pointerId);
                             });

                             btn.addEventListener('pointerup', (e) => {
                                 e.stopPropagation();
                                 anim.release();
                                 btn.releasePointerCapture && btn.releasePointerCapture(e.pointerId);

                                 if (selectedBlockTexture === cfg.texture) {
                                     selectedBlockTexture = null;
                                 } else {
                                     selectedBlockTexture = cfg.texture;
                                 }
                                 updateBlockButtonVisuals();
                             });

                             blockButtons.push(btn);
                             blockSelectors.appendChild(btn);
                         });

                         function updateBlockButtonVisuals() {
                             blockButtons.forEach(btn => {
                                 const isSelected = btn.dataset.texture === selectedBlockTexture;
                                 btn.style.filter = isSelected ? 'brightness(0.5)' : 'none';
                             });
                         }

                         // Enable pointer-drag scrolling with parallax for background and ground
                         (function enableCPageDrag() {
                             let isDragging = false;
                             let dragMoved = false;
                             let lastX = 0;
                             let lastY = 0;
                             let scrollX = 0;
                             let scrollY = 0;
                             let zoomScale = 1.0;

                             // Placement Layer for blocks
                             const blocksLayer = document.createElement('div');
                             blocksLayer.style.position = 'absolute';
                             blocksLayer.style.inset = '0';
                             blocksLayer.style.pointerEvents = 'none';
                             blocksLayer.style.zIndex = '9'; // Behind ground/line (z:10/11) but above grid (z:1)
                             blocksLayer.style.transformOrigin = '0 0';
                             cOverlay.appendChild(blocksLayer);

                             let lastPlacedBlock = null;

                             function placeBlock(worldX, worldY) {
                                 const snappedX = Math.floor(worldX / 60) * 60;
                                 const snappedY = Math.floor(worldY / 60) * 60;

                                 const container = document.createElement('div');
                                 container.className = 'block-container';
                                 container.style.transform = `translate(${snappedX}px, ${snappedY}px)`;

                                 const block = document.createElement('img');
                                 block.src = selectedBlockTexture || '/GeometryDashingBlock.png';
                                 block.style.width = '100%';
                                 block.style.height = '100%';
                                 block.style.filter = 'none'; 
                                 block.style.borderRadius = '1px';
                                 block.style.imageRendering = 'smooth';
                                 
                                 if (block.src.includes('GridBlock02.png')) {
                                     block.style.outline = 'none';
                                     const tint = document.createElement('div');
                                     tint.className = 'green-tint';
                                     container.appendChild(tint);
                                 } else {
                                     block.style.outline = '4px solid #43E179';
                                     block.style.outlineOffset = '-4px';
                                     block.style.boxShadow = 'none';
                                 }
                                 
                                 // Remove highlight from previous
                                 if (lastPlacedBlock) {
                                     lastPlacedBlock.style.outline = 'none';
                                     lastPlacedBlock.style.boxShadow = 'none';
                                     const oldTint = lastPlacedBlock.parentNode.querySelector('.green-tint');
                                     if (oldTint) oldTint.style.opacity = '0';
                                 }
                                 
                                 container.appendChild(block);
                                 blocksLayer.appendChild(container);
                                 lastPlacedBlock = block;
                             }
                             const bgParallax = (typeof BG_SPEED_FACTOR !== 'undefined') ? BG_SPEED_FACTOR : 0.08;
                             const MAX_SCROLL = 5000; // sensible limits
                             const zoomSteps = (function() {
                                 const outS = 10, inS = 30;
                                 const steps = [];
                                 // Out steps: biggest jumps at the end (far out)
                                 for (let i = outS; i >= 1; i--) steps.push(1.0 - 0.9 * Math.pow(i / outS, 1.8));
                                 steps.push(1.0); // Starting zoom
                                 // In steps: smallest jumps at the end (far in)
                                 for (let i = 1; i <= inS; i++) steps.push(1.0 + 3.0 * Math.pow(i / inS, 0.5));
                                 return steps.sort((a,b) => a-b);
                             })();

                             function isPaused() {
                                 return !!cOverlay.querySelector('.placeholder-popup-overlay');
                             }

                             function setPositions() {
                                 // Background scales less aggressively than the world to prevent black gaps
                                 // Scale reduced by 40% to decrease the size of the texture pattern
                                 const effectiveBgScale = (Math.max(0.65, 0.45 + (zoomScale * 0.55))) * 0.6;

                                 // Horizontal/Vertical parallax
                                 const bgOffsetX = -scrollX * bgParallax;
                                 const bgOffsetY = scrollY * bgParallax;
                                 
                                 // apply transform to bg
                                 bgImg.style.transform = `translate(-50%, -50%) translate(${bgOffsetX}px, ${bgOffsetY}px) scale(${effectiveBgScale}) translateZ(0)`;
                                 
                                 // Ground tiling adjustments
                                 groundDiv.style.backgroundSize = `auto 100%`;
                                 groundDiv.style.backgroundPosition = `${-scrollX}px center`;
                                 
                                 const worldY = scrollY;
                                 // Update ground height based on zoom and maintain vertical anchoring
                                 const groundHeightPercent = 35 * zoomScale;
                                 groundDiv.style.height = `${groundHeightPercent}%`;
                                 groundDiv.style.transform = `translateY(${worldY}px)`;
                                 
                                 // The line stays locked to the top edge of the ground
                                 const groundLineTopPercent = (100 - groundHeightPercent);
                                 lineImg.style.top = `${groundLineTopPercent}%`;
                                 lineImg.style.transform = `translate(-50%, -50%) translateY(${worldY}px) scale(${zoomScale})`;

                                 // Remade grid: tiling world-space lines that react to pan and zoom
                                 // To prevent the grid from shifting vertically during zoom, we anchor its tile origin 
                                 // to the ground line (the top edge of the ground texture).
                                 const cellSize = 60 * zoomScale;
                                 const groundLineYInPixels = (groundLineTopPercent / 100) * window.innerHeight;
                                 gridLayer.style.backgroundSize = `${cellSize}px ${cellSize}px`;
                                 // backgroundPosition Y = world offset + screen position of the anchor
                                 gridLayer.style.backgroundPosition = `${-scrollX}px ${scrollY + groundLineYInPixels}px`;

                                 // Update blocks layer to match camera
                                 blocksLayer.style.transform = `translate(${-scrollX}px, ${scrollY + groundLineYInPixels}px) scale(${zoomScale})`;
                             }

                             cOverlay.addEventListener('pointerdown', (e) => {
                                 if (e.pointerType === 'mouse' && e.button !== 0) return;
                                 if (isPaused()) return;
                                 isDragging = true;
                                 dragMoved = false;
                                 lastX = e.clientX;
                                 lastY = e.clientY;
                                 cOverlay.setPointerCapture && cOverlay.setPointerCapture(e.pointerId);
                             }, { passive: true });

                             // Simple swipe placement: place blocks while dragging when swipeMode is active.
                             // Throttle placement by snapping to the 60px grid and requiring a minimum world-distance
                             // between consecutive placed cells to avoid overplacing.
                             let _lastSwipePlace = null;
                             const _swipeMinDist = 36; // world-space px threshold

                             cOverlay.addEventListener('pointermove', (e) => {
                                 if (!isDragging || isPaused()) return;
                                 const dx = e.clientX - lastX;
                                 const dy = e.clientY - lastY;
                                 if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMoved = true;
                                 lastX = e.clientX;
                                 lastY = e.clientY;

                                 // When swipe mode is active, block camera panning; otherwise pan as usual.
                                 if (!swipeMode) {
                                     // Camera movement: dragging right moves camera left (decrease scrollX)
                                     scrollX = Math.max(-MAX_SCROLL, Math.min(MAX_SCROLL, scrollX - dx));
                                     scrollY = Math.max(-MAX_SCROLL, Math.min(MAX_SCROLL, scrollY + dy));
                                 }
                                 // Always update visual transforms so blocks/grid/ground stay in sync.
                                 setPositions();

                                 // If swipe mode is enabled and the block tool is active, place blocks along the swipe.
                                 try {
                                     // Only spawn during swipe if swipe mode is active, the block tool is selected,
                                     // and the center block-selection button is toggled on.
                                     if (swipeMode && activeToolIndex === 0 && selectedBlockTexture) {
                                         const rect = cOverlay.getBoundingClientRect();
                                         const screenX = e.clientX - rect.left;
                                         const screenY = e.clientY - rect.top;
                                         const groundLineTopPercent = (100 - (35 * zoomScale));
                                         const groundLineYInPixels = (groundLineTopPercent / 100) * window.innerHeight;

                                         // Convert screen -> world coordinates
                                         const worldX = (screenX + scrollX) / zoomScale;
                                         const worldY = (screenY - scrollY - groundLineYInPixels) / zoomScale;

                                         const snappedX = Math.floor(worldX / 60) * 60;
                                         const snappedY = Math.floor(worldY / 60) * 60;

                                         if (!_lastSwipePlace || Math.hypot(snappedX - _lastSwipePlace.x, snappedY - _lastSwipePlace.y) >= _swipeMinDist) {
                                             // placeBlock is defined in this scope; call it to create the visual and update stacks
                                             if (typeof placeBlock === 'function') {
                                                 placeBlock(worldX, worldY);
                                             } else {
                                                 // Fallback: create the block inline if placeBlock isn't available (defensive)
                                                 const snappedXfb = snappedX;
                                                 const snappedYfb = snappedY;
                                                 const block = document.createElement('img');
                                                 block.src = selectedBlockTexture || '/GeometryDashingBlock.png';
                                                 block.style.position = 'absolute';
                                                 block.style.width = '60px';
                                                 block.style.height = '60px';
                                                 block.style.left = '0';
                                                 block.style.top = '0';
                                                 block.style.filter = 'none';
                                                 block.style.outline = '4px solid #43E179';
                                                 block.style.outlineOffset = '-4px';
                                                 block.style.borderRadius = '1px';
                                                 block.style.imageRendering = 'smooth';
                                                 block.style.transform = `translate(${snappedXfb}px, ${snappedYfb}px)`;
                                                 block.draggable = false;
                                                 if (typeof blocksLayer !== 'undefined') blocksLayer.appendChild(block);
                                                 // maintain lastPlacedBlock reference if present in this scope
                                                 if (typeof lastPlacedBlock !== 'undefined') {
                                                     if (lastPlacedBlock) lastPlacedBlock.style.outline = 'none';
                                                     lastPlacedBlock = block;
                                                 }
                                             }
                                             _lastSwipePlace = { x: snappedX, y: snappedY };
                                         }
                                     }
                                 } catch (err) {
                                     // swallow errors so pointermove loop remains responsive
                                     console.error(err);
                                 }
                             }, { passive: true });

                             function endDrag(e) {
                                 if (!isDragging) return;
                                 
                                 // Check for placement click if dragging didn't happen and block tool is active
                                 if (!dragMoved && selectedBlockTexture) {
                                     const rect = cOverlay.getBoundingClientRect();
                                     const screenX = e.clientX - rect.left;
                                     const screenY = e.clientY - rect.top;

                                     const groundLineTopPercent = (100 - (35 * zoomScale));
                                     const groundLineYInPixels = (groundLineTopPercent / 100) * window.innerHeight;

                                     // Convert screen coordinates to world space
                                     const worldX = (screenX + scrollX) / zoomScale;
                                     const worldY = (screenY - scrollY - groundLineYInPixels) / zoomScale;

                                     placeBlock(worldX, worldY);
                                 }

                                 isDragging = false;
                                 try { cOverlay.releasePointerCapture && cOverlay.releasePointerCapture(e.pointerId); } catch (err) {}
                             }

                             cOverlay.addEventListener('pointerup', endDrag, { passive: true });
                             cOverlay.addEventListener('pointercancel', endDrag, { passive: true });

                             cOverlay.addEventListener('wheel', (e) => {
                                 if (isPaused()) return;
                                 if (e.ctrlKey) {
                                     // Ctrl + Wheel: Discrete zooming steps
                                     const direction = e.deltaY > 0 ? -1 : 1;
                                     let currentIndex = zoomSteps.indexOf(zoomScale);
                                     if (currentIndex === -1) {
                                         // Find closest valid step
                                         currentIndex = zoomSteps.reduce((prev, curr, idx) => 
                                             Math.abs(curr - zoomScale) < Math.abs(zoomSteps[prev] - zoomScale) ? idx : prev, 0);
                                     }
                                     const nextIndex = Math.max(0, Math.min(zoomSteps.length - 1, currentIndex + direction));
                                     zoomScale = zoomSteps[nextIndex];
                                     setPositions();
                                 } else {
                                     // Normal scrolling behavior
                                     scrollX = Math.max(-MAX_SCROLL, Math.min(MAX_SCROLL, scrollX + e.deltaX));
                                     scrollY = Math.max(-MAX_SCROLL, Math.min(MAX_SCROLL, scrollY + e.deltaY));
                                     setPositions();
                                 }
                                 e.preventDefault();
                             }, { passive: false });

                             // Create Zoom In / Zoom Out buttons on the left side (snap to zoomSteps)
                             (function createZoomButtons() {
                                 // NOTE: Asset @Playlevel.png used as a decorative UI element in the editor
                                 const btnStyle = {
                                     position: 'absolute',
                                     left: '14px',
                                     width: '64px',
                                     height: 'auto',
                                     cursor: 'pointer',
                                     zIndex: '30011',
                                     userSelect: 'none',
                                     WebkitUserDrag: 'none'
                                 };

                                 // Add the Playsong button above Playlevel (same size as Playlevel)
                                 const playSong = document.createElement('img');
                                 // ASSET: @Playsong.png
                                 playSong.src = '/Playsong.png';
                                 playSong.draggable = false;
                                 Object.assign(playSong.style, btnStyle);
                                 // match Playlevel sizing exactly
                                 playSong.style.width = '100px';
                                 playSong.style.height = '100px';
                                 playSong.style.left = '17px';
                               playSong.style.top = 'calc(15% - 16px)';
                                 // position it above Playlevel: slightly higher top
                                 cOverlay.appendChild(playSong);

                                 const playLevel = document.createElement('img');
                                 // ASSET: @Playlevel.png
                                 playLevel.src = '/Playlevel.png';
                                 playLevel.draggable = false;
                                 Object.assign(playLevel.style, btnStyle);
                                 playLevel.style.width = '100px'; // Larger than zoomin (64px)
                                 playLevel.style.height = '100px';
                                 playLevel.style.left = '17px';  // Nudge left slightly to balance large size
                                 playLevel.style.top = 'calc(29% - 16px)';   // Positioned above zoom-in
                                 cOverlay.appendChild(playLevel);

                                 const zoomIn = document.createElement('img');
                                 // ASSET: @zoomin.png
                                 zoomIn.src = '/zoomin.png';
                                 zoomIn.draggable = false;
                                 Object.assign(zoomIn.style, btnStyle);
                               zoomIn.style.width = '70px';
                               zoomIn.style.height = '70px';
                                 zoomIn.style.top = 'calc(43% - 16px)';
                               zoomIn.style.left = '30.5px'
                                 cOverlay.appendChild(zoomIn);

                                 const zoomOut = document.createElement('img');
                                 // ASSET: @zoomout.png
                                 zoomOut.src = '/zoomout.png';
                                 zoomOut.draggable = false;
                                 Object.assign(zoomOut.style, btnStyle);
                               zoomOut.style.width = '70px';
                               zoomOut.style.height = '70px';
                               zoomOut.style.left = '30.5px'
                                 zoomOut.style.top = 'calc(52% - 16px)';
                                 cOverlay.appendChild(zoomOut);

                                 function stepZoom(delta) {
                                     let currentIndex = zoomSteps.indexOf(zoomScale);
                                     if (currentIndex === -1) {
                                         // pick nearest
                                         currentIndex = zoomSteps.reduce((prev, curr, idx) => 
                                             Math.abs(curr - zoomScale) < Math.abs(zoomSteps[prev] - zoomScale) ? idx : prev, 0);
                                     }
                                     const nextIndex = Math.max(0, Math.min(zoomSteps.length - 1, currentIndex + delta));
                                     if (nextIndex === currentIndex) return;
                                     zoomScale = zoomSteps[nextIndex];
                                     setPositions();
                                 }

                                 // spring-like visual feedback using existing animator
                                 const playSongAnim = createSpringAnimator(playSong, { grow: 1.12, stiffness: 1400, damping: 16 });
                                 const playAnim = createSpringAnimator(playLevel, { grow: 1.12, stiffness: 1400, damping: 16 });
                                 const inAnim = createSpringAnimator(zoomIn, { grow: 1.12, stiffness: 1400, damping: 16 });
                                 const outAnim = createSpringAnimator(zoomOut, { grow: 1.12, stiffness: 1400, damping: 16 });

                                 playSong.addEventListener('pointerdown', (e) => {
                                     if (e.pointerType === 'mouse' && e.button !== 0) return;
                                     e.stopPropagation();
                                     playSongAnim.press();
                                     playSong.setPointerCapture && playSong.setPointerCapture(e.pointerId);
                                 }, { passive: false });
                                 playSong.addEventListener('pointerup', (e) => {
                                     playSongAnim.release();
                                     playSong.releasePointerCapture && playSong.releasePointerCapture(e.pointerId);
                                 }, { passive: false });
                                 playSong.addEventListener('pointercancel', (e) => {
                                     playSongAnim.release();
                                     playSong.releasePointerCapture && playSong.releasePointerCapture(e.pointerId);
                                 }, { passive: false });

                                 playLevel.addEventListener('pointerdown', (e) => {
                                     if (e.pointerType === 'mouse' && e.button !== 0) return;
                                     e.stopPropagation();
                                     playAnim.press();
                                     playLevel.setPointerCapture && playLevel.setPointerCapture(e.pointerId);
                                 }, { passive: false });
                                 playLevel.addEventListener('pointerup', (e) => {
                                     playAnim.release();
                                     playLevel.releasePointerCapture && playLevel.releasePointerCapture(e.pointerId);
                                     // No action as requested
                                 }, { passive: false });
                                 playLevel.addEventListener('pointercancel', (e) => {
                                     playAnim.release();
                                     playLevel.releasePointerCapture && playLevel.releasePointerCapture(e.pointerId);
                                 }, { passive: false });

                                 zoomIn.addEventListener('pointerdown', (e) => {
                                     if (e.pointerType === 'mouse' && e.button !== 0) return;
                                     e.stopPropagation();
                                     inAnim.press();
                                     zoomIn.setPointerCapture && zoomIn.setPointerCapture(e.pointerId);
                                 }, { passive: false });
                                 zoomIn.addEventListener('pointerup', (e) => {
                                     inAnim.release();
                                     zoomIn.releasePointerCapture && zoomIn.releasePointerCapture(e.pointerId);
                                     stepZoom(1);
                                 }, { passive: false });
                                 zoomIn.addEventListener('pointercancel', (e) => {
                                     inAnim.release();
                                     zoomIn.releasePointerCapture && zoomIn.releasePointerCapture(e.pointerId);
                                 }, { passive: false });

                                 zoomOut.addEventListener('pointerdown', (e) => {
                                     if (e.pointerType === 'mouse' && e.button !== 0) return;
                                     e.stopPropagation();
                                     outAnim.press();
                                     zoomOut.setPointerCapture && zoomOut.setPointerCapture(e.pointerId);
                                 }, { passive: false });
                                 zoomOut.addEventListener('pointerup', (e) => {
                                     outAnim.release();
                                     zoomOut.releasePointerCapture && zoomOut.releasePointerCapture(e.pointerId);
                                     stepZoom(-1);
                                 }, { passive: false });
                                 zoomOut.addEventListener('pointercancel', (e) => {
                                     outAnim.release();
                                     zoomOut.releasePointerCapture && zoomOut.releasePointerCapture(e.pointerId);
                                 }, { passive: false });

                                 const redoBtn = document.createElement('img');
                                 redoBtn.src = '/Undoredo.png';
                                 redoBtn.draggable = false;
                                 Object.assign(redoBtn.style, btnStyle);
                                 redoBtn.style.width = '95px';
                                 redoBtn.style.height = '95px';
                                 redoBtn.style.top = '6px';
                                 redoBtn.style.left = '17px';
                                 // Rotated horizontally (flipped) --> acts as UNDO
                                 redoBtn.style.transform = 'scaleX(-1)';
                                 // default semi-transparent until undo is available
                                 redoBtn.style.opacity = '0.5';

                                 const redoAnim = createSpringAnimator(redoBtn, {
                                     grow: 1.15,
                                     stiffness: 1400,
                                     baseTransform: 'scaleX(-1)'
                                 });

                                 // --- Non-flipped Undoredo button --> acts as REDO ---
                                 const redoBtn2 = document.createElement('img');
                                 redoBtn2.src = '/Undoredo.png';
                                 redoBtn2.draggable = false;
                                 Object.assign(redoBtn2.style, btnStyle);
                                 redoBtn2.style.width = '95px';
                                 redoBtn2.style.height = '95px';
                                 redoBtn2.style.top = '6px';
                                 // place 30px to the right of the original (original left: 17px)
                                 redoBtn2.style.left = 'calc(17px + 30px + 100px - 5px)';
                                 // default semi-transparent until redo is available
                                 redoBtn2.style.opacity = '0.5';

                                 const redoAnim2 = createSpringAnimator(redoBtn2, {
                                     grow: 1.15,
                                     stiffness: 1400
                                 });

                                 // Undo/Redo stacks (works with placeBlock -> push to undoStack)
                                 const undoStack = [];
                                 const redoStack = [];

                                 // Helper to refresh button opacity based on availability
                                 function refreshUndoRedoUI() {
                                     // If undo available, make flipped button opaque; else semi-transparent
                                     redoBtn.style.opacity = undoStack.length ? '1' : '0.5';
                                     // If redo available, make non-flipped button opaque; else semi-transparent
                                     redoBtn2.style.opacity = redoStack.length ? '1' : '0.5';
                                 }

                                 // Wire pointer interactions for UNDO (flipped button)
                                 redoBtn.addEventListener('pointerdown', (e) => {
                                     if (e.pointerType === 'mouse' && e.button !== 0) return;
                                     e.stopPropagation();
                                     redoAnim.press();
                                     redoBtn.setPointerCapture && redoBtn.setPointerCapture(e.pointerId);
                                 }, { passive: false });
                                 redoBtn.addEventListener('pointerup', (e) => {
                                     e.stopPropagation();
                                     redoAnim.release();
                                     redoBtn.releasePointerCapture && redoBtn.releasePointerCapture(e.pointerId);

                                     // Perform undo if available
                                     if (!undoStack.length) return;
                                     // Pop the last placed item
                                     const last = undoStack.pop();
                                     // remove visual node from DOM if still present
                                     if (last.node && last.node.parentNode) {
                                         last.node.parentNode.removeChild(last.node);
                                     }
                                     // push a lightweight description onto redoStack so it can be recreated on Redo
                                     redoStack.push({
                                         src: last.src,
                                         snappedX: last.snappedX,
                                         snappedY: last.snappedY,
                                         width: last.width,
                                         height: last.height,
                                         outline: last.outline,
                                         boxShadow: last.boxShadow,
                                         outlineOffset: last.outlineOffset
                                     });

                                     // Update lastPlacedBlock to the new "most recent" in undoStack (or null)
                                     if (undoStack.length) {
                                         const newLast = undoStack[undoStack.length - 1];
                                         lastPlacedBlock = newLast && newLast.imgNode ? newLast.imgNode : null;
                                         // highlight the now-selected-last block
                                         if (lastPlacedBlock) {
                                             lastPlacedBlock.style.outline = newLast.outline;
                                             lastPlacedBlock.style.boxShadow = newLast.boxShadow;
                                             lastPlacedBlock.style.outlineOffset = newLast.outlineOffset;
                                             const t = lastPlacedBlock.parentNode.querySelector('.green-tint');
                                             if (t) t.style.opacity = '0.95';
                                         }
                                     } else {
                                         lastPlacedBlock = null;
                                     }

                                     refreshUndoRedoUI();
                                 }, { passive: false });
                                 redoBtn.addEventListener('pointercancel', (e) => {
                                     redoAnim.stopImmediate();
                                     redoBtn.releasePointerCapture && redoBtn.releasePointerCapture(e.pointerId);
                                 }, { passive: false });

                                 // Wire pointer interactions for REDO (non-flipped button)
                                 redoBtn2.addEventListener('pointerdown', (e) => {
                                     if (e.pointerType === 'mouse' && e.button !== 0) return;
                                     e.stopPropagation();
                                     redoAnim2.press();
                                     redoBtn2.setPointerCapture && redoBtn2.setPointerCapture(e.pointerId);
                                 }, { passive: false });
                                 redoBtn2.addEventListener('pointerup', (e) => {
                                     e.stopPropagation();
                                     redoAnim2.release();
                                     redoBtn2.releasePointerCapture && redoBtn2.releasePointerCapture(e.pointerId);

                                     // Perform redo if available
                                     if (!redoStack.length) return;
                                     // Pop a single item from redoStack and recreate it
                                     const item = redoStack.pop(); 
                                     
                                     const container = document.createElement('div');
                                     container.className = 'block-container';
                                     container.style.transform = `translate(${item.snappedX}px, ${item.snappedY}px)`;

                                     const recreated = document.createElement('img');
                                     recreated.src = item.src || '/GeometryDashingBlock.png';
                                     recreated.style.width = '100%';
                                     recreated.style.height = '100%';
                                     recreated.style.imageRendering = 'smooth';
                                     recreated.style.filter = 'none';
                                     recreated.style.outline = item.outline || 'none';
                                     recreated.style.boxShadow = item.boxShadow || 'none';
                                     recreated.style.outlineOffset = item.outlineOffset || '0px';
                                     recreated.draggable = false;

                                     if (recreated.src.includes('GridBlock02.png')) {
                                         const tint = document.createElement('div');
                                         tint.className = 'green-tint';
                                         container.appendChild(tint);
                                     }

                                     container.appendChild(recreated);

                                     // append into same blocksLayer used by placeBlock
                                     if (typeof blocksLayer !== 'undefined') {
                                         blocksLayer.appendChild(container);
                                     }

                                     // push recreated node back onto undoStack and make it the lastPlacedBlock
                                     const undoEntry = {
                                         node: container,
                                         imgNode: recreated,
                                         src: item.src,
                                         snappedX: item.snappedX,
                                         snappedY: item.snappedY,
                                         width: item.width || 60,
                                         height: item.height || 60,
                                         outline: item.outline || 'none',
                                         boxShadow: item.boxShadow || 'none',
                                         outlineOffset: item.outlineOffset || '0px'
                                     };
                                     undoStack.push(undoEntry);

                                     // Ensure only this recreated block is selected/highlighted
                                     if (lastPlacedBlock && lastPlacedBlock !== recreated) {
                                         // remove highlight from previous
                                         lastPlacedBlock.style.outline = 'none';
                                         lastPlacedBlock.style.boxShadow = 'none';
                                         const oldTint = lastPlacedBlock.parentNode.querySelector('.green-tint');
                                         if (oldTint) oldTint.style.opacity = '0';
                                     }
                                     lastPlacedBlock = recreated;
                                     lastPlacedBlock.style.outline = item.outline;
                                     lastPlacedBlock.style.boxShadow = item.boxShadow;
                                     lastPlacedBlock.style.outlineOffset = item.outlineOffset;
                                     
                                     const newTint = lastPlacedBlock.parentNode.querySelector('.green-tint');
                                     if (newTint) newTint.style.opacity = '0.95';

                                     refreshUndoRedoUI();
                                 }, { passive: false });
                                 redoBtn2.addEventListener('pointercancel', (e) => {
                                     redoAnim2.stopImmediate();
                                     redoBtn2.releasePointerCapture && redoBtn2.releasePointerCapture(e.pointerId);
                                 }, { passive: false });

                                 cOverlay.appendChild(redoBtn);
                                 cOverlay.appendChild(redoBtn2);

                                 // Patch placeBlock function to push placed items onto undoStack and clear redoStack
                                 // The placeBlock function is declared earlier in this C-page scope; override it to wrap existing behavior.
                                 // If placeBlock already exists, wrap it; otherwise create a simple implementation.
                                 (function patchPlaceBlock() {
                                     // Find existing placeBlock in current lexical scope by checking window (fallback)
                                     // Here we replace the local placeBlock with a new one using the blocksLayer defined earlier.
                                     const originalPlace = typeof placeBlock === 'function' ? placeBlock : null;

                                     // New placeBlock used by the editor: records minimal info needed for undo/redo
                                     placeBlock = function (worldX, worldY) {
                                         const snappedX = Math.floor(worldX / 60) * 60;
                                         const snappedY = Math.floor(worldY / 60) * 60;

                                         const container = document.createElement('div');
                                         container.className = 'block-container';
                                         container.style.transform = `translate(${snappedX}px, ${snappedY}px)`;

                                         const block = document.createElement('img');
                                         block.src = selectedBlockTexture || '/GeometryDashingBlock.png';
                                         block.style.width = '100%';
                                         block.style.height = '100%';
                                         block.style.filter = 'none';
                                         block.style.borderRadius = '1px';
                                         block.style.imageRendering = 'smooth';
                                         block.draggable = false;

                                         let currentOutline = '4px solid #43E179';
                                         let currentBoxShadow = 'none';

                                         if (block.src.includes('GridBlock02.png')) {
                                             currentOutline = 'none';
                                             const tint = document.createElement('div');
                                             tint.className = 'green-tint';
                                             container.appendChild(tint);
                                         }

                                         block.style.outline = currentOutline;
                                         block.style.boxShadow = currentBoxShadow;
                                         if (currentOutline !== 'none') block.style.outlineOffset = '-4px';

                                         container.appendChild(block);

                                         if (typeof blocksLayer !== 'undefined') {
                                             blocksLayer.appendChild(container);
                                         }

                                         // Remove highlight from previous lastPlaced
                                         if (lastPlacedBlock) {
                                             lastPlacedBlock.style.outline = 'none';
                                             lastPlacedBlock.style.boxShadow = 'none';
                                             const oldTint = lastPlacedBlock.parentNode.querySelector('.green-tint');
                                             if (oldTint) oldTint.style.opacity = '0';
                                         }
                                         lastPlacedBlock = block;

                                         // Push onto undo stack and clear redo stack
                                         undoStack.push({
                                             node: container,
                                             imgNode: block,
                                             src: block.src,
                                             snappedX: snappedX,
                                             snappedY: snappedY,
                                             width: 60,
                                             height: 60,
                                             outline: currentOutline,
                                             boxShadow: currentBoxShadow,
                                             outlineOffset: currentOutline !== 'none' ? '-4px' : '0px'
                                         });
                                         // placing a new block invalidates redo history
                                         redoStack.length = 0;
                                         refreshUndoRedoUI();
                                     };

                                     // If there was an originalPlace, we don't call it anymore; new behavior fully replaces it.
                                 })();
                                 // Initial UI refresh
                                 refreshUndoRedoUI();
                             })();

                             setPositions();
                         })();

                         // --- Back Button for C Page (Hidden but preserved in code) ---
                         const backBtnC = document.createElement('img');
                         backBtnC.src = '/pinkarrow.png';
                         backBtnC.className = 'menu-back-btn gd-button';
                         backBtnC.style.zIndex = '30010';
                         backBtnC.style.display = 'none'; // Hidden as requested
                         cOverlay.appendChild(backBtnC);

                         const exitToLevelMenu = () => {
                             const blackFade = createOverlay('black');
                             blackFade.style.opacity = '1';
                             setTimeout(() => {
                                 if (cOverlay && cOverlay.parentNode) cOverlay.remove();
                                 // resume music with fade-in and start from beginning
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
                                 requestAnimationFrame(() => { blackFade.style.opacity = '0'; });
                                 setTimeout(() => blackFade.remove(), 250);
                             }, 220);
                         };

                         (function attachCBackSpring(btn) {
                            const animatorC = createSpringAnimator(btn, { grow: 1.2, stiffness: 1400 });
                            btn.addEventListener('pointerdown', (e) => {
                                if(e.pointerType === 'mouse' && e.button !== 0) return;
                                animatorC.press();
                                btn.setPointerCapture(e.pointerId);
                            });
                            btn.addEventListener('pointerup', (e) => {
                                animatorC.stopImmediate();
                                btn.releasePointerCapture(e.pointerId);
                                exitToLevelMenu();
                            });
                         })(backBtnC);

                         // --- Editor Pause & Settings Buttons (Top Right) ---
                         // ASSET: @editorpausebutton.png
                         const pauseBtn = document.createElement('img');
                         pauseBtn.src = '/editorpausebutton.png';
                         pauseBtn.className = 'gd-button';
                         pauseBtn.style.position = 'absolute';
                         pauseBtn.style.top = '6px';
                         pauseBtn.style.right = '6px';
                         pauseBtn.style.width = '95px'; // Sized like icon kit arrow
                         pauseBtn.style.zIndex = '30010';
                         pauseBtn.style.cursor = 'pointer';
                         cOverlay.appendChild(pauseBtn);

                         // ASSET: @settings2.png
                         const editorSettingsBtn = document.createElement('img');
                         editorSettingsBtn.src = '/settings2.png';
                         editorSettingsBtn.className = 'gd-button';
                         editorSettingsBtn.style.position = 'absolute';
                         editorSettingsBtn.style.top = '6px';
                         // right Undoredo is 30px gap from left one. Pause is right 6px, width 95. 
                         // 6 + 95 + 30 = 131.
                         editorSettingsBtn.style.right = '131px'; 
                         editorSettingsBtn.style.width = '95px';
                         editorSettingsBtn.style.zIndex = '30010';
                         editorSettingsBtn.style.cursor = 'pointer';
                         cOverlay.appendChild(editorSettingsBtn);

                         (function attachEditorSettingsSpring(btn) {
                            const animator = createSpringAnimator(btn, { grow: 1.15, stiffness: 1400 });
                            btn.addEventListener('pointerdown', (e) => {
                                if(e.pointerType === 'mouse' && e.button !== 0) return;
                                e.stopPropagation();
                                animator.press();
                                btn.setPointerCapture(e.pointerId);
                            });
                            btn.addEventListener('pointerup', (e) => {
                                animator.release();
                                btn.releasePointerCapture(e.pointerId);
                            });
                         })(editorSettingsBtn);

                         (function attachPauseSpring(btn) {
                            const animator = createSpringAnimator(btn, { grow: 1.15, stiffness: 1400 });
                            btn.addEventListener('pointerdown', (e) => {
                                if(e.pointerType === 'mouse' && e.button !== 0) return;
                                e.stopPropagation();
                                animator.press();
                                btn.setPointerCapture(e.pointerId);
                            });
                            btn.addEventListener('pointerup', (e) => {
                                animator.release();
                                btn.releasePointerCapture(e.pointerId);
                                
                                // Open Pause Menu (Darkened background overlay)
                                const menuOverlay = document.createElement('div');
                                menuOverlay.className = 'placeholder-popup-overlay';
                                // stack buttons vertically and add spacing so EXIT appears under RESUME
                                menuOverlay.style.display = 'flex';
                                menuOverlay.style.flexDirection = 'column';
                                menuOverlay.style.alignItems = 'center';
                                menuOverlay.style.gap = '35px'; // increased gap between buttons
                                menuOverlay.style.zIndex = '40000';
                                
                                // Create the single Resume button directly on the overlay (no container box)
                                const resumeBtn = document.createElement('div');
                                resumeBtn.className = 'popup-ok-btn gd-button resume-btn-large';
                                
                                const resumeText = document.createElement('span');
                                resumeText.innerHTML = "Resume";
                                resumeText.className = 'gd-gradient-text resume-text-large';
                                resumeBtn.appendChild(resumeText);

                                const resAnim = createSpringAnimator(resumeBtn, { 
                                    grow: 1.1
                                });

                                const exitBtn = document.createElement('div');
                                exitBtn.className = 'popup-ok-btn gd-button resume-btn-large';
                                const exitText = document.createElement('span');
                                exitText.innerHTML = "Exit";
                                exitText.className = 'gd-gradient-text resume-text-large';
                                exitBtn.appendChild(exitText);

                                const exitAnim = createSpringAnimator(exitBtn, {
                                    grow: 1.1
                                });

                                // Resume Logic
                                resumeBtn.addEventListener('pointerdown', (ev) => {
                                    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
                                    ev.stopPropagation();
                                    resAnim.press();
                                    resumeBtn.setPointerCapture(ev.pointerId);
                                });
                                resumeBtn.addEventListener('pointerup', (ev) => {
                                    ev.stopPropagation();
                                    resAnim.release();
                                    try { resumeBtn.releasePointerCapture(ev.pointerId); } catch(e) {}
                                    if (menuOverlay && menuOverlay.parentNode) menuOverlay.remove();
                                });
                                resumeBtn.addEventListener('pointercancel', (ev) => {
                                    resAnim.stopImmediate();
                                    resumeBtn.releasePointerCapture(ev.pointerId);
                                });

                                // Exit Logic
                                exitBtn.addEventListener('pointerdown', (ev) => {
                                    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
                                    ev.stopPropagation();
                                    exitAnim.press();
                                    exitBtn.setPointerCapture(ev.pointerId);
                                });
                                exitBtn.addEventListener('pointerup', (ev) => {
                                    ev.stopPropagation();
                                    exitAnim.release();
                                    try { exitBtn.releasePointerCapture(ev.pointerId); } catch(e) {}
                                    if (menuOverlay && menuOverlay.parentNode) menuOverlay.remove();
                                    // Trigger navigation back to level page
                                    exitToLevelMenu();
                                });
                                exitBtn.addEventListener('pointercancel', (ev) => {
                                    exitAnim.stopImmediate();
                                    exitBtn.releasePointerCapture(ev.pointerId);
                                });

                                menuOverlay.appendChild(resumeBtn);
                                menuOverlay.appendChild(exitBtn);
                                cOverlay.appendChild(menuOverlay);

                                requestAnimationFrame(() => {
                                    menuOverlay.style.opacity = '1';
                                });
                            });
                         })(pauseBtn);

                         // Fade out the black overlay to reveal the C page
                         requestAnimationFrame(() => {
                             black.style.opacity = '0';
                         });
                         setTimeout(() => { black.remove(); }, 250);

                     }, 200);
                 }, { passive: true });
                 btn.addEventListener('pointercancel', (e) => {
                     animator.stopImmediate();
                     btn.releasePointerCapture && btn.releasePointerCapture(e.pointerId);
                 }, { passive: true });

                 // keyboard activation for accessibility
                 btn.tabIndex = 0;
                 btn.addEventListener('keydown', (ev) => {
                     if (ev.key === 'Enter' || ev.key === ' ') {
                         ev.preventDefault();
                         animator.press();
                         setTimeout(() => {
                             animator.stopImmediate();
                             // trigger the popup via programmatic click
                             const event = new Event('pointerup');
                             btn.dispatchEvent(event);
                         }, 120);
                     }
                 });
             })(infoActionBtn);

             // append the wrapper (with both buttons) into the blank overlay
             blank.appendChild(infoBtnWrapper);

             // --- Level Card Container ---
             const levelWrapper = document.createElement('div');
             levelWrapper.className = 'level-wrapper';
             blank.appendChild(levelWrapper);

             // Progress bars are now part of the level card container to ensure they slide together.

             const levelSelectSfx = new Audio('/geometry-dash-level-selected.mp3');

             function createLevelCard(levelData) {
                 const container = document.createElement('div');
                 container.className = 'level-card-container';

                 const card = document.createElement('div');
                 card.className = 'level-card';
                 if (levelData.cardColor && levelData.type !== "coming-soon") {
                     card.style.backgroundColor = levelData.cardColor;
                 }
                 // default to non-interactive; interactivity is added only for playable levels
                 container.appendChild(card);

                 // --- Progress Bars (Normal & Practice) inside the sliding container ---
                 const progressContainer = document.createElement('div');
                 progressContainer.className = 'progress-container';
                 container.appendChild(progressContainer);

                 const nVal = levelData.normalProgress || 0;
                 const pVal = levelData.practiceProgress || 0;

                 // Normal Mode
                 const normalLabel = document.createElement('div');
                 normalLabel.className = 'progress-label';
                 normalLabel.innerHTML = styleCaps("Normal Mode");
                 progressContainer.appendChild(normalLabel);

                 const normalPill = document.createElement('div');
                 normalPill.className = 'progress-pill';
                 if (levelData.cardColor) {
                    normalPill.style.backgroundColor = levelData.cardColor;
                 }
                 const normalFill = document.createElement('div');
                 normalFill.className = 'progress-fill normal';
                 normalFill.style.width = `${nVal}%`;
                 normalPill.appendChild(normalFill);
                 const normalPillText = document.createElement('div');
                 normalPillText.className = 'pill-text';
                 normalPillText.textContent = `${nVal}%`;
                 normalPill.appendChild(normalPillText);
                 progressContainer.appendChild(normalPill);

                 // Practice Mode
                 const practiceLabel = document.createElement('div');
                 practiceLabel.className = 'progress-label';
                 practiceLabel.innerHTML = styleCaps("Practice Mode");
                 progressContainer.appendChild(practiceLabel);

                 const practicePill = document.createElement('div');
                 practicePill.className = 'progress-pill';
                 if (levelData.cardColor) {
                    practicePill.style.backgroundColor = levelData.cardColor;
                 }
                 const practiceFill = document.createElement('div');
                 practiceFill.className = 'progress-fill practice';
                 practiceFill.style.width = `${pVal}%`;
                 practicePill.appendChild(practiceFill);
                 const practicePillText = document.createElement('div');
                 practicePillText.className = 'pill-text';
                 practicePillText.textContent = `${pVal}%`;
                 practicePill.appendChild(practicePillText);
                 progressContainer.appendChild(practicePill);

                 // If it's a "coming-soon" entry, hide progress and render simple text
                 if (levelData.type === "coming-soon") {
                     card.classList.add('no-bg');
                     // Hide progress bars for coming soon
                     progressContainer.style.display = 'none';

                     const text = document.createElement('div');
                     text.className = 'coming-soon-text no-box';
                     text.innerHTML = styleCaps('Coming Soon!');
                     // Force the coming-soon heading to remain a single unbroken line
                     text.style.whiteSpace = 'nowrap';
                     // center within the level card
                     text.style.position = 'absolute';
                     text.style.left = '50%';
                     text.style.top = '50%';
                     text.style.transform = 'translate(-50%, -50%)';
                     text.style.pointerEvents = 'none';
                     card.appendChild(text);

                     // ensure container is non-interactive
                     container.style.pointerEvents = 'none';
                     return container;
                 }

                 // For playable levels, enable interaction and visuals
                 card.style.cursor = 'pointer';
                 card.style.pointerEvents = 'auto';

                 // Interactive Spring Animation (Hold/Press) — only for playable cards
                 const animator = createSpringAnimator(card, {
                     grow: 1.05,
                     stiffness: 1200,
                     damping: 20
                 });

                 card.addEventListener('pointerdown', (e) => {
                     if (e.pointerType === 'mouse' && e.button !== 0) return;
                     animator.press();
                     card.setPointerCapture && card.setPointerCapture(e.pointerId);
                 }, { passive: true });

                 card.addEventListener('pointerup', (e) => {
                     animator.release();
                     card.releasePointerCapture && card.releasePointerCapture(e.pointerId);

                     // Trigger Selection
                     menuMusic.pause();
                     menuMusic.currentTime = 0;

                     levelSelectSfx.currentTime = 0;
                     levelSelectSfx.play().catch(()=>{});

                     // Fade to black (covering UI)
                     const black = createOverlay('black');
                     black.style.zIndex = '20000';
                     black.style.opacity = '0';
                     void black.offsetWidth;
                     black.style.opacity = '1';

                     // Simulate load delay then fade back to menu
                     setTimeout(() => {
                         black.style.opacity = '0';
                         setTimeout(() => black.remove(), 250);

                         menuMusic.play().catch(()=>{});
                     }, 1500);

                 }, { passive: true });

                 card.addEventListener('pointercancel', (e) => {
                     animator.release();
                     card.releasePointerCapture && card.releasePointerCapture(e.pointerId);
                 }, { passive: true });

                 // Difficulty Face (Left) — render first so text appears to the right
                 if (levelData.difficulty) {
                     const face = document.createElement('img');
                     face.src = levelData.difficulty;
                     face.className = 'difficulty-face';
                     card.appendChild(face);
                 }

                 // Name (to the right of the face)
                 const name = document.createElement('div');
                 name.className = 'level-name';
                 name.innerHTML = styleCaps(levelData.name);
                 // If this is the original Stereo Madness entry, tint its displayed name to the requested color
                 if (levelData.name === 'Stereo Madness') {
                     name.style.color = '#FFFFFF';
                     // increase outline (text-stroke) slightly for Stereo Madness specifically
                     name.style.webkitTextStroke = '3px rgba(0,0,0,0.9)';
                 }
                 card.appendChild(name);

                 // Orbs (Bottom Left)
                 if (levelData.orbs) {
                    const orbs = document.createElement('div');
                    orbs.className = 'orbs-container';

                    // Text first, then image
                    const orbText = document.createElement('span');
                    orbText.className = 'orb-count';
                    orbText.textContent = `0/${levelData.orbs}`;
                    orbs.appendChild(orbText);

                    const orbIcon = document.createElement('img');
                    orbIcon.src = '/Orbs.png';
                    orbIcon.className = 'orb-icon';
                    orbs.appendChild(orbIcon);

                    card.appendChild(orbs);
                 }

                 // Stars (Top Right) — show count to the left of the star icon and make it white
                 const stars = document.createElement('div');
                 stars.className = 'stars-container';
                 const starCount = document.createElement('span');
                 starCount.textContent = levelData.stars;
                 starCount.style.color = '#FFFFFF';
                 starCount.style.fontFamily = "'Pusab', sans-serif";
                 starCount.style.fontSize = '32px';
                 starCount.style.lineHeight = '1';
                 starCount.style.textShadow = '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, -3px 0 0 #000, 3px 0 0 #000, 0 -3px 0 #000, 0 3px 0 #000';
                 const starIcon = document.createElement('img');
                 starIcon.src = '/StarA.webp';
                 stars.appendChild(starCount);
                 stars.appendChild(starIcon);
                 card.appendChild(stars);

                 // Coins (Bottom Right) — use uncollected coin asset and no grayscale
                 const coins = document.createElement('div');
                 coins.className = 'coins-container';
                 for (let i = 0; i < 3; i++) {
                     const c = document.createElement('img');
                     c.src = '/uncollectedcoin.png';
                     c.className = 'coin-icon';
                     c.style.filter = 'none';
                     coins.appendChild(c);
                 }
                 card.appendChild(coins);

                 return container;
             }

             // Initialize first card
             let currentCard = createLevelCard(LEVELS[currentLevelIndex]);
             levelWrapper.appendChild(currentCard);

             // Keyboard navigation for level selection
             const handleLevelKeys = (e) => {
                 // Don't navigate if an overlay (like the stats popup) is active
                 if (blank.querySelector('.info-popup-overlay')) return;
                 
                 // Allow immediate navigation on arrow keys even if an animation is running;
                 // navigateLevel contains interruption logic to handle mid-animation calls.
                 if (e.key === 'ArrowLeft') navigateLevel(-1);
                 if (e.key === 'ArrowRight') navigateLevel(1);
             };
             window.addEventListener('keydown', handleLevelKeys);

             // Navigation Logic (Sequential Slide Out -> Spring In)
             function navigateLevel(direction) {
                 if (isAnimating) {
                     // Interruption Logic: Cancel current animation and snap to target state
                     if (entryTimeoutId) clearTimeout(entryTimeoutId);
                     if (entryAnimId) cancelAnimationFrame(entryAnimId);
                     
                     if (currentCard && currentCard.parentNode) currentCard.remove();
                     if (nextContainerRef) {
                         currentCard = nextContainerRef;
                         currentCard.style.transform = 'translateX(0)';
                         currentLevelIndex = nextIndexRef;
                     }
                     isAnimating = false;
                     updateArrows();
                 }

                 const nextIndex = (currentLevelIndex + direction + LEVELS.length) % LEVELS.length;
                 if (nextIndex === currentLevelIndex) return;

                 isAnimating = true;
                 nextIndexRef = nextIndex;

                 // prepare the next visual card
                 const nextContainer = createLevelCard(LEVELS[nextIndex]);
                 nextContainerRef = nextContainer;
                 levelWrapper.appendChild(nextContainer);
 
                 const exitDuration = 30; // Almost instant exit

                 // Progress bars are now inside individual card containers and slide naturally.

                 // Fade the level page background and ground to the target level colors while the current card exits.
                 try {
                     if (typeof _levelPageBlank !== 'undefined' && typeof _levelPageGround !== 'undefined') {
                         const targetLevel = LEVELS[nextIndex] || {};
                         const fadeTime = 400; // Smoother transition duration for background

                         // 1. Cross-fade background gradient using a new layer
                         const oldBg = _levelPageBg;
                         const newBg = document.createElement('div');
                         newBg.style.position = 'absolute';
                         newBg.style.inset = '0';
                         newBg.style.zIndex = '0';
                         newBg.style.opacity = '0';
                         newBg.style.background = targetLevel.bgGradient;
                         newBg.style.transition = `opacity ${fadeTime}ms ease-out`;
                         
                         // Insert below the ground
                         _levelPageBlank.insertBefore(newBg, _levelPageGround);
                         
                         requestAnimationFrame(() => {
                             newBg.style.opacity = '1';
                         });

                         setTimeout(() => {
                            if (oldBg && oldBg.parentNode) oldBg.remove();
                         }, fadeTime + 50);
                         
                         _levelPageBg = newBg;

                         // 2. Transition ground color (works naturally with CSS transitions)
                         _levelPageGround.style.transition = `background-color ${fadeTime}ms ease-out`;
                         _levelPageGround.style.backgroundColor = targetLevel.groundColor || _levelPageGround.style.backgroundColor;
                     }
                 } catch (e) {
                     // if something's not available, silently continue
                 }
                 // Make exit travel far enough to move completely offscreen, then bring the new card from the opposite offscreen side
                 // Exit right if left arrow pressed (dir -1), Exit left if right arrow pressed (dir 1)
                 const exitX = direction > 0 ? -300 : 300; // large percent ensures full offscreen exit
                 const enterX = direction > 0 ? 300 : -300; // new card starts fully offscreen on opposite side

                 // Setup new card
                 nextContainer.style.transform = `translateX(${enterX}%)`;
                 
                 // 1. Slide Current Card Out Fast
                 currentCard.style.transition = `transform ${exitDuration}ms cubic-bezier(0.4, 0, 1, 1)`;
                 currentCard.style.transform = `translateX(${exitX}%)`;

                 // 2. Wait for exit, then spring the new one in
                 // Reduced delay significantly for "almost instant" transition between levels
                 entryTimeoutId = setTimeout(() => {
                     entryTimeoutId = null;
                     let x = enterX;
                     let targetX = 0;
                     let vel = 0;
                     let dotUpdated = false; // ensure we flip the page-dot once while entering
                     // Parameters for a snappier entry bounce and quicker settling
                     const stiffness = 500; // Snappier return
                     const damping = 22;
                     const mass = 0.8;

                     // helper to set the active dot visual while animation is still running
                     function setActiveDotDuringAnimation(idx) {
                         const dots = pageDots.querySelectorAll('.page-dot');
                         dots.forEach((dot, dIdx) => {
                             if (dIdx === idx) dot.classList.add('active');
                             else dot.classList.remove('active');
                         });
                     }

                     function animateEntry() {
                         const dt = 1/60;
                         const force = -stiffness * (x - targetX);
                         const accel = force / mass;
                         vel += accel * dt;
                         vel *= Math.exp(-damping * dt);
                         x += vel * dt;

                         nextContainer.style.transform = `translateX(${x}%)`;

                         // When the incoming card gets near center, update the page dots
                         // (this makes the dot switch while the new card is visually moving in)
                         if (!dotUpdated && Math.abs(x) < 6) {
                             setActiveDotDuringAnimation(nextIndex);
                             dotUpdated = true;
                         }

                         if (Math.abs(x - targetX) < 0.1 && Math.abs(vel) < 0.1) {
                             nextContainer.style.transform = 'translateX(0)';
                             entryAnimId = null;
                             finish();
                             return;
                         }
                         entryAnimId = requestAnimationFrame(animateEntry);
                     }
                     entryAnimId = requestAnimationFrame(animateEntry);
                 }, exitDuration);

                 function finish() {
                     if (currentCard && currentCard.parentNode) {
                         currentCard.remove();
                     }
                     currentCard = nextContainer;
                     currentLevelIndex = nextIndex;
                     isAnimating = false;
                     updateArrows();
                 }
             }

             // --- Navigation Arrows ---
             const leftArrow = document.createElement('img');
             leftArrow.src = '/arrow.png';
             leftArrow.className = 'side-arrow left';
             leftArrow.draggable = false;
             blank.appendChild(leftArrow);

             const rightArrow = document.createElement('img');
             rightArrow.src = '/arrow.png';
             rightArrow.className = 'side-arrow right';
             rightArrow.draggable = false;
             blank.appendChild(rightArrow);

             // Download soundtrack text above dots
             const soundtrackText = document.createElement('div');
             soundtrackText.className = 'soundtrack-text gd-button';
             soundtrackText.innerHTML = styleCaps("Download the soundtrack");
             blank.appendChild(soundtrackText);

             // Preserve the horizontal centering transform so the spring animator's scale
             // doesn't overwrite translateX(-50%) and shift the element right when pressed.
             const soundtrackAnim = createSpringAnimator(soundtrackText, { grow: 1.15, stiffness: 1400, baseTransform: 'translateX(-50%)' });
             soundtrackText.addEventListener('pointerdown', (e) => {
                 if(e.pointerType === 'mouse' && e.button !== 0) return;
                 soundtrackAnim.press();
                 soundtrackText.setPointerCapture(e.pointerId);
             });
             soundtrackText.addEventListener('pointerup', (e) => {
                 soundtrackAnim.release();
                 soundtrackText.releasePointerCapture(e.pointerId);
                 // don't do anything
             });

             // Page dot indicators
             const pageDots = document.createElement('div');
             pageDots.className = 'page-dots';
             blank.appendChild(pageDots);

             function createDots(count, activeIndex) {
                 pageDots.innerHTML = '';
                 for (let i = 0; i < count; i++) {
                     const d = document.createElement('div');
                     d.className = 'page-dot' + (i === activeIndex ? ' active' : '');
                     d.dataset.index = i;
                     // clicking a dot jumps to that page
                     d.addEventListener('click', () => {
                         if (i === currentLevelIndex || isAnimating) return;
                         const dir = (i > currentLevelIndex) ? 1 : -1;
                         // jump directly by computing shortest wrap distance (prefer direct navigate)
                         navigateLevel(i - currentLevelIndex);
                     }, { passive: true });
                     pageDots.appendChild(d);
                 }
             }

             function updateArrows() {
                 // Always show arrows on the level page (wrap navigation handles bounds)
                 leftArrow.style.display = 'block';
                 rightArrow.style.display = 'block';
                 // update dots to reflect current page
                 const dots = pageDots.querySelectorAll('.page-dot');
                 dots.forEach((dot, idx) => {
                     if (idx === currentLevelIndex) dot.classList.add('active');
                     else dot.classList.remove('active');
                 });
             }
             // initial dots (starting page is left-most = index 0)
             createDots(LEVELS.length, currentLevelIndex);
             updateArrows();

             [leftArrow, rightArrow].forEach((arrow) => {
                 const isLeft = arrow.classList.contains('left');
                 const dir = isLeft ? -1 : 1;
                 const baseTransform = isLeft ? 'translateY(-50%) scaleX(-1)' : 'translateY(-50%)';

                 const animator = createSpringAnimator(arrow, {
                     grow: 1.12, stiffness: 1400, damping: 16, mass: 0.8, baseTransform: baseTransform
                 });

                 function trigger() {
                     animator.press();
                     navigateLevel(dir);
                 }

                 arrow.addEventListener('pointerdown', (e) => {
                    if(e.pointerType === 'mouse' && e.button !== 0) return;
                    trigger();
                    arrow.setPointerCapture && arrow.setPointerCapture(e.pointerId);
                 }, { passive: true });
                 
                 arrow.addEventListener('pointerup', (e) => {
                     animator.release();
                     arrow.releasePointerCapture && arrow.releasePointerCapture(e.pointerId);
                 }, { passive: true });

                 arrow.addEventListener('pointercancel', (e) => {
                     animator.stopImmediate();
                     arrow.releasePointerCapture && arrow.releasePointerCapture(e.pointerId);
                 }, { passive: true });
             });

             // --- Top Bar ---
             const topBar = document.createElement('img');
             topBar.src = '/Bar2.png';
             topBar.className = 'top-bar';
             blank.appendChild(topBar);
 
             // --- Menu Back Button ---
             const backBtn = document.createElement('img');
             backBtn.src = '/Menubackbutton.png';
             backBtn.className = 'menu-back-btn gd-button';
             backBtn.tabIndex = 0;
             blank.appendChild(backBtn);
 
             (function attachBackButtonSpring(btn) {
                 const animator = createSpringAnimator(btn, { grow: 1.20, stiffness: 1400, damping: 16, mass: 0.8 });
                 function onPointerDown(e) {
                     if (e.pointerType === 'mouse' && e.button !== 0) return;
                     animator.press();
                     btn.setPointerCapture && btn.setPointerCapture(e.pointerId);
                 }
                 function onPointerUp(e) {
                     animator.stopImmediate();
                     btn.releasePointerCapture && btn.releasePointerCapture(e.pointerId);
                     
                     resetMenuColors();

                     const blankOverlay = btn.closest('.transition-overlay.blank');
                     const black = createOverlay('black');
                     black.style.pointerEvents = 'auto';
                     black.style.opacity = '1';
                     setTimeout(() => {
                         window.removeEventListener('keydown', handleLevelKeys);
                         if (blankOverlay) blankOverlay.remove();
                         requestAnimationFrame(() => { black.style.opacity = '0'; });
                         setTimeout(() => { black.remove(); }, 220);
                     }, 220);
                 }
                 function onPointerCancel(e) {
                     animator.stopImmediate();
                     btn.releasePointerCapture && btn.releasePointerCapture(e.pointerId);
                 }
                 btn.addEventListener('pointerdown', onPointerDown, { passive: true });
                 btn.addEventListener('pointerup', onPointerUp, { passive: true });
                 btn.addEventListener('pointercancel', onPointerCancel, { passive: true });
             })(backBtn);
 
             blank.style.pointerEvents = 'auto';
             blank.style.opacity = '1';
             requestAnimationFrame(() => {
                 black.style.opacity = '0';
             });
             setTimeout(() => { black.remove(); }, 250);
         }, 200);
     }, { passive: true });
 
     // --- Editor (Online button) flow ---
     const hammerBtn = document.getElementById('hammer-btn');
     if (hammerBtn) {
         hammerBtn.addEventListener('click', () => {
             // Update document title to name the page "online page"
             document.title = 'Online Page';
 
             // Fade to black first
             const black = createOverlay('black');
             black.style.pointerEvents = 'auto';
             black.style.opacity = '1';
 
             setTimeout(() => {
                 // Create the online overlay (named "online-page")
                 const online = createOverlay('online-page');
                 online.classList.add('online-page');
                 online.style.opacity = '1';



                 // Corners
                 const cTL = document.createElement('img');
                 cTL.src = '/CornerBar.png';
                 cTL.className = 'corner-bar corner-tl';
                 cTL.style.zIndex = '10';
                 online.appendChild(cTL);

                 const cBL = document.createElement('img');
                 cBL.src = '/CornerBar.png';
                 cBL.className = 'corner-bar corner-bl';
                 cBL.style.zIndex = '10';
                 online.appendChild(cBL);

                 // Online Buttons Container
                 const btnContainer = document.createElement('div');
                 btnContainer.className = 'online-buttons-container';
                 online.appendChild(btnContainer);

                 const onlineBtnAssets = [
                     { src: '/Createbutton.png' },
                     { src: '/Leaderboard.png' },
                     { src: '/Searchbutton.png' },
                     { src: '/Saved.png' } // Added Saved button
                 ];

                 onlineBtnAssets.forEach((asset, idx) => {
                     const btn = document.createElement('img');
                     btn.src = asset.src;
                     btn.className = 'online-button gd-button';
                     btnContainer.appendChild(btn);

                     const animator = createSpringAnimator(btn, {
                         grow: 1.15,
                         stiffness: 1400,
                         damping: 16,
                         mass: 0.8
                     });

                     btn.addEventListener('pointerdown', (e) => {
                         if (e.pointerType === 'mouse' && e.button !== 0) return;
                         animator.press();
                         btn.setPointerCapture && btn.setPointerCapture(e.pointerId);
                     }, { passive: true });

                     btn.addEventListener('pointerup', (e) => {
                         animator.release();
                         btn.releasePointerCapture && btn.releasePointerCapture(e.pointerId);

                         // All online buttons now open their own "page" overlay matching the Create/My-levels style.
                         const openSimplePage = (opts = {}) => {
                             const black = createOverlay('black');
                             black.style.opacity = '1';
                             setTimeout(() => {
                                 const page = createOverlay(opts.className || 'create-blank-page');
                                 page.style.background = opts.background || 'linear-gradient(to bottom, #0165FC 0%, #013684 100%)';
                                 page.style.opacity = '1';
                                 page.style.pointerEvents = 'auto';

                                 // Corner Bars: place bottom-left and bottom-right by default
                                 const cb = document.createElement('img');
                                 cb.src = '/CornerBar.png';
                                 cb.className = 'corner-bar corner-bottom-left';
                                 cb.style.position = 'absolute';
                                 cb.style.bottom = '-1px';
                                 cb.style.left = '-2px';
                                 cb.style.width = '13%';
                                 cb.style.maxWidth = '420px';
                                 page.appendChild(cb);

                                 const cr = document.createElement('img');
                                 cr.src = '/CornerBar.png';
                                 cr.className = 'corner-bar corner-bottom-right';
                                 cr.style.position = 'absolute';
                                 cr.style.bottom = '-1px';
                                 cr.style.right = '-2px';
                                 cr.style.width = '13%';
                                 cr.style.maxWidth = '420px';
                                 cr.style.transform = 'scaleX(-1)';
                                 page.appendChild(cr);

                                 // Title / placeholder content
                                 if (opts.title) {
                                     const title = document.createElement('div');
                                     title.className = 'placeholder-text';
                                     title.textContent = opts.title;
                                     title.style.position = 'absolute';
                                     title.style.top = '30%';
                                     title.style.left = '50%';
                                     title.style.transform = 'translateX(-50%)';
                                     page.appendChild(title);
                                 }

                                 // Menubackbutton in same pos as pinkarrow
                                 const mb = document.createElement('img');
                                 mb.src = '/Menubackbutton.png';
                                 mb.className = 'menu-back-btn gd-button';
                                 mb.style.position = 'absolute';
                                 mb.style.top = '8px';
                                 mb.style.left = '8px';
                                 mb.style.width = '72px';
                                 page.appendChild(mb);

                                 const mbAnim = createSpringAnimator(mb, { grow: 1.2 });
                                 mb.addEventListener('pointerdown', (ev) => {
                                     if (ev.pointerType === 'mouse' && ev.button !== 0) return;
                                     mbAnim.press();
                                     mb.setPointerCapture(ev.pointerId);
                                 });
                                 mb.addEventListener('pointerup', (ev) => {
                                     mbAnim.release();
                                     mb.releasePointerCapture(ev.pointerId);
                                     const blackFade = createOverlay('black');
                                     blackFade.style.opacity = '1';
                                     setTimeout(() => {
                                         page.remove();
                                         blackFade.style.opacity = '0';
                                         setTimeout(() => blackFade.remove(), 250);
                                     }, 250);
                                 });

                                 // Optionally append any extra nodes (like lists/cards)
                                 if (typeof opts.init === 'function') opts.init(page);

                                 black.style.opacity = '0';
                                 setTimeout(() => black.remove(), 250);
                             }, 250);
                         };

                         // Route based on which asset was clicked
                         if (asset.src === '/Createbutton.png') {
                             openSimplePage({
                                 className: 'my-levels-page',
                                 background: 'linear-gradient(to bottom, #0165FC 0%, #013684 100%)',
                                 title: 'MY LEVELS',
                                 init(page) {
                                     // Add a left-bottom CornerBar rotated horizontally (already mirrored on right)
                                     const extra = document.createElement('img');
                                     extra.src = '/CornerBar.png';
                                     extra.className = 'corner-bar corner-bottom-left';
                                     extra.style.position = 'absolute';
                                     extra.style.bottom = '-1px';
                                     extra.style.left = '-2px';
                                     extra.style.width = '13%';
                                     extra.style.maxWidth = '420px';
                                     page.appendChild(extra);

                                     // Add Newbutton.png to the bottom right of the my levels page
                                     const newBtn = document.createElement('img');
                                     newBtn.src = '/Newbutton.png';
                                     newBtn.className = 'gd-button';
                                     newBtn.style.position = 'absolute';
                                     newBtn.style.bottom = '20px';
                                     newBtn.style.right = '20px';
                                     newBtn.style.width = '130px';
                                     newBtn.style.height = 'auto';
                                     newBtn.style.zIndex = '10020';
                                     page.appendChild(newBtn);

                                     const newBtnAnim = createSpringAnimator(newBtn, { grow: 1.15, stiffness: 1400 });
                                     newBtn.addEventListener('pointerdown', (ev) => {
                                         if (ev.pointerType === 'mouse' && ev.button !== 0) return;
                                         newBtnAnim.press();
                                         newBtn.setPointerCapture(ev.pointerId);
                                     });
                                     newBtn.addEventListener('pointerup', (ev) => {
                                         newBtnAnim.release();
                                         newBtn.releasePointerCapture(ev.pointerId);
                                     });
                                 }
                             });
                         } else if (asset.src === '/Leaderboard.png') {
                             openSimplePage({
                                 className: 'leaderboard-page',
                                 background: 'linear-gradient(to bottom, #0165FC 0%, #013684 100%)',
                                 title: 'SCORES',
                                 init(page) {
                                     // Insert a placeholder leaderboard list (simple vertical items)
                                     const list = document.createElement('div');
                                     list.style.position = 'absolute';
                                     list.style.top = '38%';
                                     list.style.left = '50%';
                                     list.style.transform = 'translateX(-50%)';
                                     list.style.width = '70%';
                                     list.style.maxWidth = '520px';
                                     list.style.display = 'flex';
                                     list.style.flexDirection = 'column';
                                     list.style.gap = '12px';
                                     list.style.zIndex = '10005';
                                     for (let i = 1; i <= 6; i++) {
                                         const row = document.createElement('div');
                                         row.style.background = 'rgba(255,255,255,0.06)';
                                         row.style.borderRadius = '8px';
                                         row.style.padding = '12px 18px';
                                         row.style.color = '#fff';
                                         row.style.fontFamily = 'Pusab, sans-serif';
                                         row.style.fontSize = '22px';
                                         row.textContent = `${i}. Player${i} — ${Math.floor(Math.random()*100000)}`;
                                         list.appendChild(row);
                                     }
                                     page.appendChild(list);
                                 }
                             });
                         } else if (asset.src === '/Searchbutton.png') {
                             openSimplePage({
                                 className: 'search-page',
                                 background: 'linear-gradient(to bottom, #0165FC 0%, #013684 100%)',
                                 title: 'SEARCH',
                                 init(page) {
                                     // Add a centered search box placeholder
                                     const box = document.createElement('div');
                                     box.style.position = 'absolute';
                                     box.style.top = '42%';
                                     box.style.left = '50%';
                                     box.style.transform = 'translateX(-50%)';
                                     box.style.width = '76%';
                                     box.style.maxWidth = '640px';
                                     box.style.height = '78px';
                                     box.style.borderRadius = '12px';
                                     box.style.background = 'rgba(255,255,255,0.12)';
                                     box.style.display = 'flex';
                                     box.style.alignItems = 'center';
                                     box.style.padding = '12px 18px';
                                     box.style.boxSizing = 'border-box';
                                     box.style.fontFamily = 'Pusab, sans-serif';
                                     box.style.color = '#fff';
                                     box.textContent = 'Type to search levels... (placeholder)';
                                     page.appendChild(box);
                                 }
                             });
                         } else if (asset.src === '/Saved.png') {
                             openSimplePage({
                                 className: 'saved-page',
                                 background: 'linear-gradient(to bottom, #0165FC 0%, #013684 100%)',
                                 title: 'SAVED',
                                 init(page) {
                                     // Add a small grid of saved items
                                     const grid = document.createElement('div');
                                     grid.style.position = 'absolute';
                                     grid.style.top = '36%';
                                     grid.style.left = '50%';
                                     grid.style.transform = 'translateX(-50%)';
                                     grid.style.width = '86%';
                                     grid.style.maxWidth = '860px';
                                     grid.style.display = 'grid';
                                     grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
                                     grid.style.gap = '12px';
                                     grid.style.zIndex = '10005';
                                     for (let i = 0; i < 6; i++) {
                                         const card = document.createElement('div');
                                         card.style.aspectRatio = '16/9';
                                         card.style.background = 'rgba(0,0,0,0.12)';
                                         card.style.borderRadius = '8px';
                                         card.style.display = 'flex';
                                         card.style.alignItems = 'center';
                                         card.style.justifyContent = 'center';
                                         card.style.color = '#111';
                                         card.style.fontFamily = 'Pusab, sans-serif';
                                         card.style.fontSize = '18px';
                                         card.textContent = `Saved ${i+1}`;
                                         grid.appendChild(card);
                                     }
                                     page.appendChild(grid);
                                 }
                             });
                         }
                     }, { passive: true });

                     btn.addEventListener('pointercancel', (e) => {
                         animator.stopImmediate();
                         btn.releasePointerCapture && btn.releasePointerCapture(e.pointerId);
                     }, { passive: true });
                 });
 
                 // Add the Menubackbutton into the online page and wire its mechanics
                 const backBtn = document.createElement('img');
                 backBtn.style.zIndex = '20';
                 // use the pink arrow texture, position and size it to match the level page top-left button
                 backBtn.src = '/pinkarrow.png';
                 backBtn.alt = 'menu-back';
                 backBtn.id = 'online-menu-back';
                 // give it the gd-button class so it visually matches and so we can attach the spring animator
                 backBtn.className = 'menu-back-btn gd-button';
                 // place at top-left and size like the level page back button
                 backBtn.style.position = 'absolute';
                 backBtn.style.top = '8px';
                 backBtn.style.left = '8px';
                 backBtn.style.width = '72px';
                 backBtn.tabIndex = 0;
                 online.appendChild(backBtn);
 
                 // Attach the same spring animator and pointer/keyboard handlers used on the level-page back button
                 (function attachBackButtonSpring(btn) {
                     const animator = createSpringAnimator(btn, {
                         grow: 1.20,
                         stiffness: 1400,
                         damping: 16,
                         mass: 0.8
                     });
 
                     function onPointerDown(e) {
                         if (e.pointerType === 'mouse' && e.button !== 0) return;
                         animator.press();
                         btn.setPointerCapture && btn.setPointerCapture(e.pointerId);
                     }
                     function onPointerUp(e) {
                         animator.stopImmediate();
                         btn.releasePointerCapture && btn.releasePointerCapture(e.pointerId);
                         
                         resetMenuColors();
 
                         // Fade back into the menu:
                         // 1) Fade to black quickly, 2) remove the online overlay, 3) fade black back out to reveal menu.
                         const onlineOverlay = btn.closest('.transition-overlay.online-page');
                         const blackFade = createOverlay('black');
                         blackFade.style.pointerEvents = 'auto';
                         blackFade.style.opacity = '1';
 
                         setTimeout(() => {
                             if (onlineOverlay) onlineOverlay.remove();
 
                             // Fade black back out to reveal menu again
                             requestAnimationFrame(() => {
                                 blackFade.style.opacity = '0';
                             });
 
                             setTimeout(() => {
                                 blackFade.remove();
                             }, 220);
                         }, 220);
                     }
                     function onPointerCancel(e) {
                         animator.stopImmediate();
                         btn.releasePointerCapture && btn.releasePointerCapture(e.pointerId);
                     }
 
                     btn.addEventListener('pointerdown', onPointerDown, { passive: true });
                     // Only listen for pointerup/pointercancel on the button itself so releasing elsewhere won't trigger it.
                     btn.addEventListener('pointerup', onPointerUp, { passive: true });
                     btn.addEventListener('pointercancel', onPointerCancel, { passive: true });
 
                     // accessibility: allow keyboard activation (Enter/Space)
                     btn.addEventListener('keydown', (ev) => {
                         if (ev.key === 'Enter' || ev.key === ' ') {
                             ev.preventDefault();
                             animator.press();
                             setTimeout(() => {
                                 animator.stopImmediate();
                                 const overlay = btn.closest('.transition-overlay.online-page');
                                 if (overlay) overlay.remove();
                             }, 120);
                         }
                     });
                 })(backBtn);
 
                 // show the overlay and enable pointer events
                 online.style.pointerEvents = 'auto';
                 
                 // Fade out black to reveal the new page
                 requestAnimationFrame(() => {
                     black.style.opacity = '0';
                 });
 
                 setTimeout(() => {
                     black.remove();
                 }, 250);
             }, 220);
         }, { passive: true });
     }

     // --- Icon Kit button flow ---
     const iconBtn = document.getElementById('icon-btn');
     if (iconBtn) {
         iconBtn.addEventListener('click', () => {
             const black = createOverlay('black');
             black.style.pointerEvents = 'auto';
             black.style.opacity = '1';

             setTimeout(() => {
                 const kit = createOverlay('icon-kit');
                 kit.classList.add('icon-kit');
                 kit.style.opacity = '0';
                 void kit.offsetWidth;

                 // Add preview cube at top center (lowered)
                 const previewCube = document.createElement('img');
                 // start empty; will be set from iconsData below to ensure correct default selection
                 previewCube.src = '';
                 previewCube.className = 'preview-cube';
                 kit.appendChild(previewCube);

                 // Add empty level box under the icon
                 const selectionBox = document.createElement('div');
                 selectionBox.className = 'icon-selection-box';
                 
                 const selectionGrid = document.createElement('div');
                 selectionGrid.className = 'selection-grid';
                 selectionBox.appendChild(selectionGrid);
                 
                 kit.appendChild(selectionBox);

                 // Selection Box Image
                 const selectionBoxIndicator = document.createElement('img');
                 selectionBoxIndicator.src = '/Selectionbox.png';
                 selectionBoxIndicator.className = 'selection-box-indicator';
                 selectionGrid.appendChild(selectionBoxIndicator);

                 // Load persistent icon index
                 let savedIndex = parseInt(localStorage.getItem('gd_selected_icon_index') || '0');

                 const iconsData = [
                    // corrected filenames so the displayed grid uses the actual assets present in the project
                    { base: '/cube_1 (6).png', variant: '/cube_1 (7).png' },
                    { base: '/cube_2 (5).png', variant: '/cube_2 (6).png' },
                    { base: '/cube_3 (5).png', variant: '/cube_3 (4).png' },
                    { base: '/cube_4 (5).png', variant: '/cube_4 (6).png' },
                    { base: '/cube_5 (16).png', variant: '/cube_5 (17).png' },
                    { base: '/cube_6 (2).png', variant: '/cube_6 (3).png' }
                 ];

                 // Set initial preview icon (ensures Selectionbox covers the first icon by default)
                 previewCube.src = iconsData[savedIndex].variant;

                 function updateSelectionBox(iconEl) {
                    const rect = iconEl.getBoundingClientRect();
                    const gridRect = selectionGrid.getBoundingClientRect();
                    
                    // Slightly larger inset/outset so the selection image appears bigger around icons
                    selectionBoxIndicator.style.left = (rect.left - gridRect.left - 6) + 'px';
                    selectionBoxIndicator.style.top = (rect.top - gridRect.top - 6) + 'px';
                    selectionBoxIndicator.style.width = (rect.width + 12) + 'px';
                    selectionBoxIndicator.style.height = (rect.height + 12) + 'px';
                    selectionBoxIndicator.style.opacity = '1';
                 }

                 // Create icons with per-icon spring animations; clicking selects the icon
                 iconsData.forEach((data, index) => {
                    const iconImg = document.createElement('img');
                    iconImg.src = data.base;
                    iconImg.className = 'grid-icon';
                    iconImg.style.width = '100%';
                    iconImg.style.height = 'auto';
                    iconImg.style.objectFit = 'contain';
                    iconImg.style.cursor = 'pointer';
                    iconImg.draggable = false;
                    selectionGrid.appendChild(iconImg);

                    // Attach a lightweight spring animator for tactile bounce feedback
                    const iconAnimator = createSpringAnimator(iconImg, {
                        grow: 1.12,
                        stiffness: 1400,
                        damping: 16,
                        mass: 0.9
                    });

                    // Pointer handlers: press animates, release selects
                    iconImg.addEventListener('pointerdown', (e) => {
                        if (e.pointerType === 'mouse' && e.button !== 0) return;
                        e.stopPropagation();
                        iconAnimator.press();
                        iconImg.setPointerCapture && iconImg.setPointerCapture(e.pointerId);
                    }, { passive: false });

                    iconImg.addEventListener('pointerup', (e) => {
                        e.stopPropagation();
                        iconAnimator.release();
                        try { iconImg.releasePointerCapture && iconImg.releasePointerCapture(e.pointerId); } catch (err) {}
                        // select the icon on release
                        previewCube.src = data.variant;
                        savedIndex = index;
                        localStorage.setItem('gd_selected_icon_index', index.toString());
                        updateSelectionBox(iconImg);
                    }, { passive: false });

                    iconImg.addEventListener('pointercancel', (e) => {
                        iconAnimator.stopImmediate();
                        try { iconImg.releasePointerCapture && iconImg.releasePointerCapture(e.pointerId); } catch (err) {}
                    }, { passive: false });

                    // Also support a simple keyboard activation for accessibility
                    iconImg.tabIndex = 0;
                    iconImg.addEventListener('keydown', (ev) => {
                        if (ev.key === 'Enter' || ev.key === ' ') {
                            ev.preventDefault();
                            // brief visual tap then select
                            iconAnimator.press();
                            setTimeout(() => {
                                iconAnimator.release();
                                previewCube.src = data.variant;
                                savedIndex = index;
                                localStorage.setItem('gd_selected_icon_index', index.toString());
                                updateSelectionBox(iconImg);
                            }, 110);
                        }
                    });

                    // Update selection box on first render of the grid after the image has loaded
                    if (index === savedIndex) {
                        if (iconImg.complete && iconImg.naturalWidth !== 0) {
                            // already loaded — position immediately on next frame
                            requestAnimationFrame(() => updateSelectionBox(iconImg));
                        } else {
                            // wait for the image to finish loading before calculating layout
                            iconImg.addEventListener('load', () => {
                                requestAnimationFrame(() => updateSelectionBox(iconImg));
                            }, { once: true });
                        }
                    }
                 });

                 // Add CornerBars into the icon kit page: top-left plus bottom-left and bottom-right (match top-left size)
                 const cTopLeft = document.createElement('img');
                 cTopLeft.src = '/CornerBar.png';
                 cTopLeft.className = 'corner-bar corner-tl flipped-x';
                 kit.appendChild(cTopLeft);

                 const cBottomLeft = document.createElement('img');
                 cBottomLeft.src = '/CornerBar.png';
                 cBottomLeft.className = 'corner-bar corner-bl';
                 kit.appendChild(cBottomLeft);

                 const cBottomRight = document.createElement('img');
                 cBottomRight.src = '/CornerBar.png';
                 cBottomRight.className = 'corner-bar corner-br'; // mirror handled in CSS
                 kit.appendChild(cBottomRight);

                 // Back button
                 const backBtn = document.createElement('img');
                 backBtn.src = '/pinkarrow.png';
                 backBtn.className = 'menu-back-btn gd-button';
                 backBtn.tabIndex = 0;
                 kit.appendChild(backBtn);

                 // Attach back button spring and logic
                 const animator = createSpringAnimator(backBtn, {
                     grow: 1.20,
                     stiffness: 1400,
                     damping: 16,
                     mass: 0.8
                 });

                 function onPointerDown(e) {
                     if (e.pointerType === 'mouse' && e.button !== 0) return;
                     animator.press();
                     backBtn.setPointerCapture && backBtn.setPointerCapture(e.pointerId);
                 }
                 function onPointerUp(e) {
                     animator.stopImmediate();
                     backBtn.releasePointerCapture && backBtn.releasePointerCapture(e.pointerId);

                     resetMenuColors();

                     const kitOverlay = backBtn.closest('.transition-overlay.icon-kit');
                     const blackFade = createOverlay('black');
                     blackFade.style.pointerEvents = 'auto';
                     blackFade.style.opacity = '1';

                     setTimeout(() => {
                         if (kitOverlay) kitOverlay.remove();
                         requestAnimationFrame(() => {
                             blackFade.style.opacity = '0';
                         });
                         setTimeout(() => {
                             blackFade.remove();
                         }, 220);
                     }, 220);
                 }
                 function onPointerCancel(e) {
                     animator.stopImmediate();
                     backBtn.releasePointerCapture && backBtn.releasePointerCapture(e.pointerId);
                 }

                 backBtn.addEventListener('pointerdown', onPointerDown, { passive: true });
                 backBtn.addEventListener('pointerup', onPointerUp, { passive: true });
                 backBtn.addEventListener('pointercancel', onPointerCancel, { passive: true });

                 backBtn.addEventListener('keydown', (ev) => {
                     if (ev.key === 'Enter' || ev.key === ' ') {
                         ev.preventDefault();
                         animator.press();
                         setTimeout(() => {
                             animator.stopImmediate();
                             // Trigger exit
                             const kitOverlay = backBtn.closest('.transition-overlay.icon-kit');
                             const blackFade = createOverlay('black');
                             blackFade.style.pointerEvents = 'auto';
                             blackFade.style.opacity = '1';
                             setTimeout(() => {
                                 if (kitOverlay) kitOverlay.remove();
                                 requestAnimationFrame(() => { blackFade.style.opacity = '0'; });
                                 setTimeout(() => { blackFade.remove(); }, 220);
                             }, 220);
                         }, 120);
                     }
                 });

                 kit.style.opacity = '1';
                 requestAnimationFrame(() => {
                     black.style.opacity = '0';
                 });
                 setTimeout(() => {
                     black.remove();
                 }, 250);

             }, 200);
         });
     }
 })();
})();