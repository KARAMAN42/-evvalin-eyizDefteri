
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
            dragAvatar.classList.remove('is-being-dragged'); // Ensure avatar is solid
            dragAvatar.classList.add('drag-avatar');
            dragAvatar.style.position = 'fixed';
            dragAvatar.style.top = rect.top + 'px';
            dragAvatar.style.left = rect.left + 'px';
            dragAvatar.style.width = rect.width + 'px';
            dragAvatar.style.height = rect.height + 'px';
            dragAvatar.style.zIndex = '10001';
            dragAvatar.style.pointerEvents = 'none';
            dragAvatar.style.opacity = '1';
            dragAvatar.style.boxShadow = '0 20px 50px rgba(0,0,0,0.3)';
            dragAvatar.style.transform = 'scale(1.05)';
            dragAvatar.style.transition = 'transform 0.1s ease';

            // Offset for exact finger grab point
            dragAvatar.dataset.touchOffsetY = touch.clientY - rect.top;

            document.body.appendChild(dragAvatar);
        }

        function handleTouchMove(e) {
            if (!dragAvatar) return;
            e.preventDefault();

            const touch = e.touches[0];
            const clientX = touch.clientX;
            const clientY = touch.clientY;

            // 1. Move Avatar
            const offsetY = parseFloat(dragAvatar.dataset.touchOffsetY);
            dragAvatar.style.top = (clientY - offsetY) + 'px';

            // 2. Real-time DOM Swapping with FLIP
            const target = document.elementFromPoint(clientX, clientY);
            if (target) {
                const targetCard = target.closest('.item-card');

                if (targetCard && targetCard !== draggedItem && targetCard.parentElement === itemContainer) {
                    // Start FLIP
                    const cards = Array.from(itemContainer.children).filter(el => el.classList.contains('item-card'));
                    const rects = new Map(cards.map(c => [c, c.getBoundingClientRect()]));

                    // Swap in DOM
                    const isAfter = targetCard.compareDocumentPosition(draggedItem) & Node.DOCUMENT_POSITION_PRECEDING;
                    if (isAfter) {
                        itemContainer.insertBefore(draggedItem, targetCard.nextSibling);
                    } else {
                        itemContainer.insertBefore(draggedItem, targetCard);
                    }

                    // Complete FLIP: Animate the others
                    const newCards = Array.from(itemContainer.children).filter(el => el.classList.contains('item-card'));
                    newCards.forEach(c => {
                        if (c === draggedItem) return; // Don't animate the invisible one

                        const oldRect = rects.get(c);
                        const newRect = c.getBoundingClientRect();
                        const dy = oldRect.top - newRect.top;

                        if (dy !== 0) {
                            c.style.transition = 'none';
                            c.style.transform = `translateY(${dy}px)`;
                            c.offsetHeight; // trigger reflow
                            c.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
                            c.style.transform = 'translateY(0)';
                        }
                    });

                    if (navigator.vibrate) navigator.vibrate(5);
                }
            }

            // 3. Handle Auto-Scroll
            handleAutoScroll(clientY);
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

            // Item is already in its final DOM position due to real-time swapping
            const event = new CustomEvent('itemsReordered', {
                detail: { containerId: itemContainer.id }
            });
            itemContainer.dispatchEvent(event);

            if (dragAvatar) dragAvatar.remove();
            if (draggedItem) {
                draggedItem.classList.remove('is-being-dragged');
                draggedItem.style.opacity = '';
                draggedItem.style.visibility = '';
            }

            dragAvatar = null;
            draggedItem = null;

            // Clear any lingering transforms
            Array.from(itemContainer.children).forEach(item => {
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
