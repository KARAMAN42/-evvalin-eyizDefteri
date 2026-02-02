
// Mobile Touch Drag & Drop Support (Visual Reorder V2 - Fixed Scroll Parent)
// Implements "FLIP"-like smooth sorting + Container Auto-Scroll fixed

function addTouchDragSupport() {
    // We need to know who scrolls (Section) and who holds items (List)
    const targets = [
        {
            listId: 'ceyiz-list',
            sectionId: 'ceyiz-section'
        },
        {
            listId: 'damat-list',
            sectionId: 'damat-section'
        }
    ];

    targets.forEach(targetInfo => {
        const itemContainer = document.getElementById(targetInfo.listId);
        const scrollContainer = document.getElementById(targetInfo.sectionId);

        if (!itemContainer || !scrollContainer) return;

        // State variables
        let draggedItem = null;
        let dragAvatar = null;
        let initialIndex = -1;
        let currentIndex = -1;
        let items = [];
        let itemHeights = [];
        let itemTopOffsets = []; // Distance from top of ItemContainer

        // Auto-scroll state
        let autoScrollSpeed = 0;
        let scrollFrameId = null;

        // Use passive: true to allow scrolling to start immediately if not prevented
        // But we handle prevention via CSS touch-action: none on the handle!
        itemContainer.addEventListener('touchstart', handleTouchStart, { passive: true });

        function handleTouchStart(e) {
            // 1. Identify Target
            const handle = e.target.closest('.drag-handle');
            if (!handle) return; // Allow normal scroll if detecting content

            const card = handle.closest('.item-card');
            if (!card) return;

            // 2. Prevent Default (We are dragging now)
            // e.preventDefault(); // REMOVED: Cannot use with passive: true
            // CSS touch-action: none on handle handles the blocking for us!

            // 3. Initialize State
            draggedItem = card;
            draggedItem.classList.add('is-being-dragged');

            // Snapshot items
            items = Array.from(itemContainer.children).filter(el => el.classList.contains('item-card'));
            initialIndex = items.indexOf(draggedItem);
            currentIndex = initialIndex;

            // Cache Geometry relative to the ItemContainer (which scrolls with content)
            // But we need screen coordinates for touch comparisons.
            // Let's cache the "Offset Top" relative to container.

            // Actually, simpler: comparing rects works if we account for scroll delta?
            // Or just re-read rects on check? (expensive?)
            // "FLIP" usually caches.
            // Let's cache HEIGHTS. Re-read tops?
            // Optimised: cache tops assuming no outside layout shift.

            // To get absolute "document logic" position within the scrollable area:
            // Top = el.offsetTop
            // This is stable inside itemContainer.
            itemTopOffsets = items.map(el => el.offsetTop);
            itemHeights = items.map(el => el.offsetHeight);

            // 4. Create Avatar
            createAvatar(e.touches[0], card);

            // 5. Add Global Listeners
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', handleTouchEnd);
            document.addEventListener('touchcancel', handleTouchEnd);

            if (navigator.vibrate) navigator.vibrate(50);
        }

        function createAvatar(touch, original) {
            const rect = original.getBoundingClientRect();
            dragAvatar = original.cloneNode(true);

            dragAvatar.classList.add('drag-avatar');
            dragAvatar.style.position = 'fixed';
            dragAvatar.style.top = rect.top + 'px';
            dragAvatar.style.left = rect.left + 'px';
            dragAvatar.style.width = rect.width + 'px';
            dragAvatar.style.height = rect.height + 'px';
            dragAvatar.style.zIndex = '9999';
            dragAvatar.style.pointerEvents = 'none';

            // Offset for exact finger grab point
            dragAvatar.dataset.touchOffsetY = touch.clientY - rect.top;

            document.body.appendChild(dragAvatar);
        }

        function handleTouchMove(e) {
            if (!dragAvatar) return;
            e.preventDefault();

            const touch = e.touches[0];
            const clientY = touch.clientY;

            // 1. Move Avatar
            const offsetY = parseFloat(dragAvatar.dataset.touchOffsetY);
            dragAvatar.style.top = (clientY - offsetY) + 'px';

            // 2. Detect New Index
            const newIndex = calculateNewIndex(clientY);

            if (newIndex !== currentIndex) {
                currentIndex = newIndex;
                applyVisualTransforms();
                if (navigator.vibrate) navigator.vibrate(5);
            }

            // 3. Handle Auto-Scroll
            handleAutoScroll(clientY);
        }

        function calculateNewIndex(y) {
            // We need to map clientY (screen) to our list positions.
            // List positions move when we scroll.
            // Current Scroll Top:
            const scrollTop = scrollContainer.scrollTop;
            const containerRect = scrollContainer.getBoundingClientRect(); // visible window

            // Virtual Y position within the content = (y - containerTop) + scrollTop
            // But itemContainer might have padding/margin from Section?
            // itemContainer.offsetTop usually 0 if it's first child.
            // Let's assume itemContainer is inside scrollContainer directly.

            // Position of finger inside the "scrolled long content":
            const pointerContentY = (y - containerRect.top) + scrollTop; // Rough approx

            // Find closest item center
            let bestIndex = -1;
            let minDist = Infinity;

            items.forEach((item, index) => {
                if (index === initialIndex) return;

                // Center of item in Content Coordinates
                const itemCenterY = itemTopOffsets[index] + (itemHeights[index] / 2);

                // Compare with pointer
                const dist = Math.abs(pointerContentY - itemCenterY);
                if (dist < minDist) {
                    minDist = dist;
                    bestIndex = index;
                }
            });

            if (bestIndex === -1) return initialIndex;
            return bestIndex;
        }

        function applyVisualTransforms() {
            items.forEach((item, index) => {
                if (index === initialIndex) {
                    item.style.transform = ''; // Hide or whatever
                    return;
                }

                let transformY = 0;
                const height = itemHeights[initialIndex];

                if (currentIndex > initialIndex) {
                    if (index > initialIndex && index <= currentIndex) {
                        transformY = -height - 8;
                    }
                } else if (currentIndex < initialIndex) {
                    if (index >= currentIndex && index < initialIndex) {
                        transformY = height + 8;
                    }
                }

                item.style.transform = `translateY(${transformY}px)`;
                item.style.transition = 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)';
            });
        }

        function handleAutoScroll(y) {
            const rect = scrollContainer.getBoundingClientRect();
            const threshold = 80;
            const maxSpeed = 15;

            if (y < rect.top + threshold) {
                let intensity = (rect.top + threshold - y) / threshold;
                autoScrollSpeed = -maxSpeed * intensity;
            }
            else if (y > rect.bottom - threshold) {
                let intensity = (y - (rect.bottom - threshold)) / threshold;
                autoScrollSpeed = maxSpeed * intensity;
            }
            else {
                autoScrollSpeed = 0;
            }

            if (autoScrollSpeed !== 0 && !scrollFrameId) {
                scrollFrameId = requestAnimationFrame(autoScrollLoop);
            }
        }

        function autoScrollLoop() {
            if (autoScrollSpeed === 0) {
                scrollFrameId = null;
                return;
            }

            scrollContainer.scrollTop += autoScrollSpeed;
            scrollFrameId = requestAnimationFrame(autoScrollLoop);
        }

        function handleTouchEnd(e) {
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('touchcancel', handleTouchEnd);

            autoScrollSpeed = 0;
            if (scrollFrameId) cancelAnimationFrame(scrollFrameId);

            // Commit Change
            if (currentIndex !== initialIndex && currentIndex !== -1) {
                const targetNode = items[currentIndex];
                const originalNode = items[initialIndex];

                if (currentIndex > initialIndex) {
                    itemContainer.insertBefore(originalNode, targetNode.nextSibling);
                } else {
                    itemContainer.insertBefore(originalNode, targetNode);
                }

                const event = new CustomEvent('itemsReordered', {
                    detail: { containerId: itemContainer.id }
                });
                itemContainer.dispatchEvent(event);
            }

            if (dragAvatar) dragAvatar.remove();
            if (draggedItem) draggedItem.classList.remove('is-being-dragged');

            dragAvatar = null;
            draggedItem = null;

            items.forEach(item => {
                item.style.transform = '';
                item.style.transition = '';
            });
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addTouchDragSupport);
} else {
    addTouchDragSupport();
}
