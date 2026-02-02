
// Home Screen Drag & Drop Support
const HOME_ORDER_KEY = 'home_items_order';

function initHomeDragSupport() {
    const container = document.getElementById('home-sortable-wrapper');
    if (!container) return; // Not on home or wrapper missing

    // Load saved order immediately
    loadHomeOrder(container);

    let draggedElement = null;
    let clone = null;
    let longPressTimer = null;
    let isDragging = false;
    let startY = 0;
    let currentY = 0;

    // Touch Events
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    // Mouse Events (for desktop testing)
    container.addEventListener('mousedown', handleMouseDown);

    function handleTouchStart(e) {
        // Ignore if clicking a button or interactable
        if (e.target.closest('button') || e.target.closest('.btn-icon')) return;

        const target = e.target.closest('[data-home-id]');
        if (!target) return;

        startY = e.touches[0].clientY;

        // Start Long Press Timer
        longPressTimer = setTimeout(() => {
            startDrag(target, startY);
        }, 500); // 500ms long press to activate
    }

    function handleTouchMove(e) {
        if (isDragging) {
            e.preventDefault(); // Prevent scrolling
            currentY = e.touches[0].clientY;
            updateDragPosition();
        } else {
            // If user moves finger before timer ends, cancel long press
            const moveY = e.touches[0].clientY;
            if (Math.abs(moveY - startY) > 10) {
                clearTimeout(longPressTimer);
            }
        }
    }

    function handleTouchEnd() {
        clearTimeout(longPressTimer);
        if (isDragging) endDrag();
    }

    /* --- Mouse Fallback (Immediate drag for simplicity) --- */
    function handleMouseDown(e) {
        if (e.target.closest('button')) return;
        const target = e.target.closest('[data-home-id]');
        if (!target) return;

        // For mouse, we can maybe require long press too? 
        // Or just drag immediately. Let's stick to long press for consistency 
        // or immediate drag if using a "handle". 
        // Since no handle, let's use long press for mouse too to avoid accidents.

        startY = e.clientY;
        longPressTimer = setTimeout(() => {
            startDrag(target, startY);
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }, 500);
    }

    function handleMouseMove(e) {
        if (isDragging) {
            e.preventDefault();
            currentY = e.clientY;
            updateDragPosition();
        }
    }

    function handleMouseUp() {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        if (isDragging) endDrag();
        clearTimeout(longPressTimer);
    }


    /* --- Core Drag Logic --- */

    function startDrag(target, initialY) {
        isDragging = true;
        draggedElement = target;
        currentY = initialY;

        // Visual Feedback
        if (navigator.vibrate) navigator.vibrate(50);
        draggedElement.classList.add('home-dragging');

        // Create Clone
        clone = target.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.top = (target.getBoundingClientRect().top) + 'px';
        clone.style.left = (target.getBoundingClientRect().left) + 'px';
        clone.style.width = (target.getBoundingClientRect().width) + 'px';
        clone.style.zIndex = '9999';
        clone.style.opacity = '0.9';
        clone.style.pointerEvents = 'none';
        clone.classList.add('home-dragging-clone');
        document.body.appendChild(clone);

        // Hide original slightly
        target.style.opacity = '0';
    }

    function updateDragPosition() {
        if (!clone || !draggedElement) return;

        // Move clone
        const offset = currentY - startY;
        const initialTop = draggedElement.getBoundingClientRect().top;
        // Actually, just follow pointer
        // Better: Center clone on pointer? Or keep relative offset?
        // Let's keep relative for now, but simplified:
        clone.style.top = (currentY - (draggedElement.offsetHeight / 2)) + 'px';

        // Reordering Logic
        const afterElement = getDragAfterElement(container, currentY);
        if (afterElement == null) {
            container.appendChild(draggedElement);
        } else {
            container.insertBefore(draggedElement, afterElement);
        }
    }

    function endDrag() {
        isDragging = false;

        if (draggedElement) {
            draggedElement.classList.remove('home-dragging');
            draggedElement.style.opacity = '1';
            saveHomeOrder(container);
        }

        if (clone) {
            clone.remove();
            clone = null;
        }

        draggedElement = null;
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('[data-home-id]:not(.home-dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function saveHomeOrder(container) {
        const items = [...container.querySelectorAll('[data-home-id]')];
        const order = items.map(item => item.getAttribute('data-home-id'));
        localStorage.setItem(HOME_ORDER_KEY, JSON.stringify(order));
        console.log("Home order saved:", order);
    }

    function loadHomeOrder(container) {
        const savedOrder = localStorage.getItem(HOME_ORDER_KEY);
        if (!savedOrder) return;

        try {
            const order = JSON.parse(savedOrder);
            const itemsMap = {};
            [...container.children].forEach(child => {
                if (child.hasAttribute('data-home-id')) {
                    itemsMap[child.getAttribute('data-home-id')] = child;
                }
            });

            // Reorder based on saved keys
            order.forEach(id => {
                const el = itemsMap[id];
                if (el) {
                    container.appendChild(el);
                }
            });
        } catch (e) {
            console.error("Error loading home order", e);
        }
    }
}

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomeDragSupport);
} else {
    initHomeDragSupport();
}
