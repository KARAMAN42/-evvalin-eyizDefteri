// ACIL FIX - Splash Screen Sayaç ve Dismiss Düzeltme
// Bu script splash ekran geri sayımlarını ve dismiss fonksiyonunu başlatır

console.log("🔧 Splash sayaç ve dismiss acil düzeltme başlatıldı");

// Wait for page to load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSplashFunctions);
} else {
    initSplashFunctions();
}

function initSplashFunctions() {
    console.log("📊 Splash fonksiyonları başlatılıyor...");

    // Get splash element
    const splash = document.getElementById('splash-screen');
    if (!splash) {
        console.error("❌ Splash ekran elementi bulunamadı!");
        return;
    }

    // 1. Initialize Countdown
    initCountdown();

    // 2. Add Dismiss Handlers
    addDismissHandlers(splash);
}

function initCountdown() {
    console.log("⏰ Geri sayım başlatılıyor...");

    // Default dates
    const nisanDate = new Date('2026-10-01T00:00:00');
    const nikahDate = new Date('2027-10-01T00:00:00');
    const now = new Date();

    // Get elements
    const elNisan = document.getElementById('splash-nisan');
    const elNikah = document.getElementById('splash-nikah');

    function getDays(target) {
        const diff = target - now;
        if (diff <= 0) return "Tamamlandı ✨";
        return Math.ceil(diff / (1000 * 60 * 60 * 24)) + " Gün";
    }

    if (elNisan) {
        const days = getDays(nisanDate);
        elNisan.textContent = days;
        console.log("✓ Nişan sayacı güncellendi:", days);
    }

    if (elNikah) {
        const days = getDays(nikahDate);
        elNikah.textContent = days;
        console.log("✓ Nikah sayacı güncellendi:", days);
    }
}

function addDismissHandlers(splash) {
    console.log("👆 Dismiss event'leri ekleniyor...");

    let isDismissed = false;

    // Dismiss function
    function dismissSplash() {
        if (isDismissed) return;
        isDismissed = true;

        console.log("👋 Splash ekran kapatılıyor...");

        // Animate out
        splash.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.6s ease';
        splash.style.transform = 'translateY(-100%)';
        splash.style.opacity = '0';

        setTimeout(() => {
            splash.style.display = 'none';
            console.log("✓ Splash ekran kapatıldı!");
        }, 650);
    }

    // 1. Click Anywhere (except dark mode button)
    splash.addEventListener('click', (e) => {
        // Ignore clicks on theme toggle button
        if (e.target.closest('#splash-theme-toggle')) {
            console.log("Theme butonuna tıklandı, splash kapatılmıyor");
            return;
        }
        console.log("✓ Splash'e tıklandı, kapatılıyor...");
        dismissSplash();
    });

    // 2. Swipe Up (Touch)
    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    splash.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        isDragging = true;
        splash.style.transition = 'none';
    }, { passive: true });

    splash.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentY = e.touches[0].clientY;
        const diffY = currentY - startY;

        // Only allow upward movement
        if (diffY < 0) {
            splash.style.transform = `translateY(${diffY}px)`;
        }
    }, { passive: true });

    splash.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;

        const endY = e.changedTouches[0].clientY;
        const diffY = endY - startY;

        splash.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';

        if (diffY < -100) {
            console.log("✓ Yukarı kaydırıldı, splash kapatılıyor...");
            dismissSplash();
        } else {
            // Snap back
            splash.style.transform = 'translateY(0)';
        }
    });

    // 3. Auto-dismiss after 15 seconds (fallback)
    setTimeout(() => {
        if (!isDismissed) {
            console.log("⏰ 15 saniye doldu, otomatik kapatılıyor...");
            dismissSplash();
        }
    }, 15000);

    console.log("✓ Dismiss event'leri eklendi (tıklama, kaydırma, otomatik)");
}

// Theme Toggle Function for Splash Screen
window.toggleTheme = function () {
    console.log("🌓 Tema değiştiriliyor...");
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark ? '1' : '0');

    // Update button icon
    const splashBtn = document.getElementById('splash-theme-toggle');
    const headerBtn = document.getElementById('btn-dark-mode-toggle');

    if (splashBtn) {
        const icon = splashBtn.querySelector('i');
        if (icon) {
            icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    if (headerBtn) {
        const icon = headerBtn.querySelector('i');
        if (icon) {
            icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    console.log(`✓ Tema: ${isDark ? 'Karanlık' : 'Aydınlık'}`);
};

// Initialize theme on load
(function () {
    const isDark = localStorage.getItem('darkMode') === '1';
    if (isDark) {
        document.body.classList.add('dark-mode');
        const splashBtn = document.getElementById('splash-theme-toggle');
        if (splashBtn) {
            const icon = splashBtn.querySelector('i');
            if (icon) icon.className = 'fas fa-sun';
        }
    }
})();

console.log("✓ Splash düzeltme scripti yüklendi");
