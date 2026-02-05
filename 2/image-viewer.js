
// ========================================
// Image Viewer Carousel Logic
// ========================================

(function () {
    let currentImages = [];
    let currentImageIndex = 0;
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    const modal = document.getElementById('modal-image-viewer');
    const track = document.getElementById('image-viewer-track');
    const prevBtn = document.getElementById('image-viewer-prev');
    const nextBtn = document.getElementById('image-viewer-next');
    const closeBtn = document.getElementById('close-image-viewer');
    const counterEl = document.getElementById('image-viewer-counter');
    const currentIndexEl = document.getElementById('current-image-index');
    const totalImagesEl = document.getElementById('total-images');
    const dotsContainer = document.getElementById('image-viewer-dots');

    // Open image viewer with array of images
    window.viewImage = function (imageUrl, allImages = null) {
        if (!modal || !track) return;

        // If allImages is provided (array), use it; otherwise use single image
        if (allImages && Array.isArray(allImages) && allImages.length > 0) {
            currentImages = allImages;
            // Find starting index
            const foundIndex = currentImages.indexOf(imageUrl);
            currentImageIndex = foundIndex >= 0 ? foundIndex : 0;
        } else {
            // Single image fallback
            currentImages = [imageUrl];
            currentImageIndex = 0;
        }

        console.log('📸 Image Viewer Opened:', {
            totalImages: currentImages.length,
            startingIndex: currentImageIndex,
            images: currentImages
        });

        renderImageViewer();
        updateNavigation();
        modal.classList.remove('hidden');
        requestAnimationFrame(() => modal.classList.add('active'));
        document.body.classList.add('modal-open');
    };

    function renderImageViewer() {
        if (!track) return;

        // Clear track
        track.innerHTML = '';

        // Create slides
        currentImages.forEach((imgSrc, index) => {
            const slide = document.createElement('div');
            slide.className = 'image-viewer-slide';

            const img = document.createElement('img');
            img.src = imgSrc;
            img.alt = `Fotoğraf ${index + 1}`;

            slide.appendChild(img);
            track.appendChild(slide);
        });

        // Update counter
        if (totalImagesEl) totalImagesEl.textContent = currentImages.length;

        // Render dots
        renderDots();

        // Set initial position
        goToImage(currentImageIndex);
    }

    function renderDots() {
        if (!dotsContainer) return;

        dotsContainer.innerHTML = '';

        // Only show dots if more than 1 image
        if (currentImages.length <= 1) {
            dotsContainer.style.display = 'none';
            return;
        }

        dotsContainer.style.display = 'flex';

        currentImages.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = 'image-viewer-dot';
            if (index === currentImageIndex) {
                dot.classList.add('active');
            }

            dot.addEventListener('click', () => {
                goToImage(index);
            });

            dotsContainer.appendChild(dot);
        });
    }

    function goToImage(index) {
        if (!track) return;

        currentImageIndex = index;
        const offset = -index * 100;
        track.style.transform = `translateX(${offset}%)`;

        if (currentIndexEl) currentIndexEl.textContent = index + 1;

        updateNavigation();
        updateDots();
    }

    function updateNavigation() {
        if (prevBtn) {
            prevBtn.disabled = currentImageIndex === 0;
            prevBtn.style.display = currentImages.length > 1 ? 'flex' : 'none';
        }
        if (nextBtn) {
            nextBtn.disabled = currentImageIndex === currentImages.length - 1;
            nextBtn.style.display = currentImages.length > 1 ? 'flex' : 'none';
        }

        // Hide counter if only 1 image
        if (counterEl) {
            counterEl.style.display = currentImages.length > 1 ? 'block' : 'none';
        }
    }

    function updateDots() {
        const dots = dotsContainer?.querySelectorAll('.image-viewer-dot');
        if (!dots) return;

        dots.forEach((dot, index) => {
            if (index === currentImageIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    function closeViewer() {
        if (!modal) return;

        modal.classList.remove('active');
        setTimeout(() => {
            modal.classList.add('hidden');
            currentImages = [];
            currentImageIndex = 0;
        }, 200);

        document.body.classList.remove('modal-open');
    }

    // Event Listeners
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentImageIndex > 0) {
                goToImage(currentImageIndex - 1);
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentImageIndex < currentImages.length - 1) {
                goToImage(currentImageIndex + 1);
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeViewer);
    }

    // Close on backdrop click
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('modal-backdrop')) {
                closeViewer();
            }
        });
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!modal || modal.classList.contains('hidden')) return;

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (currentImageIndex > 0) {
                goToImage(currentImageIndex - 1);
            }
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            if (currentImageIndex < currentImages.length - 1) {
                goToImage(currentImageIndex + 1);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closeViewer();
        }
    });

    // Touch/Swipe support
    if (track) {
        track.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
        }, { passive: true });

        track.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentX = e.touches[0].clientX;
        }, { passive: true });

        track.addEventListener('touchend', () => {
            if (!isDragging) return;
            isDragging = false;

            const deltaX = currentX - startX;

            // Swipe threshold: 50px
            if (Math.abs(deltaX) > 50) {
                if (deltaX > 0 && currentImageIndex > 0) {
                    // Swipe right -> previous
                    goToImage(currentImageIndex - 1);
                } else if (deltaX < 0 && currentImageIndex < currentImages.length - 1) {
                    // Swipe left -> next
                    goToImage(currentImageIndex + 1);
                }
            }
        });
    }

})();
