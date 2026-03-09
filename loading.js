import { tryPlayMusic, scheduleRetry } from './audio.js';
import { setBackgroundLoaded } from './background.js';

export function initLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    const fill = document.getElementById('loading-bar-fill');
    const textEl = document.getElementById('loading-text');
    
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
    
    function wrapText(str, limit) {
        if (!str) return '';
        const words = str.split(/\s+/);
        const lines = [];
        let current = '';

        for (let i = 0; i < words.length; i++) {
            const w = words[i];
            if (current.length === 0) {
                current = w;
                continue;
            }
            if ((current.length + 1 + w.length) <= limit) {
                current += ' ' + w;
            } else {
                lines.push(current);
                current = w;
            }
        }
        if (current.length > 0) lines.push(current);
        return lines.join('\n');
    }

    textEl.textContent = wrapText(rawText, 27);

    // List of assets to preload (shortened list for brevity in this refactor, but represents the full list)
    // In a real scenario, this should match the full list in main.js
    const assetsToLoad = [
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
        '/cube_1 (6).png', '/cube_1 (7).png', '/cube_2 (5).png', '/cube_2 (6).png',
        '/cube_3 (5).png', '/cube_3 (4).png', '/cube_4 (5).png', '/cube_4 (6).png',
        '/cube_5 (20).png', '/cube_5 (21).png', '/cube_6 (3).png', '/cube_6 (2).png',
        '/PUSAB___.otf', '/Dosis-VariableFont_wght (1).ttf', 
        '/topbar.png', '/sidebar.png', '/Leaderboard.png', '/Createbutton.png', '/Searchbutton.png',
        '/GJ_button_02-uhd.png', '/GJ_button_03-uhd.png', '/GJ_button_04-uhd.png', '/GJ_button_05-uhd.png',
        '/584131_Geometry-Dash-Menu-Theme.mp3', '/geometry-dash-level-selected.mp3',
        '/Geometry Dash Level Complete Sound Effect.mp3', '/Geometry Dash Stereo Madness soundtrack 4.mp3',
        '/Geometry Dash Death Sound - Sound Effect (HD).mp3', '/achievement-geometry-dash.mp3'
    ];

    let loadedCount = 0;
    const totalToLoad = assetsToLoad.length + 1; 

    const updateProgress = () => {
        loadedCount++;
        const progress = Math.min(loadedCount / totalToLoad, 1);
        const primaryPercent = Math.min(Math.round(progress * 10000) / 100, 100);
        
        if (fill) {
            fill.style.width = `${primaryPercent}%`;
            if (primaryPercent >= 99) {
                fill.classList.add('rounded-end');
            } else {
                fill.classList.remove('rounded-end');
            }
        }
    };

    const loadPromises = assetsToLoad.map(url => {
        if (url.endsWith('.mp3')) {
            return new Promise((resolve) => {
                const audio = new Audio();
                audio.src = url;
                audio.oncanplaythrough = () => { resolve(); updateProgress(); };
                audio.onerror = () => { resolve(); updateProgress(); }; 
                audio.load();
            });
        } else {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = url;
                img.onload = () => { resolve(); updateProgress(); };
                img.onerror = () => { resolve(); updateProgress(); };
            });
        }
    });

    const fontPromise = document.fonts.ready.then(() => {
        updateProgress();
    });

    const minTimePromise = new Promise(res => setTimeout(res, 1000));

    Promise.all([...loadPromises, fontPromise, minTimePromise]).then(() => {
        setBackgroundLoaded(true);
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
            loadingScreen.remove();
        }
        startMusicAfterLoading();
    });
}

function startMusicAfterLoading() {
    tryPlayMusic().catch(() => {
        scheduleRetry();
        const gestureEvents = ['pointerdown', 'touchstart', 'keydown', 'mousedown'];
        function onUserGestureOnce() {
            tryPlayMusic().catch(() => {}).finally(() => {
                gestureEvents.forEach(ev => window.removeEventListener(ev, onUserGestureOnce));
            });
        }
        gestureEvents.forEach(ev => window.addEventListener(ev, onUserGestureOnce, { passive: true }));
    });
}