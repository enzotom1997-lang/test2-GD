import { createOverlay } from './utils.js';
import { menuMusic, fadeMenuMusicIn } from './audio.js';

export function startEditor() {
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
        cOverlay.style.backgroundColor = '#000';
        cOverlay.style.background = '#000';
        cOverlay.style.pointerEvents = 'auto';
        cOverlay.style.opacity = '1';
        document.body.appendChild(cOverlay);

        cOverlay.addEventListener('contextmenu', (ev) => ev.preventDefault(), { passive: false });
        cOverlay.addEventListener('touchstart', (ev) => ev.preventDefault(), { passive: false });

        // Add a static background image
        const bgImg = document.createElement('img');
        bgImg.src = '/Background1.png';
        bgImg.style.position = 'absolute';
        bgImg.style.top = '50%';
        bgImg.style.left = '50%';
        bgImg.style.transform = 'translate(-50%, -50%) translateZ(0)';
        bgImg.style.width = '290%'; 
        bgImg.style.height = '290%';
        bgImg.style.objectFit = 'cover';
        bgImg.style.pointerEvents = 'none';
        bgImg.draggable = false;
        bgImg.style.filter = 'saturate(1.45) contrast(1.05)';
        bgImg.style.opacity = '0.98';
        cOverlay.appendChild(bgImg);

        const tint = document.createElement('div');
        tint.style.position = 'absolute';
        tint.style.inset = '0';
        tint.style.backgroundColor = '#287DFF';
        tint.style.opacity = '1';
        tint.style.mixBlendMode = 'multiply';
        tint.style.pointerEvents = 'none';
        cOverlay.appendChild(tint);

        const gridLayer = document.createElement('div');
        gridLayer.style.position = 'absolute';
        gridLayer.style.inset = '0';
        gridLayer.style.zIndex = '1';
        gridLayer.style.backgroundImage = [
        "linear-gradient(to right, rgba(0,0,0,0.2) 2px, transparent 2px)",
        "linear-gradient(to bottom, rgba(0,0,0,0.2) 2px, transparent 2px)"
        ].join(',');
        gridLayer.style.backgroundSize = '60px 60px';
        gridLayer.style.pointerEvents = 'none';
        cOverlay.appendChild(gridLayer);

        const groundDiv = document.createElement('div');
        groundDiv.style.position = 'absolute';
        groundDiv.style.left = '-10%'; 
        groundDiv.style.width = '120%';
        groundDiv.style.bottom = '0';
        groundDiv.style.height = '35%'; 
        groundDiv.style.backgroundImage = "url('/Ground1.png')";
        groundDiv.style.backgroundRepeat = 'repeat-x';
        groundDiv.style.backgroundSize = 'auto 100%';
        groundDiv.style.backgroundPosition = '0px center';
        groundDiv.style.backgroundColor = '#004CFF';
        groundDiv.style.backgroundBlendMode = 'multiply';
        groundDiv.style.pointerEvents = 'none';
        groundDiv.style.transformOrigin = 'bottom center';
        groundDiv.draggable = false;
        groundDiv.style.zIndex = '10';
        cOverlay.appendChild(groundDiv);

        const voidDiv = document.createElement('div');
        voidDiv.style.position = 'absolute';
        voidDiv.style.top = '100%';
        voidDiv.style.left = '0';
        voidDiv.style.width = '100%';
        voidDiv.style.height = '16000px'; 
        voidDiv.style.backgroundColor = '#000';
        voidDiv.style.pointerEvents = 'none';
        groundDiv.appendChild(voidDiv);

        const lineImg = document.createElement('img');
        lineImg.src = '/Line.png';
        lineImg.style.position = 'absolute';
        lineImg.style.left = '50%';
        lineImg.style.top = '65%'; 
        lineImg.style.transform = 'translate(-50%, -50%)';
        lineImg.style.width = '100%';
        lineImg.style.maxWidth = '1000px';
        lineImg.style.pointerEvents = 'none';
        lineImg.draggable = false;
        lineImg.style.zIndex = '11';
        cOverlay.appendChild(lineImg);

        const bottomSeparator = document.createElement('div');
        bottomSeparator.style.position = 'absolute';
        bottomSeparator.style.left = '0';
        bottomSeparator.style.right = '0';
        bottomSeparator.style.bottom = '30%';
        bottomSeparator.style.height = '6px';
        bottomSeparator.style.background = 'linear-gradient(to bottom, #3E546E 0%, #272F42 50%, #0F182B 100%)';
        bottomSeparator.style.zIndex = '12';
        bottomSeparator.style.pointerEvents = 'none';
        cOverlay.appendChild(bottomSeparator);

        const editorBtnContainer = document.createElement('div');
        editorBtnContainer.className = 'editor-tools-container'; // Used CSS class for styling
        editorBtnContainer.style.zIndex = '11';
        cOverlay.appendChild(editorBtnContainer);

        const editorTools = [
            { icon: '/GeometryDashingBlock.png', scale: '35.5%' },
            { icon: '/Spike.png', scale: '36%' },
            { icon: '/ColourTrigger.webp', scale: '27%' }
        ];

        let activeToolIndex = 0;
        const toolButtons = [];

        function updateToolSelection() {
            toolButtons.forEach((btn, idx) => {
                btn.style.opacity = (idx === activeToolIndex) ? '1' : '0.5';
            });
        }

        editorTools.forEach((tool, idx) => {
            const btn = document.createElement('div');
            btn.className = 'gd-button editor-tool-btn';
            btn.style.backgroundImage = "url('/GJ_button_05-uhd.png')";
            
            const innerImg = document.createElement('img');
            innerImg.src = tool.icon;
            innerImg.draggable = false;
            innerImg.style.width = tool.scale;
            innerImg.style.height = 'auto';
            innerImg.style.pointerEvents = 'none';
            innerImg.style.transform = 'translateY(-26px)';
            btn.appendChild(innerImg);

            const anim = window.createSpringAnimator(btn, {
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

        const bottomBox = document.createElement('div');
        bottomBox.className = 'editor-bottom-box';
        bottomBox.style.zIndex = '12';
        bottomBox.style.background = '#0E1526';
        cOverlay.appendChild(bottomBox);

        const lineEdgeGap = 195;
        for (let i = 0; i < 2; i++) {
            const lb = document.createElement('img');
            lb.src = '/Line.png';
            lb.className = 'editor-separator-line';
            if (i === 0) {
                lb.style.left = `${lineEdgeGap}px`;
                lb.style.transform = 'translate(-30%, -50%) rotate(90deg)';
            } else {
                lb.style.right = `${lineEdgeGap}px`;
                lb.style.transform = 'translate(50%, -50%) rotate(90deg)';
            }
            bottomBox.appendChild(lb);
        }

        const leftButtonsContainer = document.createElement('div');
        leftButtonsContainer.className = 'editor-left-actions';
        leftButtonsContainer.style.zIndex = '20';
        bottomBox.appendChild(leftButtonsContainer);

        const editorBtnAssets = [
            { name: 'Build', u: '/buildbuttonunselected.png', s: '/buildbuttonselected.png', rotate: -90 },
            { name: 'Edit', u: '/editbuttonunselected.png', s: '/editbuttonselected.png', rotate: -90 },
            { name: 'Delete', u: '/deletebuttonunselected.png', s: '/deletebuttonselected.png', rotate: 0 }
        ];

        let selectedEditorIndex = 0; 

        editorBtnAssets.forEach((asset, idx) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'gd-button editor-btn-wrap';
            if (idx === 0) wrapper.style.marginTop = '20px';
            if (idx === 1) wrapper.style.marginTop = '-120px';
            if (idx === 2) wrapper.style.marginTop = '-120px';
            wrapper.style.clipPath = 'inset(60px 0px 60px 0px)';

            const img = document.createElement('img');
            img.draggable = false;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            img.style.pointerEvents = 'none'; 
            img.src = (idx === selectedEditorIndex) ? asset.s : asset.u;
            img.style.transform = asset.rotate ? `rotate(${asset.rotate}deg)` : '';

            wrapper.appendChild(img);

            const anim = window.createSpringAnimator(wrapper, {
                grow: 1.15, stiffness: 1400, damping: 16, mass: 0.8,
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

                selectedEditorIndex = idx;

                Array.from(leftButtonsContainer.children).forEach((childWrap, i) => {
                    const data = editorBtnAssets[i];
                    const childImg = childWrap.querySelector('img');
                    const usingSelected = (i === selectedEditorIndex);

                    if (usingSelected) {
                        const pre = new Image();
                        pre.onload = () => {
                            childImg.src = data.s;
                            const rot = (data.name === 'Delete') ? -90 : (data.rotate ? data.rotate : 0);
                            childImg.style.transform = `rotate(${rot}deg) scale(1.01)`;
                        };
                        pre.onerror = () => {
                            try { childImg.src = data.s; } catch (e) {}
                            const rot = (data.name === 'Delete') ? -90 : (data.rotate ? data.rotate : 0);
                            childImg.style.transform = `rotate(${rot}deg) scale(1.01)`;
                        };
                        pre.src = data.s;
                    } else {
                        childImg.src = data.u;
                        childImg.style.transform = (data.rotate ? `rotate(${data.rotate}deg)` : '') + ' scale(1)';
                    }
                });
            }, { passive: false });

            wrapper.addEventListener('pointercancel', (e) => {
                anim.stopImmediate();
                try { wrapper.releasePointerCapture && wrapper.releasePointerCapture(e.pointerId); } catch (err) {}
            }, { passive: false });

            leftButtonsContainer.appendChild(wrapper);

            if (asset.name === 'Delete' && idx === selectedEditorIndex) {
                img.style.transform = 'rotate(-90deg)';
            }
        });

        // Extra center button (Current Block Indicator)
        const extraBtn = document.createElement('div');
        extraBtn.className = 'gd-button editor-center-btn';
        extraBtn.style.backgroundImage = "url('/GJ_button_04-uhd.png')";
        let extraBtnSelected = false;

        const blockIcon = document.createElement('img');
        blockIcon.src = '/GeometryDashingBlock.png';
        blockIcon.className = 'editor-center-icon';
        extraBtn.appendChild(blockIcon);

        const extraAnim = window.createSpringAnimator(extraBtn, { grow: 1.12, stiffness: 1400, baseTransform: 'translate(-50%, -50%)' });
        extraBtn.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            e.stopPropagation();
            extraAnim.press();
            extraBtn.setPointerCapture(e.pointerId);
        });
        extraBtn.addEventListener('pointerup', (e) => {
            e.stopPropagation();
            extraAnim.release();
            extraBtn.releasePointerCapture && extraBtn.releasePointerCapture(e.pointerId);
            
            extraBtnSelected = !extraBtnSelected;
            const prevTransition = extraBtn.style.transition;
            extraBtn.style.transition = 'none';
            extraBtn.style.filter = extraBtnSelected ? 'brightness(0.5)' : 'none';
            void extraBtn.offsetWidth; 
            setTimeout(() => { extraBtn.style.transition = prevTransition || ''; }, 0);
        });
        bottomBox.appendChild(extraBtn);

        // --- Swipe Button (right side of bottom box) ---
        const swipeBtn = document.createElement('div');
        swipeBtn.className = 'gd-button editor-swipe-btn';
        swipeBtn.draggable = false;
        swipeBtn.style.backgroundImage = "url('/GJ_button_01-uhd.png')";
        swipeBtn.style.backgroundSize = 'contain';
        swipeBtn.style.backgroundRepeat = 'no-repeat';
        swipeBtn.style.backgroundPosition = 'center';
        swipeBtn.style.pointerEvents = 'auto';
        swipeBtn.setAttribute('role', 'button');
        swipeBtn.setAttribute('aria-pressed', 'false');

        // textual overlay (use a dedicated class for consistent styling)
        const swipeLabel = document.createElement('div');
        swipeLabel.className = 'swipe-label';
        swipeLabel.textContent = 'swipe';
        swipeLabel.style.pointerEvents = 'none';
        swipeBtn.appendChild(swipeLabel);

        // swipe mode flag used by pointermove placement logic (declared in this scope)
        let swipeMode = false;
        const swipeAnim = window.createSpringAnimator(swipeBtn, { grow: 1.12, stiffness: 1400, damping: 16 });

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

            // Toggle swipe mode
            swipeMode = !swipeMode;
            swipeBtn.setAttribute('aria-pressed', swipeMode ? 'true' : 'false');

            // Instant visual swap between the two GJ button textures
            const prevTransition = swipeBtn.style.transition;
            swipeBtn.style.transition = 'none';
            swipeBtn.style.backgroundImage = swipeMode ? "url('/GJ_button_02-uhd.png')" : "url('/GJ_button_01-uhd.png')";
            // Subtle label emphasis when active
            swipeLabel.style.opacity = swipeMode ? '0.95' : '1';
            swipeBtn.dataset.active = swipeMode ? '1' : '0';

            // Force reflow then restore transitions
            void swipeBtn.offsetWidth;
            setTimeout(() => { swipeBtn.style.transition = prevTransition || ''; }, 0);
        }, { passive: false });

        swipeBtn.addEventListener('pointercancel', (e) => {
            swipeAnim.stopImmediate();
            swipeBtn.releasePointerCapture && swipeBtn.releasePointerCapture(e.pointerId);
        }, { passive: false });

        // expose swipeMode to the placement scope by wiring into the existing swipe placement handling:
        // (the pointermove placement logic already checks `swipeMode` and `activeToolIndex === 0` in this scope)

        bottomBox.appendChild(swipeBtn);

        // --- Drag/Place Logic ---
        (function enableCPageDrag() {
            let isDragging = false;
            let dragMoved = false;
            let lastX = 0;
            let lastY = 0;
            let scrollX = 0;
            let scrollY = 0;
            let zoomScale = 1.0;

            const blocksLayer = document.createElement('div');
            blocksLayer.style.position = 'absolute';
            blocksLayer.style.inset = '0';
            blocksLayer.style.pointerEvents = 'none';
            blocksLayer.style.zIndex = '9'; 
            blocksLayer.style.transformOrigin = '0 0';
            cOverlay.appendChild(blocksLayer);

            let lastPlacedBlock = null;

            // Undo/Redo stacks
            const undoStack = [];
            const redoStack = [];

            function placeBlock(worldX, worldY) {
                const snappedX = Math.floor(worldX / 60) * 60;
                const snappedY = Math.floor(worldY / 60) * 60;

                const block = document.createElement('img');
                block.src = '/GeometryDashingBlock.png';
                block.className = 'placed-block';
                block.style.transform = `translate(${snappedX}px, ${snappedY}px)`;
                
                // Highlight styles
                block.style.filter = 'none';
                block.style.outline = '4px solid #43E179';
                block.style.outlineOffset = '-4px';
                block.style.borderRadius = '1px';
                
                if (lastPlacedBlock) {
                    lastPlacedBlock.style.outline = 'none';
                }
                
                blocksLayer.appendChild(block);
                lastPlacedBlock = block;

                undoStack.push({
                    node: block,
                    snappedX: snappedX,
                    snappedY: snappedY,
                    width: 60, height: 60,
                    outline: '4px solid #43E179',
                    outlineOffset: '-4px'
                });
                redoStack.length = 0;
                refreshUndoRedoUI();
            }

            const bgParallax = 0.08;
            const MAX_SCROLL = 5000; 
            const zoomSteps = (function() {
                const outS = 10, inS = 30;
                const steps = [];
                for (let i = outS; i >= 1; i--) steps.push(1.0 - 0.9 * Math.pow(i / outS, 1.8));
                steps.push(1.0); 
                for (let i = 1; i <= inS; i++) steps.push(1.0 + 3.0 * Math.pow(i / inS, 0.5));
                return steps.sort((a,b) => a-b);
            })();

            function isPaused() {
                return !!cOverlay.querySelector('.placeholder-popup-overlay');
            }

            function setPositions() {
                const effectiveBgScale = (Math.max(0.65, 0.45 + (zoomScale * 0.55))) * 0.6;
                const bgOffsetX = -scrollX * bgParallax;
                const bgOffsetY = scrollY * bgParallax;
                
                bgImg.style.transform = `translate(-50%, -50%) translate(${bgOffsetX}px, ${bgOffsetY}px) scale(${effectiveBgScale}) translateZ(0)`;
                
                groundDiv.style.backgroundSize = `auto 100%`;
                groundDiv.style.backgroundPosition = `${-scrollX}px center`;
                
                const worldY = scrollY;
                const groundHeightPercent = 35 * zoomScale;
                groundDiv.style.height = `${groundHeightPercent}%`;
                groundDiv.style.transform = `translateY(${worldY}px)`;
                
                const groundLineTopPercent = (100 - groundHeightPercent);
                lineImg.style.top = `${groundLineTopPercent}%`;
                lineImg.style.transform = `translate(-50%, -50%) translateY(${worldY}px) scale(${zoomScale})`;

                const cellSize = 60 * zoomScale;
                const groundLineYInPixels = (groundLineTopPercent / 100) * window.innerHeight;
                gridLayer.style.backgroundSize = `${cellSize}px ${cellSize}px`;
                gridLayer.style.backgroundPosition = `${-scrollX}px ${scrollY + groundLineYInPixels}px`;

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

            // simple swipe-placement throttling state
            let _lastSwipePlace = null;
            const _swipeMinDist = 36; // px in world space to require between placed blocks

            cOverlay.addEventListener('pointermove', (e) => {
                if (!isDragging || isPaused()) return;
                const dx = e.clientX - lastX;
                const dy = e.clientY - lastY;
                if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMoved = true;
                lastX = e.clientX;
                lastY = e.clientY;

                // Only pan camera when swipe mode is OFF; when swipe mode is ON, block panning but still update visuals.
                if (!swipeMode) {
                    scrollX = Math.max(-MAX_SCROLL, Math.min(MAX_SCROLL, scrollX - dx));
                    scrollY = Math.max(-MAX_SCROLL, Math.min(MAX_SCROLL, scrollY + dy));
                }
                setPositions();

                // If swipe mode is on and the currently active tool is the block tool (index 0),
                // place blocks along the swipe path. Convert screen->world coordinates and throttle.
                try {
                    if (swipeMode && activeToolIndex === 0) {
                        const rect = cOverlay.getBoundingClientRect();
                        const screenX = e.clientX - rect.left;
                        const screenY = e.clientY - rect.top;
                        const groundLineTopPercent = (100 - (35 * zoomScale));
                        const groundLineYInPixels = (groundLineTopPercent / 100) * window.innerHeight;

                        const worldX = (screenX + scrollX) / zoomScale;
                        const worldY = (screenY - scrollY - groundLineYInPixels) / zoomScale;

                        // determine discrete snapped cell for this point
                        const snappedX = Math.floor(worldX / 60) * 60;
                        const snappedY = Math.floor(worldY / 60) * 60;

                        // If no last swipe place or far enough, place
                        if (!_lastSwipePlace || Math.hypot(snappedX - _lastSwipePlace.x, snappedY - _lastSwipePlace.y) >= _swipeMinDist) {
                            placeBlock(worldX, worldY);
                            _lastSwipePlace = { x: snappedX, y: snappedY };
                        }
                    }
                } catch (err) {
                    // Prevent any runtime error from breaking pointermove loop
                    console.error(err);
                }
            }, { passive: true });

            function endDrag(e) {
                if (!isDragging) return;
                
                if (!dragMoved && typeof extraBtnSelected !== 'undefined' && extraBtnSelected) {
                    const rect = cOverlay.getBoundingClientRect();
                    const screenX = e.clientX - rect.left;
                    const screenY = e.clientY - rect.top;

                    const groundLineTopPercent = (100 - (35 * zoomScale));
                    const groundLineYInPixels = (groundLineTopPercent / 100) * window.innerHeight;

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
                    const direction = e.deltaY > 0 ? -1 : 1;
                    let currentIndex = zoomSteps.indexOf(zoomScale);
                    if (currentIndex === -1) {
                        currentIndex = zoomSteps.reduce((prev, curr, idx) => 
                            Math.abs(curr - zoomScale) < Math.abs(zoomSteps[prev] - zoomScale) ? idx : prev, 0);
                    }
                    const nextIndex = Math.max(0, Math.min(zoomSteps.length - 1, currentIndex + direction));
                    zoomScale = zoomSteps[nextIndex];
                    setPositions();
                } else {
                    scrollX = Math.max(-MAX_SCROLL, Math.min(MAX_SCROLL, scrollX + e.deltaX));
                    scrollY = Math.max(-MAX_SCROLL, Math.min(MAX_SCROLL, scrollY + e.deltaY));
                    setPositions();
                }
                e.preventDefault();
            }, { passive: false });

            // Create Zoom & Undo/Redo Buttons
            (function createEditorUIButtons() {
                const btnStyle = {
                    position: 'absolute', left: '14px', width: '64px', height: 'auto',
                    cursor: 'pointer', zIndex: '30011', userSelect: 'none', WebkitUserDrag: 'none'
                };

                const playSong = document.createElement('img');
                playSong.src = '/Playsong.png';
                playSong.draggable = false;
                Object.assign(playSong.style, btnStyle);
                playSong.style.width = '100px'; playSong.style.height = '100px';
                playSong.style.left = '17px'; playSong.style.top = 'calc(15% - 16px)';
                cOverlay.appendChild(playSong);

                const playLevel = document.createElement('img');
                playLevel.src = '/Playlevel.png';
                playLevel.draggable = false;
                Object.assign(playLevel.style, btnStyle);
                playLevel.style.width = '100px'; playLevel.style.height = '100px';
                playLevel.style.left = '17px'; playLevel.style.top = 'calc(29% - 16px)';
                cOverlay.appendChild(playLevel);

                const zoomIn = document.createElement('img');
                zoomIn.src = '/zoomin.png';
                zoomIn.draggable = false;
                Object.assign(zoomIn.style, btnStyle);
                zoomIn.style.width = '70px'; zoomIn.style.height = '70px';
                zoomIn.style.top = 'calc(43% - 16px)'; zoomIn.style.left = '30.5px';
                cOverlay.appendChild(zoomIn);

                const zoomOut = document.createElement('img');
                zoomOut.src = '/zoomout.png';
                zoomOut.draggable = false;
                Object.assign(zoomOut.style, btnStyle);
                zoomOut.style.width = '70px'; zoomOut.style.height = '70px';
                zoomOut.style.left = '30.5px'; zoomOut.style.top = 'calc(52% - 16px)';
                cOverlay.appendChild(zoomOut);

                const redoBtn = document.createElement('img');
                redoBtn.src = '/Undoredo.png';
                redoBtn.draggable = false;
                Object.assign(redoBtn.style, btnStyle);
                redoBtn.style.width = '95px'; redoBtn.style.height = '95px';
                redoBtn.style.top = '6px'; redoBtn.style.left = '17px';
                redoBtn.style.transform = 'scaleX(-1)';
                redoBtn.style.opacity = '0.5';

                const redoBtn2 = document.createElement('img');
                redoBtn2.src = '/Undoredo.png';
                redoBtn2.draggable = false;
                Object.assign(redoBtn2.style, btnStyle);
                redoBtn2.style.width = '95px'; redoBtn2.style.height = '95px';
                redoBtn2.style.top = '6px';
                redoBtn2.style.left = 'calc(17px + 30px + 100px - 5px)';
                redoBtn2.style.opacity = '0.5';

                cOverlay.appendChild(redoBtn);
                cOverlay.appendChild(redoBtn2);

                function stepZoom(delta) {
                    let currentIndex = zoomSteps.indexOf(zoomScale);
                    if (currentIndex === -1) {
                        currentIndex = zoomSteps.reduce((prev, curr, idx) => 
                            Math.abs(curr - zoomScale) < Math.abs(zoomSteps[prev] - zoomScale) ? idx : prev, 0);
                    }
                    const nextIndex = Math.max(0, Math.min(zoomSteps.length - 1, currentIndex + delta));
                    if (nextIndex === currentIndex) return;
                    zoomScale = zoomSteps[nextIndex];
                    setPositions();
                }

                // Spring animators for side buttons
                const playSongAnim = window.createSpringAnimator(playSong, { grow: 1.12, stiffness: 1400 });
                const playAnim = window.createSpringAnimator(playLevel, { grow: 1.12, stiffness: 1400 });
                const inAnim = window.createSpringAnimator(zoomIn, { grow: 1.12, stiffness: 1400 });
                const outAnim = window.createSpringAnimator(zoomOut, { grow: 1.12, stiffness: 1400 });
                const redoAnim = window.createSpringAnimator(redoBtn, { grow: 1.15, stiffness: 1400, baseTransform: 'scaleX(-1)' });
                const redoAnim2 = window.createSpringAnimator(redoBtn2, { grow: 1.15, stiffness: 1400 });

                playSong.addEventListener('pointerdown', (e) => { playSongAnim.press(); });
                playSong.addEventListener('pointerup', (e) => { playSongAnim.release(); });
                
                playLevel.addEventListener('pointerdown', (e) => { playAnim.press(); });
                playLevel.addEventListener('pointerup', (e) => { playAnim.release(); });

                zoomIn.addEventListener('pointerdown', (e) => { inAnim.press(); });
                zoomIn.addEventListener('pointerup', (e) => { inAnim.release(); stepZoom(1); });

                zoomOut.addEventListener('pointerdown', (e) => { outAnim.press(); });
                zoomOut.addEventListener('pointerup', (e) => { outAnim.release(); stepZoom(-1); });

                // UNDO
                redoBtn.addEventListener('pointerdown', (e) => { redoAnim.press(); });
                redoBtn.addEventListener('pointerup', (e) => { 
                    redoAnim.release(); 
                    if (!undoStack.length) return;
                    const last = undoStack.pop();
                    if (last.node && last.node.parentNode) last.node.parentNode.removeChild(last.node);
                    redoStack.push({
                        snappedX: last.snappedX, snappedY: last.snappedY,
                        width: last.width, height: last.height,
                        outline: last.outline, outlineOffset: last.outlineOffset
                    });
                    if (undoStack.length) {
                        const newLast = undoStack[undoStack.length - 1];
                        lastPlacedBlock = newLast ? newLast.node : null;
                        if (lastPlacedBlock) {
                            lastPlacedBlock.style.outline = '#43E179 solid 4px';
                            lastPlacedBlock.style.outlineOffset = '-4px';
                        }
                    } else {
                        lastPlacedBlock = null;
                    }
                    refreshUndoRedoUI();
                });

                // REDO
                redoBtn2.addEventListener('pointerdown', (e) => { redoAnim2.press(); });
                redoBtn2.addEventListener('pointerup', (e) => { 
                    redoAnim2.release();
                    if (!redoStack.length) return;
                    const item = redoStack.pop();
                    const recreated = document.createElement('img');
                    recreated.src = '/GeometryDashingBlock.png';
                    recreated.className = 'placed-block';
                    recreated.style.width = (item.width || 60) + 'px';
                    recreated.style.height = (item.height || 60) + 'px';
                    recreated.style.transform = `translate(${item.snappedX}px, ${item.snappedY}px)`;
                    recreated.style.outline = item.outline || 'none';
                    recreated.style.outlineOffset = item.outlineOffset || '0px';
                    blocksLayer.appendChild(recreated);
                    
                    undoStack.push({
                        node: recreated, snappedX: item.snappedX, snappedY: item.snappedY,
                        width: item.width || 60, height: item.height || 60,
                        outline: item.outline || 'none', outlineOffset: item.outlineOffset || '0px'
                    });

                    if (lastPlacedBlock && lastPlacedBlock !== recreated) lastPlacedBlock.style.outline = 'none';
                    lastPlacedBlock = recreated;
                    lastPlacedBlock.style.outline = '4px solid #43E179';
                    lastPlacedBlock.style.outlineOffset = '-4px';
                    refreshUndoRedoUI();
                });

                window.refreshUndoRedoUI = function() {
                    redoBtn.style.opacity = undoStack.length ? '1' : '0.5';
                    redoBtn2.style.opacity = redoStack.length ? '1' : '0.5';
                }
            })();

            setPositions();
        })();

        // Exit Logic
        const exitToLevelMenu = () => {
            const blackFade = createOverlay('black');
            blackFade.style.opacity = '1';
            setTimeout(() => {
                if (cOverlay && cOverlay.parentNode) cOverlay.remove();
                fadeMenuMusicIn();
                requestAnimationFrame(() => { blackFade.style.opacity = '0'; });
                setTimeout(() => blackFade.remove(), 250);
            }, 220);
        };

        const pauseBtn = document.createElement('img');
        pauseBtn.src = '/editorpausebutton.png';
        pauseBtn.className = 'gd-button editor-pause-btn';
        pauseBtn.style.right = '6px';
        cOverlay.appendChild(pauseBtn);

        const editorSettingsBtn = document.createElement('img');
        editorSettingsBtn.src = '/settings2.png';
        editorSettingsBtn.className = 'gd-button editor-settings-btn';
        editorSettingsBtn.style.right = '131px'; 
        cOverlay.appendChild(editorSettingsBtn);

        [pauseBtn, editorSettingsBtn].forEach(btn => {
            const animator = window.createSpringAnimator(btn, { grow: 1.15, stiffness: 1400 });
            btn.addEventListener('pointerdown', (e) => { animator.press(); });
            btn.addEventListener('pointerup', (e) => { animator.release(); });
        });

        // Pause menu click
        pauseBtn.addEventListener('click', () => {
            const menuOverlay = document.createElement('div');
            menuOverlay.className = 'placeholder-popup-overlay';
            menuOverlay.style.display = 'flex';
            menuOverlay.style.flexDirection = 'column';
            menuOverlay.style.alignItems = 'center';
            menuOverlay.style.gap = '35px'; 
            menuOverlay.style.zIndex = '40000';
            
            const resumeBtn = document.createElement('div');
            resumeBtn.className = 'popup-ok-btn gd-button resume-btn-large';
            resumeBtn.innerHTML = '<span class="gd-gradient-text resume-text-large">Resume</span>';

            const exitBtn = document.createElement('div');
            exitBtn.className = 'popup-ok-btn gd-button resume-btn-large';
            exitBtn.innerHTML = '<span class="gd-gradient-text resume-text-large">Exit</span>';

            [resumeBtn, exitBtn].forEach(btn => {
                const anim = window.createSpringAnimator(btn, { grow: 1.1 });
                btn.addEventListener('pointerdown', () => anim.press());
                btn.addEventListener('pointerup', () => { anim.release(); });
            });

            resumeBtn.addEventListener('click', () => menuOverlay.remove());
            exitBtn.addEventListener('click', () => {
                menuOverlay.remove();
                exitToLevelMenu();
            });

            menuOverlay.appendChild(resumeBtn);
            menuOverlay.appendChild(exitBtn);
            cOverlay.appendChild(menuOverlay);
            requestAnimationFrame(() => menuOverlay.style.opacity = '1');
        });

        requestAnimationFrame(() => {
            black.style.opacity = '0';
        });
        setTimeout(() => { black.remove(); }, 250);

    }, 200);
}