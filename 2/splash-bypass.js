// ULTRA ACİL SPLASH BYPASS - İlk satır olarak çalışır
(function () {
    console.log("🚨 ACİL SPLASH BYPASS AKTİF");

    // Sayfa yüklenir yüklenmez splash'i kaldır
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', removeSplash);
    } else {
        removeSplash();
    }

    function removeSplash() {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            console.log("✓ Splash ekran kaldırılıyor...");
            splash.style.display = 'none';
            splash.remove();
            console.log("✓ Splash ekran kaldırıldı!");
        }
    }

    // Yedek: 100ms sonra tekrar dene
    setTimeout(removeSplash, 100);
    // Yedek 2: 500ms sonra tekrar dene
    setTimeout(removeSplash, 500);
})();
