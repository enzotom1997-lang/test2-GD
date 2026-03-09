// Shared utility functions

export function styleCaps(str) {
    if (!str) return '';
    return str.split('').map(c => (c >= 'A' && c <= 'Z') ? `<span class="lvl-first">${c}</span>` : c).join('');
}

export function createOverlay(className) {
    const el = document.createElement('div');
    el.className = `transition-overlay ${className}`;
    document.body.appendChild(el);
    // Force style recalc so transitions apply when we change opacity
    void el.offsetWidth;
    return el;
}