console.log("APP LOADED - Şevval Theme Mode");

document.addEventListener('DOMContentLoaded', () => {
    // EMERGENCY SPLASH DISMISS - Ensure user can ALWAYS get past splash
    const emergencySplash = document.getElementById('splash-screen');
    if (emergencySplash) {
        emergencySplash.addEventListener('click', (e) => {
            if (e.target.closest('#splash-theme-toggle')) return;
            console.log("Emergency splash dismiss triggered");
            emergencySplash.classList.add('hidden');
            emergencySplash.style.transform = 'translateY(-100%)';
            setTimeout(() => { emergencySplash.style.display = 'none'; }, 600);
        }, { once: true });
    }

    // --- Data & State ---
    const STORAGE_KEY = 'ceyiz_data_v2';
    const STORAGE_CATS_KEY = 'ceyiz_cats_v1';
    const STORAGE_SETTINGS_KEY = 'ceyiz_settings_v1';
    const STORAGE_WELCOME_KEY = 'ceyiz_welcome_shown_v1';

    // Default Categories
    const defaultCategories = {
        ceyiz: ['Mutfak', 'Yatak Odası', 'Banyo', 'Salon', 'Elektronik', 'Diğer'],
        damat: ['Giyim', 'Kişisel Bakım', 'Aksesuar', 'Diğer']
    };

    // --- Image Compression Helper ---
    function resizeImage(file, maxWidth = 800, quality = 0.7) {
        return new Promise((resolve, reject) => {
            console.log("Resizing image:", file.name);
            const reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = (event) => {
                const img = new Image();

                // DÜZELTME: onload event listener'ı src atanmadan önce tanımlanmalı!
                img.onload = () => {
                    console.log("Image loaded for resizing:", img.width, "x", img.height);
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = Math.round(height * (maxWidth / width));
                        width = maxWidth;
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const dataURL = canvas.toDataURL('image/jpeg', quality);
                    console.log("Resizing complete, data URL generated.");
                    resolve(dataURL);
                };

                img.onerror = (err) => {
                    console.error("Image load error:", err);
                    reject(err);
                };
                img.src = event.target.result;
            };

            reader.onerror = (err) => {
                console.error("FileReader error:", err);
                reject(err);
            };
        });
    }

    let userCategories = {
        ceyiz: [],
        damat: []
    };

    let items = [];
    let lastSelectedCategory = '';
    let pendingDeleteItem = null;
    let undoTimeout = null;
    let currentTab = 'home'; // Start on home screen
    const tabOrder = ['home', 'ceyiz', 'damat', 'stats']; // Global Tab Order

    let settings = {
        darkMode: false,
        name: 'Şevval',
        partnerName: 'Yusuf',
        dates: { engagement: '2026-10-01', wedding: '2027-10-01' },
        appearance: { fontSize: 'normal', animations: true, background: 'default' },
        feedback: '',
        monthlyBudget: 0,
        budget: 0,
        budgetLastUpdated: null,
        syncCode: '',
        customEvents: {}
    };

    // Make variables globally accessible
    window.appData = {
        get userCategories() { return userCategories; },
        set userCategories(val) { userCategories = val; },
        get defaultCategories() { return defaultCategories; },
        get currentTab() { return currentTab; },
        set currentTab(val) { currentTab = val; },
        get items() { return items; },
        set items(val) { items = val; },
        get settings() { return settings; },
        set settings(val) { settings = val; },
        saveCategories: null,
        renderCategoryManager: null,
        updateAllCategoryDropdowns: null
    };
