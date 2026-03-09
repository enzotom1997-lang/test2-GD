// Background scrolling and color tweening logic

const BG_SPEED_FACTOR = 0.08; 
const BASE_SPEED = 8.5; 

let currentColor = { r: 0x28, g: 0x3E, b: 0xFF };
let targetColor = pickRandomColor();
let colorTransitionProgress = 0;
const COLOR_TRANSITION_DURATION = 360; 
const COLOR_BLEND_STRENGTH = 0.92; 
const HOLD_FRAMES = 45;

let scrollPosition = 0;
let isLoaded = false;

function pickRandomColor() {
    const h = Math.random() * 360;
    const s = 0.9 + Math.random() * 0.1; 
    const v = 0.75 + Math.random() * 0.25; 

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

export function resetMenuColors() {
    currentColor = { r: 0x28, g: 0x3E, b: 0xFF };
    targetColor = pickRandomColor();
    colorTransitionProgress = 0;
    const bg = document.getElementById('background-container');
    const gr = document.getElementById('ground-container');
    if(bg) bg.style.backgroundColor = colorToCss(currentColor);
    if(gr) gr.style.backgroundColor = colorToCss(currentColor);
}

export function setBackgroundLoaded(val) {
    isLoaded = val;
}

export function initBackgroundAnimation() {
    const backgroundContainer = document.getElementById('background-container');
    const groundContainer = document.getElementById('ground-container');
    
    // Initial set
    backgroundContainer.style.backgroundColor = colorToCss(currentColor);
    groundContainer.style.backgroundColor = colorToCss(currentColor);
    groundContainer.style.backgroundImage = "url('/Ground1.png')";

    function animate() {
        if (!isLoaded) {
            requestAnimationFrame(animate);
            return;
        }
        
        scrollPosition += BASE_SPEED;
        colorTransitionProgress++;

        let t = 0;
        if (colorTransitionProgress >= 0) {
            t = colorTransitionProgress / COLOR_TRANSITION_DURATION;
        }

        if (t >= 1) {
            const smoothT = 1; 
            const blendedFinal = {
                r: lerp(currentColor.r, targetColor.r, smoothT * COLOR_BLEND_STRENGTH),
                g: lerp(currentColor.g, targetColor.g, smoothT * COLOR_BLEND_STRENGTH),
                b: lerp(currentColor.b, targetColor.b, smoothT * COLOR_BLEND_STRENGTH)
            };
            currentColor = blendedFinal;
            targetColor = pickRandomColor();
            colorTransitionProgress = -HOLD_FRAMES; 
            t = 0;
        }

        const smoothT = t * t * (3 - 2 * t);
        const blended = {
            r: lerp(currentColor.r, targetColor.r, smoothT * COLOR_BLEND_STRENGTH),
            g: lerp(currentColor.g, targetColor.g, smoothT * COLOR_BLEND_STRENGTH),
            b: lerp(currentColor.b, targetColor.b, smoothT * COLOR_BLEND_STRENGTH)
        };

        const groundOffset = scrollPosition;
        const backgroundOffset = scrollPosition * BG_SPEED_FACTOR;
        const cssColor = colorToCss(blended);

        groundContainer.style.backgroundPositionX = `-${groundOffset}px`;
        groundContainer.style.backgroundColor = cssColor;

        backgroundContainer.style.backgroundPositionX = `-${backgroundOffset}px`;
        backgroundContainer.style.backgroundColor = cssColor;

        requestAnimationFrame(animate);
    }

    animate();
}