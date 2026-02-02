console.log("APP LOADED - Şevval Theme Mode");

document.addEventListener('DOMContentLoaded', () => {

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
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
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

                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
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
        dates: { engagement: '2026-10-01', wedding: '2027-10-01' },
        appearance: { fontSize: 'normal', animations: true },
        feedback: ''
    };

    // Make variables globally accessible for addCategory function
    window.appData = {
        get userCategories() { return userCategories; },
        set userCategories(val) { userCategories = val; },
        get defaultCategories() { return defaultCategories; },
        get currentTab() { return currentTab; },
        set currentTab(val) { currentTab = val; },
        saveCategories: null, // Will be assigned later
        renderCategoryManager: null, // Will be assigned later
        updateAllCategoryDropdowns: null // Will be assigned later
    };


    /* --- Interactive Daily Quote --- */
    function setupDailyQuote() {
        const quoteWidget = document.querySelector('.daily-quote-widget');
        const quoteText = document.getElementById('daily-quote-text');

        if (!quoteWidget || !quoteText) return;

        const quotes = [
            "Bir yuva kurmak, iki kalbin birleşmesiyle başlar...",
            "Sevgi bir eylem, sadece bir duygu değildir.",
            "Seninle her şeye varım ben!",
            "Aşk, iki kişinin tek bir yürek olmasıdır.",
            "Evlilik, sonsuz bir yolculuğun ilk adımıdır.",
            "Mutluluk paylaştıkça çoğalır.",
            "Sen benim en güzel 'İyi ki'msin.",
            "Birlikte yaşlanmak değil, birlikte büyümek...",
            "Huzur kokan yuvamıza az kaldı.",
            "Aşk sabırdır, aşk iyiliktir.",
            "Kalbim senin evin, sonsuza kadar beklerim.",
            "Hayallerimiz bir, yolumuz bir."
        ];

        let currentIdx = 0;

        // Try to verify if we have a saved quote index to start optionally?
        // Let's just random start or keep as is. Default HTML has the first one.

        quoteWidget.addEventListener('click', () => {
            // Animate Out
            quoteText.style.opacity = '0';
            quoteText.style.transform = 'translateY(-10px)';

            setTimeout(() => {
                // Change Text
                let nextIdx;
                do {
                    nextIdx = Math.floor(Math.random() * quotes.length);
                } while (nextIdx === currentIdx && quotes.length > 1);

                currentIdx = nextIdx;
                quoteText.textContent = quotes[currentIdx];

                // Animate In
                quoteText.style.opacity = '1';
                quoteText.style.transform = 'translateY(0)';
            }, 300);
        });
    }

    /* --- Splash Screen Logic --- */
    function setupSplashScreen() {
        const splash = document.getElementById('splash-screen');
        if (!splash) return;

        // Swipe Up to Dismiss (Interactive)
        let startY = 0;
        let currentY = 0;
        let isDragging = false;

        splash.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            isDragging = true;
            splash.style.transition = 'none'; // Disable transition during drag
        }, { passive: true });

        splash.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentY = e.touches[0].clientY;
            const diffY = currentY - startY;

            // Only move upwards
            if (diffY < 0) {
                splash.style.transform = `translateY(${diffY}px)`;
            }
        }, { passive: true });

        splash.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            isDragging = false;

            const endY = e.changedTouches[0].clientY;
            const diffY = endY - startY;

            // Restore transition for the final snap/dismiss
            splash.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';

            if (diffY < -100) { // Threshold for dismissal
                splash.classList.add('hidden');
                splash.style.transform = 'translateY(-100%)';
                setTimeout(() => {
                    splash.style.display = 'none';
                }, 650);
            } else {
                // Snap back
                splash.style.transform = 'translateY(0)';
            }
        });

        try {
            // Get dates
            const nisanDate = new Date((settings.dates?.engagement || '2026-10-01') + 'T00:00:00');
            const nikahDate = new Date((settings.dates?.wedding || '2027-10-01') + 'T00:00:00');
            const now = new Date();

            const elNisan = document.getElementById('splash-nisan');
            const elNikah = document.getElementById('splash-nikah');

            function getDays(target) {
                const diff = target - now;
                if (diff <= 0) return "Tamamlandı";
                return Math.ceil(diff / (1000 * 60 * 60 * 24)) + " Gün";
            }

            if (elNisan) elNisan.textContent = getDays(nisanDate);
            if (elNikah) elNikah.textContent = getDays(nikahDate);
        } catch (err) {
            console.warn("Splash date calc error:", err);
        }
    }

    // --- Selectors ---

    // Core
    const navItems = document.querySelectorAll('.nav-item');
    const sections = {
        home: document.getElementById('home-section'),
        ceyiz: document.getElementById('ceyiz-section'),
        damat: document.getElementById('damat-section'),
        stats: document.getElementById('stats-section')
    };
    const lists = {
        ceyiz: document.getElementById('ceyiz-list'),
        damat: document.getElementById('damat-list')
    };

    // Header & Actions
    const btnSettings = document.getElementById('btn-settings');


    const btnManageCats = document.getElementById('btn-manage-cats');
    const fab = document.getElementById('fab-add');

    // Modals
    const modalForm = document.getElementById('modal-form');
    const modalSettings = document.getElementById('modal-settings');
    const modalCats = document.getElementById('modal-categories'); // ADDED - Missing variable
    const form = document.getElementById('item-form');


    // Filters
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const statusFilter = document.getElementById('status-filter');

    // Toast
    const toastContainer = document.getElementById('toast-container');
    const toastMessage = document.getElementById('toast-message');
    const btnUndo = document.getElementById('btn-undo');

    // Settings
    const darkModeToggle = document.getElementById('darkModeToggle');
    const sNisan = document.getElementById('setting-date-nisan');
    const sNikah = document.getElementById('setting-date-nikah');
    const btnExport = document.getElementById('btn-export');
    const btnImport = document.getElementById('btn-import');
    const fileImport = document.getElementById('file-import');

    // Reset settings modal state
    function resetSettingsState() {
        const modal = document.getElementById('modal-settings');
        if (!modal) return;

        // Reset inputs to current settings
        if (sNisan) sNisan.value = settings.dates.engagement;
        if (sNikah) sNikah.value = settings.dates.wedding;

        const animToggle = document.getElementById('animations-toggle');
        if (animToggle) animToggle.checked = settings.appearance.animations;

        // Reset scroll
        const sheet = modal.querySelector('.settings-sheet');
        const body = modal.querySelector('.settings-body');
        if (sheet) sheet.scrollTop = 0;
        if (body) body.scrollTop = 0;
    }
    window.resetSettingsState = resetSettingsState;

    // Helpers
    const currencyFormatter = new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });

    const successMessages = [
        "Harika! Bir adım daha tamam 💗",
        "Çok güzel gidiyorsun Şevval ✨",
        "Bu da tamamlandı! ☑️",
        "Eksikler azalıyor... 🤍",
        "Süpersin! 🌸"
    ];

    // Daily Quotes - Random quote on each page load
    const dailyQuotes = [
        "Bir yuva kurmak, iki kalbin birleşmesiyle başlar...",
        "Her hazırlık, hayallerinize bir adım daha yaklaştırır.",
        "Sabırla yapılan her şey, en güzel sonuçları verir.",
        "Bugün atılan her adım, yarının anılarını inşa eder.",
        "Birlikte kuracağınız yuva, sevgiyle daha da güzelleşecek.",
        "Her detay, mutluluğunuzun bir parçası olacak.",
        "Planlamak, hayal etmekten çok daha keyifli.",
        "Geleceğinizi bugünden hazırlıyorsunuz.",
        "Her liste, yeni bir başlangıcın habercisi.",
        "Hazırlık süreci de tıpkı düğününüz kadar özel."
    ];

    // --- Init ---
    // --- Init ---
    // --- Init ---
    try {
        loadData();
    } catch (e) {
        console.error("CRITICAL ERROR loading data:", e);
        // Fallback to empty to allow app to load
        items = [];
        userCategories = { ceyiz: [], damat: [] };
    }

    try {
        applySettings();
        initDarkMode();
    } catch (e) {
        console.error("Error applying settings:", e);
    }

    // listeners first to ensure interactivity
    try {
        setupEventListeners();
        // Add Search Listeners
        ['ceyiz', 'damat'].forEach(type => {
            const inp = document.getElementById('search-' + type);
            if (inp) {
                inp.addEventListener('input', () => renderList(type));
            }
        });
        console.log("EventListeners setup complete.");
    } catch (e) {
        console.error("Error setting up listeners:", e);
    }

    try {
        renderApp();
        updateCountdowns();
        updateHomeCountdowns();
        startLiveCountdown();
        updateDailyQuote();
        updateDailyQuote();
        if (typeof updateGreeting === 'function') updateGreeting(); // Initialize Greeting
        if (typeof updateMiniStats === 'function') updateMiniStats(); // Initialize Mini Stats
    } catch (e) {
        console.error("Error initializing UI:", e);
    }

    // Always run splash screen logic last
    setupSplashScreen();
    setupSwipeNavigation();

    // Start Home Countdown Timer (update every minute)
    setInterval(updateHomeCountdowns, 60000);

    // Hide FAB on initial load if on home or stats
    if (currentTab === 'home' || currentTab === 'stats') {
        if (fab) fab.style.display = 'none';
        const fb = document.getElementById('filter-bar');
        if (fb) fb.style.display = 'none';
    }

    // --- Swipe Navigation Logic ---
    function setupSwipeNavigation() {
        const container = document.getElementById('main-swipe-container');
        if (!container) return;

        const tabOrder = ['home', 'ceyiz', 'damat', 'stats'];
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;

        container.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        container.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            handleSwipe();
        }, { passive: true });

        function handleSwipe() {
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            // Ensure it's a horizontal swipe
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 80) {
                const currentIndex = tabOrder.indexOf(currentTab);
                if (currentIndex === -1) return;

                if (deltaX < 0) {
                    // Swipe Left -> Next Tab
                    if (currentIndex < tabOrder.length - 1) {
                        window.switchTab(tabOrder[currentIndex + 1]);
                    }
                } else {
                    // Swipe Right -> Previous Tab
                    if (currentIndex > 0) {
                        window.switchTab(tabOrder[currentIndex - 1]);
                    }
                }
            }
        }
    }



    function initDarkMode() {
        const toggle = document.getElementById('darkModeToggle');
        const headerBtn = document.getElementById('header-theme-toggle');

        // Load state (1 = dark, 0 = light)
        const isDark = localStorage.getItem('darkMode') === '1';

        // Apply to body
        document.body.classList.toggle('dark-mode', isDark);

        // Sync Switch
        if (toggle) toggle.checked = isDark;

        // Change Handler
        function setMode(dark) {
            document.body.classList.toggle('dark-mode', dark);
            localStorage.setItem('darkMode', dark ? '1' : '0');
            if (toggle) toggle.checked = dark;
        }

        if (toggle) {
            toggle.addEventListener('change', (e) => {
                setMode(e.target.checked);
            });
        }

        // Header Button Support
        if (headerBtn) {
            headerBtn.onclick = () => {
                const current = document.body.classList.contains('dark-mode');
                setMode(!current);
            };
        }

        // Global exposure for debugging or other buttons
        window.toggleTheme = () => {
            const current = document.body.classList.contains('dark-mode');
            setMode(!current);
        };
    }

    function updateCountdowns() {
        // Standard Day Countdown (Header/Stats)
        const now = new Date();
        // Use settings dates or defaults
        const nisanDate = new Date((settings.dates?.engagement || '2026-10-01') + 'T00:00:00');
        const nikahDate = new Date((settings.dates?.wedding || '2027-10-01') + 'T00:00:00');

        function getDaysOnly(target) {
            const diff = target - now;
            return Math.ceil(diff / (1000 * 60 * 60 * 24));
        }

        const nisanDays = getDaysOnly(nisanDate);
        const nikahDays = getDaysOnly(nikahDate);

        const els = {
            mainNisan: document.getElementById('main-nisan-txt'),
            mainNikah: document.getElementById('main-nikah-txt')
        };

        if (els.mainNisan && els.mainNikah) {
            if (nisanDays > 0) {
                els.mainNisan.textContent = `${nisanDays} gün kaldı`;
            } else if (nisanDays === 0) {
                els.mainNisan.textContent = "Bugün nişan günü 💖";
            } else {
                els.mainNisan.textContent = "Mutlulukla geçti 💖";
            }

            if (nikahDays > 0) {
                els.mainNikah.textContent = `${nikahDays} gün kaldı`;
            } else if (nikahDays === 0) {
                els.mainNikah.textContent = "Bugün nikah günü 🤍";
            } else {
                els.mainNikah.textContent = "Mutlulukla geçti 🤍";
            }
        }
    }

    // Home Screen Countdowns (Real-time format: X gün Y saat Z dakika)
    function updateHomeCountdowns() {
        const now = new Date();

        // Get dates from settings or fallback STRICTLY
        let nisanStr = settings.dates?.engagement;
        let nikahStr = settings.dates?.wedding;

        // Failsafe
        if (!nisanStr) nisanStr = '2026-10-01';
        if (!nikahStr) nikahStr = '2027-10-01';

        const nisanDate = new Date(nisanStr + 'T00:00:00');
        const nikahDate = new Date(nikahStr + 'T00:00:00');

        function formatTimeDiff(target) {
            if (!target || isNaN(target.getTime())) return "Tarih Hatalı"; // Should not happen with hardcodes

            const diff = target - now;
            if (diff <= 0) return "Tamamlandı ✨";

            const totalSecs = Math.floor(diff / 1000);
            const days = Math.floor(totalSecs / 86400);
            const hours = Math.floor((totalSecs % 86400) / 3600);
            const minutes = Math.floor((totalSecs % 3600) / 60);

            return `${days} gün<br>${hours} saat<br>${minutes} dakika`;
        }

        const elNisanTimer = document.getElementById('home-nisan-timer');
        const elNikahTimer = document.getElementById('home-nikah-timer');

        if (elNisanTimer) {
            const result = formatTimeDiff(nisanDate);
            elNisanTimer.innerHTML = result;
        }
        if (elNikahTimer) {
            const result = formatTimeDiff(nikahDate);
            elNikahTimer.innerHTML = result;
        }

        // Update dates display
        const elNisanDate = document.getElementById('home-nisan-date');
        const elNikahDate = document.getElementById('home-nikah-date');

        if (elNisanDate) {
            const d = nisanDate;
            elNisanDate.textContent = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
        }

        if (elNikahDate) {
            const d = nikahDate;
            elNikahDate.textContent = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
        }
    }


    // Update Daily Quote with random selection
    function updateDailyQuote() {
        const quoteElement = document.getElementById('daily-quote-text');
        if (quoteElement && dailyQuotes.length > 0) {
            const randomIndex = Math.floor(Math.random() * dailyQuotes.length);
            quoteElement.textContent = dailyQuotes[randomIndex];
        }
    }


    // Live Detailed Countdown Widget
    function startLiveCountdown() {
        const widget = document.getElementById('fixed-countdown-widget');
        const elNisan = document.getElementById('fc-nisan');
        const elNikah = document.getElementById('fc-nikah');

        if (!widget) return;
        widget.classList.remove('hidden');

        function getDetailedTime(target) {
            const now = new Date();
            let diff = target - now;

            if (diff <= 0) return "Tamamlandı ✨";

            // Calculate breakup
            // Simple approximation for Year/Month to be robust
            let y = target.getFullYear() - now.getFullYear();
            let m = target.getMonth() - now.getMonth();
            let d = target.getDate() - now.getDate();

            if (d < 0) {
                m--;
                // Days in previous month
                const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
                d += prevMonth.getDate();
            }
            if (m < 0) {
                y--;
                m += 12;
            }

            // Hours/Mins/Secs from remainder implies pure time diff, 
            // but "Y M D" is calendar diff. 
            // Let's stick to strict time diff for H:M:S? 
            // No, user wants Y M D H.
            // Let's use the time part of the dates.
            let h = target.getHours() - now.getHours();
            let min = target.getMinutes() - now.getMinutes();
            let s = target.getSeconds() - now.getSeconds();

            if (s < 0) { min--; s += 60; }
            if (min < 0) { h--; min += 60; }
            if (h < 0) { d--; h += 24; }

            // Adjust d/m/y cascading if H caused negative D
            // This is getting complex strictly.
            // Simplified: Total Seconds -> Breakdown
            // Yet "Year" and "Month" are variable.
            // Let's use the standard approximate string for display:

            const totalSecs = Math.floor(diff / 1000);
            const days = Math.floor(totalSecs / 86400);
            const remSecs = totalSecs % 86400;
            const hours = Math.floor(remSecs / 3600);
            const mins = Math.floor((remSecs % 3600) / 60);
            const secs = remSecs % 60;

            // Convert Total Days to Y/M/D approx
            const yy = Math.floor(days / 365);
            const mm = Math.floor((days % 365) / 30);
            const dd = (days % 365) % 30;

            let str = '';
            if (yy > 0) str += `${yy}Y `;
            if (mm > 0) str += `${mm}A `;
            if (dd > 0) str += `${dd}G `;
            str += `${hours}s ${mins}dk ${secs}sn`;

            return str;
        }

        function update() {
            const nisanDate = new Date((settings.dates?.engagement || '2026-10-01') + 'T00:00:00');
            const nikahDate = new Date((settings.dates?.wedding || '2027-10-01') + 'T00:00:00');

            if (elNisan) elNisan.textContent = getDetailedTime(nisanDate);
            if (elNikah) elNikah.textContent = getDetailedTime(nikahDate);
        }

        update();
        setInterval(update, 1000);
    }

    // ... logic continues ...

    function loadData() {
        try {
            const rawData = localStorage.getItem(STORAGE_KEY);
            if (rawData) {
                items = JSON.parse(rawData);
                items.forEach(i => {
                    if (typeof i.price === 'undefined') i.price = 0;
                    if (typeof i.note === 'undefined') i.note = '';
                });
            } else {
                items = [];
            }
        } catch (e) {
            console.error("Error parsing items:", e);
            items = [];
        }

        // Populate defaults if empty
        if (items.length === 0) {
            populateDefaultItems();
        }

        try {
            const rawCats = localStorage.getItem(STORAGE_CATS_KEY);
            if (rawCats) userCategories = JSON.parse(rawCats);
        } catch (e) {
            console.error("Error parsing categories:", e);
            userCategories = { ceyiz: [], damat: [] };
        }

        try {
            const rawSettings = localStorage.getItem(STORAGE_SETTINGS_KEY);
            if (rawSettings) {
                const loaded = JSON.parse(rawSettings);
                // Deep merge to ensure all properties exist
                settings = {
                    ...settings,
                    ...loaded,
                    dates: { ...settings.dates, ...(loaded.dates || {}) },
                    appearance: { ...settings.appearance, ...(loaded.appearance || {}) }
                };
            }
        } catch (e) {
            console.error("Error parsing settings:", e);
            // Keep default settings
        }

        // --- FORCE VALID DATES RECOVERY ---
        // If local storage had bad/empty dates, we must overwrite them to ensure the countown works.
        const defaultNisan = '2026-10-01';
        const defaultNikah = '2027-10-01';

        if (!settings.dates.engagement || settings.dates.engagement.length < 10) {
            console.log("Fixing missing engagement date...");
            settings.dates.engagement = defaultNisan;
        }
        if (!settings.dates.wedding || settings.dates.wedding.length < 10) {
            console.log("Fixing missing wedding date...");
            settings.dates.wedding = defaultNikah;
        }
    }

    function saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        renderStats();
    }

    function saveCategories() {
        localStorage.setItem(STORAGE_CATS_KEY, JSON.stringify(userCategories));
        updateAllCategoryDropdowns();
    }
    window.appData.saveCategories = saveCategories; // Expose globally


    function saveSettings() {
        localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
        applySettings();
        // Update live counters immediately
        updateCountdowns();
        updateHomeCountdowns(); // <--- ADDED THIS to refresh home screen immediately
        // Force live widget update if running
        const elNisan = document.getElementById('fc-nisan');
        if (elNisan) elNisan.textContent = "...";
    }

    function populateDefaultItems() {
        console.log("Populating default items...");
        const ceyizDefaults = [
            { name: "12 Kişilik Yemek Takımı", category: "Mutfak", price: 15000 },
            { name: "Çatal Bıçak Seti", category: "Mutfak", price: 4500 },
            { name: "Çelik Tencere Seti", category: "Mutfak", price: 6000 },
            { name: "Granit Tencere Seti", category: "Mutfak", price: 4000 },
            { name: "Kahvaltı Takımı", category: "Mutfak", price: 3500 },
            { name: "Nevresim Takımı (Çift)", category: "Yatak Odası", price: 2500 },
            { name: "Yatak Örtüsü", category: "Yatak Odası", price: 3000 },
            { name: "Bornoz Seti", category: "Banyo", price: 2000 },
            { name: "Elektronik Süpürge", category: "Elektronik", price: 12000 },
            { name: "Ütü", category: "Elektronik", price: 3000 }
        ];

        const damatDefaults = [
            { name: "Damatlık", category: "Giyim", price: 8000 },
            { name: "Damat Ayakkabısı", category: "Giyim", price: 3000 },
            { name: "Kol Saati", category: "Aksesuar", price: 5000 },
            { name: "Parfüm", category: "Kişisel Bakım", price: 2500 },
            { name: "Tıraş Makinesi", category: "Elektronik", price: 4000 },
            { name: "Gömlek & Kravat", category: "Giyim", price: 1500 }
        ];

        ceyizDefaults.forEach(d => {
            items.push({
                id: Date.now() + Math.random(),
                name: d.name,
                category: d.category,
                price: d.price,
                quantity: 1,
                isBought: false,
                note: '',
                type: 'ceyiz'
            });
        });

        damatDefaults.forEach(d => {
            items.push({
                id: Date.now() + Math.random(),
                name: d.name,
                category: d.category,
                price: d.price,
                quantity: 1,
                isBought: false,
                note: '',
                type: 'damat'
            });
        });
        saveData();
    }

    function applySettings() {
        // 1. Dark Mode (Handled by initDarkMode)


        // 2. Profile Inputs
        const dateNisan = document.getElementById('setting-date-nisan');
        if (dateNisan) dateNisan.value = settings.dates.engagement;

        const dateNikah = document.getElementById('setting-date-nikah');
        if (dateNikah) dateNikah.value = settings.dates.wedding;

        // 3. Appearance
        const animToggle = document.getElementById('animations-toggle');
        if (animToggle) animToggle.checked = settings.appearance.animations;

        // Font size logic removed per user request

        // Apply Animations Class
        if (!settings.appearance.animations) document.body.classList.add('no-anim');
        else document.body.classList.remove('no-anim');

        // Update Title
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) pageTitle.innerHTML = `${settings.name || 'Şevval'}'in Çeyiz Defteri <i class="fas fa-heart pulse-heart"></i>`;

        // Update Labels in Fixed Widget if needed (optional)
    }



    function getCategories(type) {
        const typeKey = type === 'stats' ? 'ceyiz' : type;
        const defaults = defaultCategories[typeKey] || defaultCategories.ceyiz;
        const customs = userCategories[typeKey] || [];
        return [...new Set([...defaults, ...customs])];
    }

    // --- Rendering ---
    function renderApp() {
        renderList('ceyiz');
        renderList('damat');
        renderStats();
        updateAllCategoryDropdowns();
    }

    function renderList(type) {
        const container = lists[type];
        const emptyState = container.parentElement.querySelector('.empty-state');

        // Search Input specific to section
        const sInput = document.getElementById('search-' + type);
        const searchText = sInput ? sInput.value.toLowerCase() : '';

        // Filter
        const catFilterVal = categoryFilter?.value || '';
        const statusFilterVal = statusFilter?.value || 'all';

        let filtered = items.filter(item => item.type === type);
        const isFiltering = searchText || catFilterVal || statusFilterVal !== 'all';

        if (searchText) {
            filtered = filtered.filter(item => item.name.toLowerCase().includes(searchText));
        }
        if (catFilterVal) {
            filtered = filtered.filter(item => item.category === catFilterVal);
        }

        if (statusFilterVal !== 'all') {
            if (statusFilterVal === 'true' || statusFilterVal === 'false') {
                filtered = filtered.filter(item => item.isBought === (statusFilterVal === 'true'));
            } else if (statusFilterVal === 'hasPrice') {
                filtered = filtered.filter(item => item.price > 0);
            } else if (statusFilterVal === 'noPrice') {
                filtered = filtered.filter(item => !item.price);
            }
        }

        container.innerHTML = '';
        if (filtered.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');

            // Sort: Not bought first logic REMOVED to allow manual drag & drop reordering
            // configured by the user.
            /* filtered.sort((a, b) => {
                if (a.isBought === b.isBought) return 0;
                return a.isBought ? 1 : -1;
            }); */

            filtered.forEach((item) => {
                const el = document.createElement('div');
                el.className = `item-card ${item.isBought ? 'bought' : ''}`;
                el.setAttribute('data-id', item.id);
                // Don't make the whole card draggable, only the handle
                if (!isFiltering) {
                    el.classList.add('sortable-item');
                }

                const totalPrice = item.price * item.quantity;
                const priceDisplay = totalPrice > 0 ? currencyFormatter.format(totalPrice) : '';

                el.innerHTML = `
                    ${!isFiltering ? '<div class="drag-handle"><i class="fas fa-grip-vertical"></i></div>' : ''}
                    <div class="item-content">
                        <div class="checkbox-wrapper">
                            <input type="checkbox" ${item.isBought ? 'checked' : ''} class="action-check">
                            <div class="custom-checkbox"><i class="fas fa-check"></i></div>
                        </div>
                        <div class="item-info">
                            <h3>${item.name}</h3>
                            <div class="item-details">
                                <span class="item-tag">${item.category}</span>
                                <span class="item-qty">${item.quantity} Adet</span>
                                ${priceDisplay ? `<span class="item-price-tag">${priceDisplay}</span>` : ''}
                            </div>
                            ${item.note ? `<div class="item-note-text"><i class="fas fa-sticky-note"></i> ${item.note}</div>` : ''}
                            ${item.link ? `<a href="${item.link}" target="_blank" class="item-link-btn" onclick="event.stopPropagation();"><i class="fas fa-external-link-alt"></i> Ürüne Git</a>` : ''}
                        </div>
                        ${item.image ? `<div class="item-thumbnail" onclick="window.viewImage('${item.image}'); event.stopPropagation();"><img src="${item.image}" alt="Ürün"></div>` : ''}
                        ${item.isBought ? '<div class="completed-badge">Tamamlandı ✓</div>' : ''}
                    </div>
                `;
                // Add actions: Edit + Delete
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'item-actions';
                actionsDiv.innerHTML = `
                    <button class="btn-icon edit" data-id="${item.id}" style="margin-right: 4px;"><i class="fas fa-pen"></i></button>
                    <button class="btn-icon delete"><i class="fas fa-trash"></i></button>
                `;
                el.appendChild(actionsDiv);

                // Listeners
                el.querySelector('.action-check').addEventListener('change', (e) => toggleStatus(item.id, e.target.checked));

                // Edit Button - Inline implementation to avoid scope issues
                const editBtn = el.querySelector('.edit');
                if (editBtn) {
                    editBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        e.preventDefault();

                        // Open edit modal directly
                        const qaModal = document.getElementById('modal-quick-add-category');
                        const qaName = document.getElementById('qa-new-product-name');
                        const qaSelect = document.getElementById('qa-new-category-select');
                        const qaQty = document.getElementById('qa-new-qty');
                        const qaPrice = document.getElementById('qa-new-price');
                        const qaNote = document.getElementById('qa-new-note');
                        const qaLink = document.getElementById('qa-new-link');
                        const qaPhotoInput = document.getElementById('qa-new-photo');
                        const qaPhotoPreview = document.getElementById('qa-photo-preview');
                        const qaPhotoImg = qaPhotoPreview?.querySelector('img');
                        const qaError = document.getElementById('qa-new-error-msg');
                        const modalTitle = qaModal?.querySelector('.modal-header h2');

                        if (!qaModal) {
                            alert('Modal bulunamadı!');
                            return;
                        }

                        // Set modal to edit mode
                        qaModal.dataset.editId = item.id;
                        if (modalTitle) modalTitle.textContent = 'Ürünü Düzenle';

                        // Fill form
                        if (qaName) qaName.value = item.name;
                        if (qaQty) qaQty.value = item.quantity || 1;
                        if (qaPrice) qaPrice.value = item.price || '';
                        if (qaNote) qaNote.value = item.note || '';
                        if (qaLink) qaLink.value = item.link || '';
                        if (qaError) qaError.classList.add('hidden');

                        // Populate categories
                        if (qaSelect) {
                            qaSelect.innerHTML = '<option value="" disabled>Kategori Seçiniz</option>';
                            let cats = (item.type === 'damat' ? userCategories.damat : userCategories.ceyiz) || [];

                            // Fallback to defaults if empty
                            if (cats.length === 0) {
                                cats = (item.type === 'damat' ? defaultCategories.damat : defaultCategories.ceyiz);
                                console.log('📋 Using default categories:', cats);
                            } else {
                                console.log('📋 Using user categories:', cats);
                            }

                            console.log('📋 Item type:', item.type, 'Selected:', item.category);

                            cats.forEach(c => {
                                const opt = document.createElement('option');
                                opt.value = c;
                                opt.textContent = c;
                                if (c === item.category) opt.selected = true;
                                qaSelect.appendChild(opt);
                            });
                        }

                        // Open modal
                        qaModal.classList.remove('hidden');
                        requestAnimationFrame(() => qaModal.classList.add('active'));
                        document.body.classList.add('modal-open');

                        if (qaName) qaName.focus();
                    });
                }

                // Delete Button Click
                el.querySelector('.delete').addEventListener('click', (e) => {
                    e.stopPropagation();
                    initiateDelete(item.id);
                });

                if (!isFiltering) addDragEvents(el);
                container.appendChild(el);
            });
        }
    }

    function addDragEvents(el) {
        const dragHandle = el.querySelector('.drag-handle');
        if (!dragHandle) return;

        // Desktop: HTML5 Drag & Drop
        dragHandle.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            el.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', el.innerHTML);
            setTimeout(() => {
                el.style.opacity = '0.6';
            }, 0);
        });

        dragHandle.addEventListener('dragend', () => {
            el.classList.remove('dragging');
            el.style.opacity = '';
            saveReorderedList();
        });
    }

    function saveReorderedList() {
        const container = lists[currentTab];
        const newIds = Array.from(container.children).map(child => parseInt(child.getAttribute('data-id')));
        const otherItems = items.filter(i => i.type !== currentTab);
        const thisTabItems = items.filter(i => i.type === currentTab);

        const reorderedThisTab = [];
        newIds.forEach(id => {
            const item = thisTabItems.find(i => i.id === id);
            if (item) reorderedThisTab.push(item);
        });

        // Merge keeping others
        items = [...otherItems, ...reorderedThisTab];
        saveData();
    }

    ['ceyiz-list', 'damat-list'].forEach(id => {
        const container = document.getElementById(id);
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(container, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (draggable) {
                if (afterElement == null) {
                    container.appendChild(draggable);
                } else {
                    container.insertBefore(draggable, afterElement);
                }
            }
        });

        // Listen for touch reorder events from touch-drag-support.js
        container.addEventListener('itemsReordered', () => {
            saveReorderedList();
        });
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.item-card:not(.dragging)')];
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

    function renderStats() {
        // Reuse similar logic, structure matches new HTML
        const totalCount = items.length;
        const boughtCount = items.filter(i => i.isBought).length;
        const remainingCount = totalCount - boughtCount;
        const pct = totalCount === 0 ? 0 : Math.round((boughtCount / totalCount) * 100);

        document.getElementById('stat-total').textContent = totalCount;
        document.getElementById('stat-bought').textContent = boughtCount;
        document.getElementById('stat-remaining').textContent = remainingCount;
        document.getElementById('total-percentage').textContent = `%${pct}`;

        // Update Pie Chart gradient
        const deg = pct * 3.6;
        document.querySelector('.pie-chart').style.background = `conic-gradient(var(--primary-color) ${deg}deg, var(--primary-light) ${deg}deg 360deg)`;

        let totalCost = 0, spentCost = 0, remainingCost = 0;
        items.forEach(i => {
            const cost = (i.price || 0) * i.quantity;
            totalCost += cost;
            if (i.isBought) spentCost += cost;
            else remainingCost += cost;
        });

        document.getElementById('money-total').textContent = currencyFormatter.format(totalCost);
        document.getElementById('money-spent').textContent = currencyFormatter.format(spentCost);
        document.getElementById('money-remaining').textContent = currencyFormatter.format(remainingCost);

        // --- Dashboard Widget Update (Phase 5) ---
        const dashboardPct = totalCost === 0 ? 0 : Math.round((spentCost / totalCost) * 100);
        const elDashPct = document.getElementById('dash-budget-pct');
        const elDashBar = document.getElementById('dash-budget-bar');
        const elDashSpent = document.getElementById('dash-spent');
        const elDashTotal = document.getElementById('dash-total');

        if (elDashPct) {
            elDashPct.textContent = `%${dashboardPct}`;
            elDashBar.style.width = `${dashboardPct}%`;
            elDashSpent.textContent = `${currencyFormatter.format(spentCost)} Harcanan`;
            elDashTotal.textContent = `/ ${currencyFormatter.format(totalCost)}`;
        }

        ['ceyiz', 'damat'].forEach(type => {
            const subItems = items.filter(i => i.type === type);
            const subBought = subItems.filter(i => i.isBought).length;
            const subPct = subItems.length === 0 ? 0 : (subBought / subItems.length) * 100;
            const subSpent = subItems.reduce((acc, i) => acc + (i.isBought ? (i.price || 0) * i.quantity : 0), 0);

            document.getElementById(`${type}-progress`).style.width = `${subPct}%`;
            document.getElementById(`${type}-stats-text`).textContent = `${subBought}/${subItems.length} tamamlandı`;
            document.getElementById(`${type}-money-text`).textContent = `Harcama: ${currencyFormatter.format(subSpent)}`;
        });


        // Update Mini Dashboard on Home Screen
        if (typeof updateMiniStats === 'function') updateMiniStats();
    }


    // --- Quotes Logic Removed ---

    function updateAllCategoryDropdowns() {
        const type = (currentTab === 'stats' || currentTab === 'home') ? 'ceyiz' : currentTab;
        const currentCats = getCategories(type);

        // 1. Update Filter Dropdown
        if (categoryFilter) {
            const prevFilter = categoryFilter.value;
            categoryFilter.innerHTML = '<option value="">Tüm Kategoriler</option>';
            currentCats.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c;
                categoryFilter.appendChild(opt);
            });
            categoryFilter.value = prevFilter;
        }

        // 2. Update Quick Add/Edit Modal Dropdown
        const qaSelect = document.getElementById('qa-new-category-select');
        if (qaSelect) {
            const prevVal = qaSelect.value;
            qaSelect.innerHTML = '<option value="" disabled selected>Kategori Seçiniz</option>';
            currentCats.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c;
                qaSelect.appendChild(opt);
            });

            // Add "Add New" option
            const specialOpt = document.createElement('option');
            specialOpt.value = "ADD_NEW";
            specialOpt.textContent = "--- Yeni Kategori Ekle ---";
            specialOpt.style.fontWeight = "bold";
            specialOpt.style.color = "var(--primary-color)";
            qaSelect.appendChild(specialOpt);

            if (prevVal && [...qaSelect.options].some(o => o.value === prevVal)) {
                qaSelect.value = prevVal;
            }
        }
    }
    window.appData.updateAllCategoryDropdowns = updateAllCategoryDropdowns;

    // --- Actions ---

    // Helper function to close the quick add modal
    // --- Legacy Functions Removed (2025-02-01) ---
    // (closeQuickAddModal, saveQuickAddItem, openQuickAddModal were duplicates)
    // ----------------------------------------------

    // Edit Item Modal - Opens the quick add modal in edit mode
    window.editItemModal = function (item) {
        const qaModal = document.getElementById('modal-quick-add-category');
        const qaName = document.getElementById('qa-new-product-name');
        const qaSelect = document.getElementById('qa-new-category-select');
        const qaQty = document.getElementById('qa-new-qty');
        const qaPrice = document.getElementById('qa-new-price');
        const qaNote = document.getElementById('qa-new-note');
        const qaError = document.getElementById('qa-new-error-msg');
        const modalTitle = qaModal?.querySelector('.modal-header h2');

        if (!qaModal || !item) {
            console.error('Modal or item missing', { qaModal, item });
            return;
        }

        // Set modal to edit mode
        qaModal.dataset.editId = item.id;
        if (modalTitle) modalTitle.textContent = 'Ürünü Düzenle';

        // Fill form with existing data
        if (qaName) qaName.value = item.name;
        if (qaQty) qaQty.value = item.quantity || 1;
        if (qaPrice) qaPrice.value = item.price || '';
        if (qaNote) qaNote.value = item.note || '';
        if (qaError) qaError.classList.add('hidden');

        // Populate and select category
        if (qaSelect) {
            qaSelect.innerHTML = '<option value="" disabled>Kategori Seçiniz</option>';
            const cats = (item.type === 'damat' ? userCategories.damat : userCategories.ceyiz) || [];

            if (cats.length === 0) {
                alert('Önce kategori eklemelisiniz!');
                return;
            }

            cats.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c;
                if (c === item.category) opt.selected = true;
                qaSelect.appendChild(opt);
            });
        }

        // Open modal
        qaModal.classList.remove('hidden');
        requestAnimationFrame(() => qaModal.classList.add('active'));
        document.body.classList.add('modal-open');
        if (qaName) qaName.focus();
    };

    // Verify function is assigned
    console.log('✅ window.editItemModal assigned:', typeof window.editItemModal);
    // --- New Home Logic (Greeting & Mini Dashboard) ---
    function updateGreeting() {
        const el = document.getElementById('home-greeting');
        if (!el) return;

        const now = new Date();
        const hour = now.getHours();
        const titleEl = el.querySelector('.greeting-title');
        const subEl = el.querySelector('.greeting-subtitle');

        let greeting = "Merhaba";
        if (hour >= 6 && hour < 12) greeting = "Günaydın";
        else if (hour >= 12 && hour < 18) greeting = "Tünaydın";
        else if (hour >= 18 && hour < 22) greeting = "İyi Akşamlar";
        else greeting = "İyi Geceler";

        // Dil kontrolü ve selamlama
        // User asked for Turkish, ensure all text is Turkish
        // (Existing text is already Turkish)

        const name = settings.name || 'Şevval';

        if (titleEl) titleEl.textContent = `${greeting}, ${name} 👋`;

        // Random subtitle motivation
        const subs = [
            "Bugün hayallerin için harika bir gün!",
            "Eksikler azalıyor, mutluluk artıyor.",
            "Her detay seninle güzelleşiyor.",
            "Çeyiz listesi seni bekliyor ✨"
        ];
        if (subEl) {
            // Change subtitle only occasionally or static? Let's keep it static for now or random on load.
            // subEl.textContent = subs[Math.floor(Math.random() * subs.length)];
        }
    }

    function updateMiniStats() {
        // Calculate percentages for Ceyiz and Bohca
        ['ceyiz', 'damat'].forEach(type => {
            const subItems = items.filter(i => i.type === type);
            const total = subItems.length;
            const bought = subItems.filter(i => i.isBought).length;
            const pct = total === 0 ? 0 : Math.round((bought / total) * 100);

            const elPct = document.getElementById(`mini-${type}-percent`);
            const elFill = document.getElementById(`mini-${type}-fill`);

            if (elPct) elPct.textContent = `%${pct}`;
            if (elFill) elFill.style.width = `${pct}%`;
        });
    }

    // New Home Action Cards Listener
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.home-action-card');
        if (card) {
            const target = card.dataset.nav;
            if (target && window.switchTab) {
                window.switchTab(target);
            }
        }
    });

    // Ensure greeting is updated periodically (e.g. every minute to catch time changes if app stays open)
    setInterval(updateGreeting, 60000);

    // closeQAModal is defined earlier at line 990 - removing duplicate

    // Auto-init logs
    console.log("[QuickAdd] Global functions ready.");
    // initQuickAddButtons(); // REMOVED: Function no longer exists, referencing it crashed the app.

    // Enter Key Support (Delegation optional, but direct is fine if input exists)
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            const active = document.activeElement;
            if (active && (active.id === 'qa-product-name' || active.id === 'qa-name' || active.id === 'qa-qty' || active.id === 'qa-category-select')) {
                e.preventDefault();
                // Call global execute directly
                if (window.executeQuickAdd) window.executeQuickAdd();
            }
        }
    });

    // ... (Toggle Status and other funcs remain same) ...

    function toggleStatus(id, isChecked) {
        const item = items.find(i => i.id === id);
        if (item) {
            item.isBought = isChecked;
            saveData();

            // Wait for animation to complete before re-rendering (0.6s total animation time)
            setTimeout(() => {
                renderApp();
            }, 600);

            if (isChecked) {
                const msg = successMessages[Math.floor(Math.random() * successMessages.length)];
                showToast(msg, false);
                const boughtCount = items.filter(i => i.isBought).length;
                if (boughtCount > 0 && boughtCount % 5 === 0) {
                    setTimeout(() => showToast(`Şevval, harikasın! ${boughtCount} ürün oldu bile! ✨`, false), 3000);
                }
            }
        }
    }

    function showToast(msg, allowUndo = false) {
        // Ensure elements exist
        if (!toastMessage || !toastContainer) return;

        toastMessage.textContent = msg;
        if (allowUndo && btnUndo) btnUndo.classList.remove('hidden');
        else if (btnUndo) btnUndo.classList.add('hidden');

        toastContainer.classList.remove('hidden');
        if (undoTimeout) clearTimeout(undoTimeout);
        undoTimeout = setTimeout(() => {
            toastContainer.classList.add('hidden');
        }, 4000);
    }
    window.appData.showToast = showToast;

    function initiateDelete(id) {
        const item = items.find(i => i.id === id);
        if (!item) return;

        pendingDeleteItem = item;
        items = items.filter(i => i.id !== id);
        saveData();
        renderApp();

        showToast("Ürün silindi", true);
    }

    // --- Render Category Manager ---
    function renderCategoryManager(filter = '') {
        const listContainer = document.getElementById('category-list-container');
        if (!listContainer) return;
        listContainer.innerHTML = '';

        const type = (typeof currentTab !== 'undefined' && currentTab === 'stats') ? 'ceyiz' : (typeof currentTab !== 'undefined' ? currentTab : 'ceyiz');

        const defs = defaultCategories[type] || [];
        const users = userCategories[type] || [];

        // Combine for display
        const allCats = [
            ...defs.map(c => ({ name: c, isDefault: true })),
            ...users.map(c => ({ name: c, isDefault: false }))
        ];

        let filtered = allCats;
        if (filter) {
            filtered = allCats.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));
        }

        if (filtered.length === 0) {
            listContainer.innerHTML = `<div class="empty-state-small">Sonuç yok</div>`;
            return;
        }

        filtered.forEach(cat => {
            const el = document.createElement('div');
            el.className = 'cat-manage-item';
            el.style.display = 'flex';
            el.style.justifyContent = 'space-between';
            el.style.padding = '12px';
            el.style.borderBottom = '1px solid #eee';
            el.style.alignItems = 'center';

            const left = document.createElement('span');
            left.textContent = cat.name;
            left.style.fontWeight = '500';

            const right = document.createElement('div');

            if (cat.isDefault) {
                const badge = document.createElement('span');
                badge.className = 'badge-default';
                badge.textContent = 'Varsayılan';
                badge.style.fontSize = '0.75rem';
                badge.style.background = '#f0f0f0';
                badge.style.padding = '4px 8px';
                badge.style.borderRadius = '12px';
                badge.style.color = '#888';
                right.appendChild(badge);
            } else {
                const btnDel = document.createElement('button');
                btnDel.className = 'btn-icon-sm delete';
                btnDel.innerHTML = '<i class="fas fa-trash"></i>';
                btnDel.title = 'Sil';
                btnDel.style.color = 'salmon';
                btnDel.addEventListener('click', () => deleteCategory(cat.name, type));
                right.appendChild(btnDel);
            }

            el.appendChild(left);
            el.appendChild(right);
            listContainer.appendChild(el);
        });
    }
    window.appData.renderCategoryManager = renderCategoryManager;

    // Explicitly expose for use in listeners if needed
    window.renderCategoryManager = renderCategoryManager;


    function deleteCategory(name, type) {
        if (!confirm(`${name} kategorisini silmek istediğine emin misin?`)) return;

        const arr = userCategories[type];
        const idx = arr.indexOf(name);
        if (idx > -1) {
            arr.splice(idx, 1);
            saveCategories();
            renderCategoryManager();
            showToast("Kategori silindi.", false);
        }
    }




    // Globals for inline calls
    // Helper needs to be global if we have scope issues, but let's try to keep it clean.
    // We will stick to local function hoisting, but protect the call.

    // Globals for inline calls
    window.editItemModal = (item = null) => {
        console.log("✏️ Edit Modal Triggered for:", item);
        try {
            // Re-query primarily elements to be safe against closure issues
            const modalForm = document.getElementById('modal-form');
            if (!modalForm) {
                console.error("Critical: #modal-form not found in DOM");
                alert("Hata: Düzenleme formu bulunamadı. Lütfen sayfayı yenileyiniz.");
                return;
            }

            const isEdit = !!item;
            modalForm.classList.remove('hidden');
            requestAnimationFrame(() => modalForm.classList.add('active'));
            document.body.classList.add('modal-open');

            const type = isEdit ? item.type : currentTab;

            // Safe helper call
            const getter = typeof getCategories === 'function' ? getCategories : window.getCategories;
            if (!getter) throw new Error("Kategori yükleme fonksiyonu (getCategories) bulunamadı!");

            const currentCats = getter(type === 'stats' ? 'ceyiz' : type);

            const catSelect = document.getElementById('item-category');
            if (catSelect) {
                catSelect.innerHTML = '';
                currentCats.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c;
                    opt.textContent = c;
                    catSelect.appendChild(opt);
                });
            }

            const elId = document.getElementById('edit-id');
            const elName = document.getElementById('item-name');
            const elQty = document.getElementById('item-quantity');
            const elPrice = document.getElementById('item-price');
            const elBought = document.getElementById('item-bought');
            const elNote = document.getElementById('item-note');

            if (elId) elId.value = isEdit ? item.id : '';
            if (elName) elName.value = isEdit ? item.name : '';
            if (elQty) elQty.value = isEdit ? item.quantity : 1;
            if (elPrice) elPrice.value = (isEdit && item.price !== undefined) ? item.price : '';
            if (elBought) elBought.checked = isEdit ? item.isBought : false;
            if (elNote) elNote.value = (isEdit && item.note) ? item.note : '';

            if (isEdit && catSelect) {
                catSelect.value = item.category;
                lastSelectedCategory = item.category;
            }

            const title = document.getElementById('modal-title');
            if (title) title.textContent = isEdit ? 'Ürünü Düzenle 🖊️' : 'Yeni Ürün Ekle ✨';

        } catch (err) {
            console.error("Edit Modal Error:", err);
            alert("Bir hata oluştu: " + err.message);
        }
    };



    // --- Helper: Get Categories ---
    // Unified updateAllCategoryDropdowns is already defined above

    function openQuickAddModal() {
        const modal = document.getElementById('modal-quick-add-category');
        if (modal) {
            // Reset form
            const name = document.getElementById('qa-new-product-name');
            const qty = document.getElementById('qa-new-qty');
            const price = document.getElementById('qa-new-price');
            const note = document.getElementById('qa-new-note');
            const err = document.getElementById('qa-new-error-msg');
            const title = modal.querySelector('.modal-title');

            if (title) title.textContent = 'Ürün Detayı 📝';
            delete modal.dataset.editId; // Clear edit mode

            if (name) name.value = '';
            if (qty) qty.value = 1;
            if (price) price.value = '';
            if (note) note.value = '';
            const linkInput = document.getElementById('qa-new-link');
            if (linkInput) linkInput.value = '';

            // Reset Photo
            const photoInput = document.getElementById('qa-new-photo');
            const photoPreview = document.getElementById('qa-photo-preview');
            const photoImg = photoPreview?.querySelector('img');

            if (photoInput) photoInput.value = ''; // Reset file input
            if (photoPreview) {
                photoPreview.classList.add('hidden');
                if (photoImg) photoImg.src = '';
            }
            if (modal) delete modal.dataset.tempImage; // Clear temp image

            if (err) err.classList.add('hidden');

            // Reset Inline Category
            const newCatContainer = document.getElementById('qa-new-cat-container');
            const newCatInput = document.getElementById('qa-new-cat-input');
            if (newCatContainer) newCatContainer.classList.add('hidden');
            if (newCatInput) newCatInput.value = '';

            updateAllCategoryDropdowns(); // Ensure categories are up to date

            modal.classList.remove('hidden');
            requestAnimationFrame(() => modal.classList.add('active'));
            document.body.classList.add('modal-open');

            if (name) name.focus();
        }
    }

    function closeQAModal() {
        console.log("Closing QA Modal (Restored)");
        const modal = document.getElementById('modal-quick-add-category');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.classList.add('hidden'), 200);
            document.body.classList.remove('modal-open');

            // Reset state
            delete modal.dataset.editId;
            const title = document.getElementById('qa-title');
            if (title) title.textContent = 'Hızlı Ekle ✨';

            // Clear inputs if needed? No, usually explicitly cleared on open.
        }
    }
    window.closeQAModal = closeQAModal;

    let isSaving = false;

    function saveQuickAddItem(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        if (isSaving) {
            console.log("⏳ Save locked: prevention of double-save");
            return;
        }
        isSaving = true;
        setTimeout(() => isSaving = false, 1000); // Reset lock after 1s

        console.log("💾 saveQuickAddItem called");

        try {
            const modal = document.getElementById('modal-quick-add-category');
            const nameInput = document.getElementById('qa-new-product-name');
            const catSelect = document.getElementById('qa-new-category-select');
            const qtyInput = document.getElementById('qa-new-qty');
            const priceInput = document.getElementById('qa-new-price');
            const noteInput = document.getElementById('qa-new-note');
            const linkInput = document.getElementById('qa-new-link');

            // Visual feedback for debugging
            // alert(`Debug: Name=${nameInput?.value}, Cat=${catSelect?.value}`);

            if (!nameInput || !catSelect || !qtyInput) {
                alert("Hata: Form elemanları bulunamadı (DOM Error)");
                console.error("Critical: Inputs missing from DOM");
                return;
            }

            console.log("Step 1: Reading values");
            const name = nameInput?.value?.trim() || '';
            let category = catSelect?.value || '';
            const quantity = parseInt(qtyInput?.value) || 1;
            const price = priceInput?.value ? parseFloat(priceInput.value) : 0;
            const note = noteInput?.value?.trim() || '';
            const link = linkInput?.value?.trim() || '';
            const image = modal.dataset.tempImage || ''; // Get compressed base64
            console.log("Step 2: Values read", { name, category, quantity, price, note, link, hasImage: !!image });

            if (!name) {
                alert("Lütfen ürün adı giriniz.");
                return;
            }

            // Check if adding a new category
            if (category === "ADD_NEW") {
                const newCatInput = document.getElementById('qa-new-cat-input');
                const newCatName = newCatInput?.value?.trim();
                if (!newCatName) {
                    alert("Lütfen yeni kategorinin ismini yazınız.");
                    if (newCatInput) newCatInput.focus();
                    return;
                }
                // Call global addCategory to save it
                if (window.addCategory) {
                    window.addCategory(newCatName);
                    category = newCatName; // Use the new name for the item
                }
            }

            if (!category || category === "" || category === "Seçiniz") {
                alert("Lütfen bir kategori seçiniz.");
                return;
            }

            const editId = modal.dataset.editId;
            // Use global currentTab, ensure defaults
            let typeToSave = 'ceyiz';
            if (currentTab === 'damat') typeToSave = 'damat';
            else if (currentTab === 'ceyiz') typeToSave = 'ceyiz';
            else if (editId) {
                // If editing and on home/stats, try to preserve type
                const existing = items.find(i => i.id == editId);
                if (existing) typeToSave = existing.type;
            }

            if (editId) {
                // Edit existing
                const idx = items.findIndex(i => i.id == editId);
                if (idx > -1) {
                    items[idx] = {
                        ...items[idx],
                        name, category, quantity, price, note, link, image
                    };
                }
            } else {
                // Add new
                items.push({
                    id: Date.now(),
                    type: typeToSave,
                    name,
                    category,
                    quantity,
                    price,
                    note,
                    link,
                    image,
                    isBought: false,
                    dateAdded: new Date().toISOString()
                });

                // Auto-switch tab to show the new item
                if (currentTab !== typeToSave) {
                    console.log(`🔀 Auto-switching tab from ${currentTab} to ${typeToSave}`);
                    currentTab = typeToSave;
                    // Update header title if possible
                    const headerTitle = document.getElementById('header-title');
                    if (headerTitle) headerTitle.textContent = typeToSave === 'ceyiz' ? 'Çeyiz Listem' : 'Damat Bohçası';
                }
            }

            try {
                saveData();
            } catch (e) {
                console.error("Error in saveData:", e);
                throw new Error("Veri kaydedilirken hata: " + e.message);
            }

            try {
                renderApp();
            } catch (e) {
                console.error("Error in renderApp:", e);
                // Don't block saving if render fails, but alert
                alert("Veri kaydedildi ama ekran yenilenirken hata oluştu: " + e.message);
            }

            try {
                closeQAModal();
            } catch (e) {
                console.error("Error in closeQAModal:", e);
            }

            showToast(editId ? 'Ürün güncellendi ✅' : 'Ürün eklendi ✨', false);

        } catch (err) {
            console.error("Save Error:", err);
            alert("Kaydetme hatası oluştu: " + err.message);
        }
    }

    window.saveQuickAddItem = saveQuickAddItem; // Expose globally for onclick

    // --- UI Helper Functions ---
    window.switchTab = function (tabId) {
        // Global definition to ensure access
        const tabOrder = ['home', 'ceyiz', 'damat', 'stats'];
        console.log("Switching to tab:", tabId);

        // Update State
        const prevTab = currentTab;
        currentTab = tabId;

        // 0. Update Section Classes (for CSS dependencies like body:has(.active-section))
        const allSections = document.querySelectorAll('.swipe-section');
        allSections.forEach(sec => {
            if (sec.id === `${tabId}-section`) sec.classList.add('active-section');
            else sec.classList.remove('active-section');
        });

        // 1. Update Bottom Nav Active State
        navItems.forEach(item => {
            if (item.dataset.target === tabId) item.classList.add('active');
            else item.classList.remove('active');
        });

        // 2. Slide Container (Horizontal Swipe Effect)
        const container = document.getElementById('main-swipe-container');
        if (container) {
            const index = tabOrder.indexOf(tabId);
            if (index !== -1) {
                // translate X = - (index * 25%) because width is 400%
                container.style.transform = `translateX(-${index * 25}%)`;
            }
        }

        // 3. Manage Header Condensation (Home vs Others)
        const header = document.querySelector('.app-header');
        if (header) {
            if (tabId === 'home') {
                header.classList.remove('header-condensed');
                const sub = header.querySelector('.header-subtitle');
                if (sub) sub.style.display = 'block';
            } else {
                header.classList.add('header-condensed');
                const sub = header.querySelector('.header-subtitle');
                if (sub) sub.style.display = 'none';
            }
        }

        // 4. Update FAB & Filter Bar Visibility
        const shouldHideUI = (tabId === 'stats' || tabId === 'home');
        const filterBar = document.getElementById('filter-bar');

        if (filterBar) filterBar.style.display = shouldHideUI ? 'none' : 'block';
        if (fab) fab.style.display = shouldHideUI ? 'none' : 'flex';

        // 5. Scroll Management (Optional: Reset scroll on tab change?)
        // Ideally, we keep scroll position per tab (CSS overflow handles this naturally now)

        // 6. Refresh Data Helpers
        if (tabId !== 'home' && tabId !== 'stats') {
            if (typeof updateAllCategoryDropdowns === 'function') updateAllCategoryDropdowns();
        }

        renderApp();
    }

    // --- Setup Listeners ---
    function setupEventListeners() {
        console.log("Setting up event listeners...");

        // Tab Order for Swiping is now GLOBAL

        // Navigation (Bottom Nav)
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const target = item.dataset.target;
                console.log("Nav Item Clicked:", target);
                window.switchTab(target);
            });
        });

        // Home Action Buttons
        const homeBtns = document.querySelectorAll('.home-action-btn');
        homeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const nav = btn.dataset.nav;
                console.log("Home Button Clicked:", nav);
                if (nav) window.switchTab(nav);
            });
        });




        // Initialize Daily Quote
        if (typeof setupDailyQuote === 'function') {
            setupDailyQuote();
        }

        // Quick Add Modal Buttons (Refined)
        const btnSaveQA = document.getElementById('btn-save-qa');
        const btnCancelQA = document.querySelector('#modal-quick-add-category .modal-close-btn');

        // btnSaveQA listener removed to prevent double-save (handled by delegation)

        if (btnCancelQA) {
            btnCancelQA.addEventListener('click', (e) => {
                e.preventDefault();
                closeQAModal();
            });
        }

    });
        }

// --- Photo Input Listener ---
const photoInput = document.getElementById('qa-new-photo');
const photoPreview = document.getElementById('qa-photo-preview');
const btnRemovePhoto = document.getElementById('btn-remove-photo');

if (photoInput) {
    photoInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            console.log("Compressing image...");
            const base64 = await resizeImage(file, 800, 0.7);

            // Show preview
            const img = photoPreview.querySelector('img');
            if (img) img.src = base64;
            photoPreview.classList.remove('hidden');

            // Store in modal data for saving later
            const modal = document.getElementById('modal-quick-add-category');
            if (modal) modal.dataset.tempImage = base64;

        } catch (err) {
            console.error("Image compression error:", err);
            alert("Fotoğraf işlenirken hata oluştu.");
        }
    });
}

if (btnRemovePhoto) {
    btnRemovePhoto.addEventListener('click', () => {
        const modal = document.getElementById('modal-quick-add-category');
        if (modal) delete modal.dataset.tempImage;

        if (photoPreview) photoPreview.classList.add('hidden');
        if (photoInput) photoInput.value = '';
    });
}

// --- Image Viewer Modal (Simple) ---
window.viewImage = (src) => {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.9)';
    modal.style.zIndex = '9999';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.cursor = 'zoom-out';

    const img = document.createElement('img');
    img.src = src;
    img.style.maxWidth = '95%';
    img.style.maxHeight = '95%';
    img.style.objectFit = 'contain';
    img.style.borderRadius = '8px';

    modal.appendChild(img);
    modal.onclick = () => document.body.removeChild(modal);
    document.body.appendChild(modal);
};

// --- Inline Category Creation Toggle ---
const qaSelect = document.getElementById('qa-new-category-select');
const qaNewCatContainer = document.getElementById('qa-new-cat-container');
const qaNewCatInput = document.getElementById('qa-new-cat-input');

if (qaSelect && qaNewCatContainer) {
    qaSelect.addEventListener('change', (e) => {
        if (e.target.value === 'ADD_NEW') {
            qaNewCatContainer.classList.remove('hidden');
            if (qaNewCatInput) qaNewCatInput.focus();
        } else {
            qaNewCatContainer.classList.add('hidden');
        }
    });
}

// Generic close buttons are handled globally below, but specific ones help clarity
const btnSaveItem = document.getElementById('btn-save-item');
const btnCloseItem = document.getElementById('btn-close-item');
const btnCancelItem = document.getElementById('btn-cancel-item');

if (btnSaveItem) {
    btnSaveItem.addEventListener('click', () => {
        saveQuickAddItem();
    });
}

if (btnCloseItem) {
    btnCloseItem.addEventListener('click', closeQAModal);
}

if (btnCancelItem) {
    btnCancelItem.addEventListener('click', closeQAModal);
}



// Expose for inline HTML use to guarantee functionality
window.openSettings = function () {
    console.log("Settings Clicked (Inline)");

    try {
        // Try to reset state
        const sheet = document.querySelector('#modal-settings .settings-sheet');
        const body = document.querySelector('#modal-settings .settings-body');
        if (sheet) sheet.scrollTop = 0;
        if (body) body.scrollTop = 0;

        // Collapse special message
        const msgContent = document.getElementById('special-message-content');
        const msgChevron = document.getElementById('message-chevron');
        const msgCard = document.querySelector('.special-message-card');

        if (msgContent) msgContent.classList.remove('expanded');
        if (msgChevron) msgChevron.classList.remove('rotated');
        if (msgCard) msgCard.classList.remove('active');

    } catch (err) {
        console.warn("Error resetting settings state:", err);
    }

    document.body.classList.add('modal-open');

    const modal = document.getElementById('modal-settings');
    if (modal) {
        modal.style.display = 'flex'; // Force display
        modal.classList.remove('hidden');
        // Small delay to ensure display:block applies before opacity transition
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    } else {
        alert("Ayarlar menüsü bulunamadı.");
    }
};


// Header
if (btnSettings) {
    btnSettings.addEventListener('click', (e) => {
        console.log("Settings Clicked");
        e.preventDefault();
        e.stopPropagation();

        try {
            // Try to reset state, but don't block opening if it fails
            if (typeof resetSettingsState === 'function') {
                resetSettingsState();
            }
        } catch (err) {
            console.warn("Error resetting settings state:", err);
        }

        document.body.classList.add('modal-open');

        // Robust modal opening
        const modal = document.getElementById('modal-settings');
        if (modal) {
            modal.classList.remove('hidden');
            // Small delay to ensure display:block applies before opacity transition
            requestAnimationFrame(() => {
                modal.classList.add('active');
            });
        } else {
            console.error("Settings modal not found!");
            alert("Ayarlar menüsü yüklenemedi.");
        }
    });
}

// FAB
if (fab) {
    fab.addEventListener('click', () => {
        console.log("FAB Clicked");
        openQuickAddModal();
    });
}

// Features
if (btnManageCats) {
    btnManageCats.addEventListener('click', () => {
        renderCategoryManager();
        document.body.classList.add('modal-open'); // Add modal-open class
        if (modalCats) {
            modalCats.classList.remove('hidden');
            requestAnimationFrame(() => modalCats.classList.add('active'));
        }
    });
}


const btnAddCat = document.getElementById('btn-add-cat');
if (btnAddCat) btnAddCat.addEventListener('click', () => window.addCategory());

// Close category modal handlers
const closeModalCats = modalCats?.querySelectorAll('.close-modal-sheet');
closeModalCats?.forEach(btn => {
    btn.addEventListener('click', () => {
        modalCats.classList.remove('active');
        setTimeout(() => modalCats.classList.add('hidden'), 200);
        document.body.classList.remove('modal-open');
    });
});

// Close on backdrop click
modalCats?.querySelector('.modal-backdrop')?.addEventListener('click', () => {
    modalCats.classList.remove('active');
    setTimeout(() => modalCats.classList.add('hidden'), 200);
    document.body.classList.remove('modal-open');
});

// Enter key support and button activation for adding category
const newCatInput = document.getElementById('new-cat-input');
const btnAddCat2 = document.getElementById('btn-add-cat');

if (newCatInput && btnAddCat2) {
    // Initially disable button if empty
    btnAddCat2.disabled = !newCatInput.value.trim();

    // Enable/disable button based on input value
    newCatInput.addEventListener('input', (e) => {
        const hasValue = e.target.value.trim().length > 0;
        btnAddCat2.disabled = !hasValue;
    });

    // Enter key support
    newCatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            e.preventDefault();
            window.addCategory();
        }
    });
}

// Search listeners for modals
const catSearch = document.getElementById('cat-search');
if (catSearch) catSearch.addEventListener('input', (e) => renderCategoryManager(e.target.value));



// === EVENT DELEGATION FOR MODAL BUTTONS ===
// This handles all modal button clicks via delegation to avoid pointer-events issues
document.addEventListener('click', (e) => {
    const target = e.target;

    // Find if click was on or inside a button
    const button = target.closest('button');
    if (!button) return;

    const buttonId = button.id;
    console.log('🔘 Button clicked:', buttonId, button);

    // Handle close button
    if (buttonId === 'btn-close-item' || buttonId === 'btn-cancel-item' || button.classList.contains('modal-close')) {
        console.log('✅ Close/Cancel button detected:', buttonId);
        e.preventDefault();
        e.stopPropagation();
        closeQAModal();
        return;
    }

    // Handle save button
    if (buttonId === 'btn-save-item' || buttonId === 'btn-save-qa') {
        console.log('✅ Save button detected:', buttonId);
        e.preventDefault();
        e.stopPropagation();

        if (typeof saveQuickAddItem === 'function') {
            saveQuickAddItem();
        } else {
            console.error("CRITICAL: saveQuickAddItem function is missing!");
            alert("Kaydetme fonksiyonu bulunamadı!");
        }
        return;
    }

    // Handle edit button (Delegation)
    if (button.classList.contains('edit')) {
        const id = button.getAttribute('data-id');
        if (id) {
            const item = items.find(i => i.id == id);
            if (item) {
                e.preventDefault();
                e.stopPropagation();

                // Open edit modal directly (inline implementation)
                const qaModal = document.getElementById('modal-quick-add-category');
                const qaName = document.getElementById('qa-new-product-name');
                const qaSelect = document.getElementById('qa-new-category-select');
                const qaQty = document.getElementById('qa-new-qty');
                const qaPrice = document.getElementById('qa-new-price');
                const qaNote = document.getElementById('qa-new-note');
                const qaError = document.getElementById('qa-new-error-msg');
                const modalTitle = qaModal?.querySelector('.modal-header h2');

                if (!qaModal) {
                    alert('Modal bulunamadı!');
                    return;
                }

                // Set modal to edit mode
                qaModal.dataset.editId = item.id;
                if (modalTitle) modalTitle.textContent = 'Ürünü Düzenle';

                // Fill form
                if (qaName) qaName.value = item.name;
                if (qaQty) qaQty.value = item.quantity || 1;
                if (qaPrice) qaPrice.value = item.price || '';
                if (qaNote) qaNote.value = item.note || '';
                const qaLink = document.getElementById('qa-new-link');
                if (qaLink) qaLink.value = item.link || '';

                // Populate Photo Preview (Delegation Block)
                const qaPhotoInput = document.getElementById('qa-new-photo');
                const qaPhotoPreview = document.getElementById('qa-photo-preview');
                const qaPhotoImg = qaPhotoPreview?.querySelector('img');

                if (qaPhotoPreview && qaPhotoImg) {
                    if (item.image) {
                        qaPhotoImg.src = item.image;
                        qaPhotoPreview.classList.remove('hidden');
                        qaModal.dataset.tempImage = item.image;
                    } else {
                        qaPhotoPreview.classList.add('hidden');
                        qaPhotoImg.src = '';
                        delete qaModal.dataset.tempImage;
                    }
                    if (qaPhotoInput) qaPhotoInput.value = '';
                }

                if (qaError) qaError.classList.add('hidden');

                // Populate categories
                if (qaSelect) {
                    qaSelect.innerHTML = '<option value="" disabled>Kategori Seçiniz</option>';
                    let cats = (item.type === 'damat' ? userCategories.damat : userCategories.ceyiz) || [];

                    // Fallback to defaults if empty
                    if (cats.length === 0) {
                        cats = (item.type === 'damat' ? defaultCategories.damat : defaultCategories.ceyiz);
                    }

                    cats.forEach(c => {
                        const opt = document.createElement('option');
                        opt.value = c;
                        opt.textContent = c;
                        if (c === item.category) opt.selected = true;
                        qaSelect.appendChild(opt);
                    });
                }

                // Open modal
                qaModal.classList.remove('hidden');
                requestAnimationFrame(() => qaModal.classList.add('active'));
                document.body.classList.add('modal-open');

                if (qaName) qaName.focus();
            } else {
                console.error('Item not found for ID:', id);
            }
        }
        return;
    }
}, true); // Use capture phase to catch events early

console.log('✅ Event delegation for modal buttons is ACTIVE');

// Home Action Buttons
// Duplicate listeners removed


// Form
if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-id').value;
        const name = document.getElementById('item-name').value;
        const category = document.getElementById('item-category').value;
        const quantity = parseInt(document.getElementById('item-quantity').value);
        const price = parseFloat(document.getElementById('item-price').value) || 0;
        const isBought = document.getElementById('item-bought').checked;
        const note = document.getElementById('item-note').value;

        let type = currentTab === 'stats' ? 'ceyiz' : currentTab;
        if (id) {
            const existing = items.find(i => i.id == id);
            if (existing) type = existing.type;
        }
        lastSelectedCategory = category;
        const newData = { name, category, quantity, price, isBought, note, type };

        if (id) {
            const idx = items.findIndex(i => i.id == id);
            if (idx > -1) items[idx] = { ...items[idx], ...newData };
        } else {
            items.push({ id: Date.now(), ...newData });
        }
        saveData();
        renderApp();
        if (modalForm) {
            modalForm.classList.remove('active');
            setTimeout(() => modalForm.classList.add('hidden'), 200);
        }
        form.reset();
    });
}

// Modals Close (Generic for all modals including new sheets)
// Close on X button
document.querySelectorAll('.close-modal, .close-modal-sheet, .close-modal-settings, .modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.classList.add('hidden'), 200);
            document.body.classList.remove('modal-open');
        }
    });
});

// Close on Backdrop Click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('modal-backdrop')) {
            modal.classList.remove('active');
            setTimeout(() => modal.classList.add('hidden'), 200);
        }
    });
});

// Close on ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
            setTimeout(() => modal.classList.add('hidden'), 200);
        });
    }
});


// Welcome
if (typeof btnWelcomeClose !== 'undefined' && btnWelcomeClose) btnWelcomeClose.addEventListener('click', closeWelcome);

// --- Settings Listeners ---
// Dark Mode
if (darkModeToggle) {
    darkModeToggle.addEventListener('change', (e) => {
        settings.darkMode = e.target.checked;
        saveSettings();
    });
}

// Settings SAVE
const btnSaveProfile = document.getElementById('btn-save-profile');
if (btnSaveProfile) {
    btnSaveProfile.addEventListener('click', () => {
        if (sNikah && sNikah.value) {
            const nikahDate = new Date(sNikah.value);
            if (isNaN(nikahDate.getTime())) {
                alert('Geçersiz nikah tarihi! Lütfen doğru bir tarih girin.');
                return;
            }
        }

        // Check if nikah is after nisan
        if (sNisan && sNisan.value && sNikah && sNikah.value) {
            const nisanDate = new Date(sNisan.value);
            const nikahDate = new Date(sNikah.value);
            if (nikahDate < nisanDate) {
                alert('Nikah tarihi nişan tarihinden önce olamaz!');
                return;
            }
        }

        // Save values
        if (sNisan && sNisan.value) settings.dates.engagement = sNisan.value;
        if (sNikah && sNikah.value) settings.dates.wedding = sNikah.value;

        saveSettings();

        // CRITICAL: Update home screen countdowns immediately
        updateHomeCountdowns();

        showToast('Ayarlar kaydedildi ✨', false);
    });
}

// Font size settings removed

// Animations Flow
const animToggle = document.getElementById('animations-toggle');
if (animToggle) {
    animToggle.addEventListener('change', (e) => {
        settings.appearance.animations = e.target.checked;
        saveSettings();
    });
}

// (sSaveFeedback handler removed as ID is gone)

// Special Message Toggle  
// --- Special Message Toggle (Global Function) ---
window.toggleSpecialMessage = function () {
    console.log("💌 toggleSpecialMessage CALLED");
    const messageContent = document.getElementById('special-message-content');
    const messageChevron = document.getElementById('message-chevron');
    const messageCard = document.querySelector('.special-message-card');

    if (!messageContent) {
        console.error("Special message content not found");
        return;
    }

    const isExpanded = messageContent.classList.contains('expanded');

    if (isExpanded) {
        messageContent.classList.remove('expanded');
        if (messageChevron) messageChevron.classList.remove('rotated');
        if (messageCard) messageCard.classList.remove('active');
    } else {
        messageContent.classList.add('expanded');
        if (messageChevron) messageChevron.classList.add('rotated');
        if (messageCard) messageCard.classList.add('active');
    }
};

// Safety check just in case onclick isn't enough (Event Listener Backup)
const mh = document.getElementById('special-message-header');
if (mh) {
    mh.onclick = window.toggleSpecialMessage;
}


// Data Management
document.getElementById('btn-backup-copy').addEventListener('click', () => {
    const dataStr = JSON.stringify(items);
    navigator.clipboard.writeText(dataStr).then(() => {
        showToast('Yedek kopyalandı 📋', false);
    });
});

document.getElementById('btn-import-paste').addEventListener('click', () => {
    const area = document.getElementById('import-area');
    if (area.classList.contains('hidden')) {
        area.classList.remove('hidden');
        area.focus();
        document.getElementById('btn-import-paste').innerHTML = '<i class="fas fa-check"></i> Onayla ve Yükle';
    } else {
        try {
            const val = area.value.trim();
            if (!val) return;
            const data = JSON.parse(val);
            if (Array.isArray(data) && confirm('Geri yükleme yapılsın mı? Mevcut liste silinecek.')) {
                items = data;
                saveData();
                renderApp();
                showToast('Yedek başarıyla yüklendi ✅', false);
                area.value = '';
                area.classList.add('hidden');
                document.getElementById('btn-import-paste').innerHTML = '<i class="fas fa-paste"></i> İçe Aktar (Yapıştır)';
            }
        } catch (e) { alert('Hatalı veri formatı!'); }
    }
});

document.getElementById('btn-reset-data').addEventListener('click', () => {
    if (confirm('DİKKAT! Tüm liste kalıcı olarak silinecek. Emin misiniz?')) {
        items = [];
        saveData();
        renderApp();
        showToast('Tüm veriler sıfırlandı.', false);
    }
});


// Undo
if (btnUndo) {
    btnUndo.addEventListener('click', () => {
        if (pendingDeleteItem) {
            items.push(pendingDeleteItem);
            saveData();
            renderApp();
            pendingDeleteItem = null;
            if (toastContainer) toastContainer.classList.add('hidden');
            clearTimeout(undoTimeout);
        }
    });
}

// Redundant Navigation Block Removed

// Filters
if (searchInput) searchInput.addEventListener('input', () => renderList(currentTab));
if (categoryFilter) categoryFilter.addEventListener('change', () => renderList(currentTab));
if (statusFilter) statusFilter.addEventListener('change', () => renderList(currentTab));

// Export/Import (Legacy Check - only add if elements exist)
if (btnExport) {
    btnExport.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items));
        const dl = document.createElement('a');
        dl.setAttribute("href", dataStr);
        dl.setAttribute("download", "sevval_ceyiz_yedek.json");
        document.body.appendChild(dl); dl.click(); dl.remove();
    });
}
if (btnImport && fileImport) {
    btnImport.addEventListener('click', () => fileImport.click());
    fileImport.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const r = new FileReader();
        r.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                if (Array.isArray(data) && confirm('Liste geri yüklensin mi?')) { items = data; saveData(); renderApp(); }
            } catch (err) { alert('Hata: ' + err); }
        };
        r.readAsText(file);
    });
}
// --- Header Countdown Logic ---
let headerTimerInterval = null;

function startHeaderCountdowns() {
    const container = document.getElementById('header-countdowns');
    if (!container) return;

    function update() {
        // Get Dates
        const nisanStr = settings.dates?.engagement;
        const nikahStr = settings.dates?.wedding;
        const now = new Date().getTime();

        // 1. HEADER (Compact) - REMOVED per user request
        // const container = document.getElementById('header-countdowns');
        // if (container) { ... }

        // 2. STATS SECTION (Detailed) - REMOVED per user request

        const formatStats = (targetStr) => {
            if (!targetStr) return 'Tarih seçilmedi';
            const target = new Date(targetStr + 'T00:00:00').getTime();
            const diff = target - now;

            if (diff < 0) return "Gerçekleşti ✅";

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            // User requested days, hours, minutes. Seconds optional? User didn't ask for seconds in the specific format, but "XX gün XX saat XX dakika" implies no seconds.
            // Let's stick to D/H/M.

            return `${days} gün ${hours} saat ${minutes} dakika`;
        };

        // 
        // if (elStatsNisan) elStatsNisan.textContent = formatStats(nisanStr);
        // if (elStatsNikah) elStatsNikah.textContent = formatStats(nikahStr);
    }

    // Run immediately then interval
    update();
    if (headerTimerInterval) clearInterval(headerTimerInterval);
    headerTimerInterval = setInterval(update, 1000);
}

// Call on start
startHeaderCountdowns();

// Hook into saveSettings (Patch existing function or append logic?)
// Since I can't easily patch the insides of saveSettings with this tool without replacing it,
// I will redefine saveSettings or add a listener if possible. 
// Actually, I can just override the global references if any, but `saveSettings` is local.
// I will use a reliable replace on `updateCountdowns` to also call `startHeaderCountdowns`.

// Override existing updateCountdowns to also start header timer
const originalUpdateCountdowns = updateCountdowns;
updateCountdowns = function () {
    if (typeof originalUpdateCountdowns === 'function') originalUpdateCountdowns();
    startHeaderCountdowns();
};
// --- ADDED: Long Press on Countdown (Settings) ---
function setupLongPressForCountdown() {
    const countdownCard = document.querySelector('.unified-countdown-card');
    if (!countdownCard) return;

    // Visual feedback via CSS (optional but nice)
    countdownCard.style.cursor = 'pointer';

    let pressTimer;
    const LONG_PRESS_DURATION = 800; // ms

    function startPress(e) {
        // Ignore right click
        if (e.type === 'mousedown' && e.button !== 0) return;

        // Visual feedback: slightly scale down
        countdownCard.style.transform = 'scale(0.98)';
        countdownCard.style.transition = 'transform 0.2s';

        pressTimer = setTimeout(() => {
            // Open Settings Modal
            if (modalSettings) {
                resetSettingsState(); // Ensure cleaner state
                document.body.classList.add('modal-open');
                modalSettings.classList.remove('hidden');
                requestAnimationFrame(() => modalSettings.classList.add('active'));
                showToast("Ayarlar açıldı ⚙️", false);

                // Reset visual
                countdownCard.style.transform = 'scale(1)';
            }
        }, LONG_PRESS_DURATION);
    }

    function cancelPress() {
        clearTimeout(pressTimer);
        // Reset visual
        countdownCard.style.transform = 'scale(1)';
    }

    // Mouse Events
    countdownCard.addEventListener('mousedown', startPress);
    countdownCard.addEventListener('mouseup', cancelPress);
    countdownCard.addEventListener('mouseleave', cancelPress);

    // Touch Events
    countdownCard.addEventListener('touchstart', (e) => {
        startPress(e);
    }, { passive: true });

    countdownCard.addEventListener('touchend', cancelPress);
    countdownCard.addEventListener('touchcancel', cancelPress);

    // Prevent context menu on long press (mobile)
    countdownCard.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
}
setupLongPressForCountdown();

// --- Swipe Navigation (Instagram-style) ---
// --- Swipe Navigation (Instagram-style) ---
// --- Swipe Navigation (Instagram-style) ---
function setupSwipeNavigation() {
    const container = document.getElementById('swipe-container');
    if (!container) return;

    let startX = 0;
    let startY = 0;
    let isDragging = false;
    let isVerticalScroll = false;

    container.addEventListener('touchstart', (e) => {
        // Ignore if touching a carousel (which has its own logic)
        if (e.target.closest('.countdown-carousel-wrapper')) return;

        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = true;
        isVerticalScroll = false; // Reset assumption
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
        if (!isDragging || isVerticalScroll) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = startX - currentX;
        const diffY = startY - currentY;

        // 1. Detect Axis
        if (Math.abs(diffY) > Math.abs(diffX)) {
            isVerticalScroll = true; // User is scrolling list
            return; // Let browser handle scroll
        }

        // 2. Horizontal Swipe Logic
        // If pure horizontal, we might want to preventDefault to stop browser 'back' gesture?
        // But for now, let's just observe. 
        // To be robust, if it's horizontal, we prevent default to stop scrolling sideways?
        // container has overflow-x hidden, so maybe not needed.

        if (Math.abs(diffX) > 10) {
            e.preventDefault(); // Lock scroll while swiping
        }
    }, { passive: false });

    container.addEventListener('touchend', (e) => {
        if (!isDragging || isVerticalScroll) {
            isDragging = false;
            return;
        }

        const endX = e.changedTouches[0].clientX;
        const diffX = startX - endX;
        const threshold = 80; // Min px to trigger swipe

        if (Math.abs(diffX) > threshold) {
            // Current Tab Index?
            // We need to know current active tab order:
            // 0: Stats, 1: Home, 2: Ceyiz, 3: Damat
            const order = ['stats', 'home', 'ceyiz', 'damat'];
            const currentTab = window.appData.currentTab || 'home';
            let idx = order.indexOf(currentTab);
            if (idx === -1) idx = 1; // Default to home

            if (diffX > 0) {
                // Swipe LEFT -> Next Tab
                if (idx < order.length - 1) {
                    switchTab(order[idx + 1]);
                }
            } else {
                // Swipe RIGHT -> Prev Tab
                if (idx > 0) {
                    switchTab(order[idx - 1]);
                }
            }
        }

        isDragging = false;
    });
}
// setupSwipeNavigation(); // Temporarily Disabled to fix scroll issues


// --- CAROUSEL & CALENDAR LOGIC (Phase 6) ---
function setupCarouselAndCalendar() {
    const track = document.getElementById('home-carousel-track');
    const wrapper = document.querySelector('.countdown-carousel-wrapper');
    const dots = document.querySelectorAll('.c-dot');
    const prevBtn = document.getElementById('cal-prev-month');
    const nextBtn = document.getElementById('cal-next-month');
    const monthLabel = document.getElementById('cal-month-year');
    const grid = document.getElementById('calendar-grid');

    if (!track || !wrapper) return;

    let currentSlide = 0;
    let startX = 0;
    let isDragging = false;

    // Carousel Navigation
    function updateCarousel() {
        track.style.transform = `translateX(-${currentSlide * 100}%)`;
        dots.forEach((dot, idx) => {
            if (idx === currentSlide) dot.classList.add('active');
            else dot.classList.remove('active');
        });
    }

    // Swipe Logic
    wrapper.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
    }, { passive: true });

    wrapper.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        // Optional: add resistance logic here if needed
    }, { passive: true });

    wrapper.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        const endX = e.changedTouches[0].clientX;
        const diff = startX - endX;

        // Threshold for swipe
        if (Math.abs(diff) > 50) {
            const totalSlides = dots.length || 2;
            if (diff > 0) {
                // Swipe Left
                if (currentSlide < totalSlides - 1) {
                    currentSlide++;
                    updateCarousel();
                    e.stopPropagation(); // Don't let global handler switch tabs too!
                } else {
                    // Boundary! Let global handler handle it
                    isDragging = false;
                }
            } else {
                // Swipe Right
                if (currentSlide > 0) {
                    currentSlide--;
                    updateCarousel();
                    e.stopPropagation(); // Don't let global handler switch tabs too!
                } else {
                    // Boundary! Let global handler handle it
                    isDragging = false;
                }
            }
        }
        isDragging = false;
    });

    // Dot Click
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const slide = parseInt(dot.dataset.slide);
            currentSlide = slide;
            updateCarousel();
        });
    });


    // --- Calendar Logic ---
    let calDate = new Date(); // Current viewing month

    function renderCalendar() {
        if (!grid || !monthLabel) return;
        grid.innerHTML = '';

        const year = calDate.getFullYear();
        const month = calDate.getMonth();

        // Format Month
        const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
        monthLabel.textContent = `${monthNames[month]} ${year}`;

        // Calculate Days
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
        // Adjust for Monday start (Turkey default)
        // 0 (Sun) -> 6, 1 (Mon) -> 0
        const startOffset = (firstDay === 0) ? 6 : firstDay - 1;

        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Get special dates
        const today = new Date();
        const nisanDate = settings.dates?.engagement ? new Date(settings.dates.engagement) : null;
        const nikahDate = settings.dates?.wedding ? new Date(settings.dates.wedding) : null;

        // Empty Slots
        for (let i = 0; i < startOffset; i++) {
            const el = document.createElement('div');
            el.className = 'cal-day empty';
            grid.appendChild(el);
        }

        // Days
        for (let d = 1; d <= daysInMonth; d++) {
            const el = document.createElement('div');
            el.className = 'cal-day clickable-day';

            const numSpan = document.createElement('span');
            numSpan.textContent = d;
            el.appendChild(numSpan);

            const dayDate = new Date(year, month, d);
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            setupDayLongPress(el, dateKey);

            // Check Today
            if (dayDate.toDateString() === today.toDateString()) {
                el.classList.add('today');
            }

            // Check Special Dates
            let hasEvent = false;
            let eventColor = '';

            // 1. System Events
            if (nisanDate && dayDate.toDateString() === nisanDate.toDateString()) {
                hasEvent = true;
                eventColor = 'var(--primary-color)';
            }
            if (nikahDate && dayDate.toDateString() === nikahDate.toDateString()) {
                hasEvent = true;
                eventColor = 'var(--primary-color)';
            }

            // 2. Custom Notes (Blue/Purple)
            // Ensure customEvents exists
            if (!settings.customEvents) settings.customEvents = {};

            if (settings.customEvents[dateKey]) {
                hasEvent = true;
                // Use a distinct color for custom notes (purple-ish)
                // If it overlaps with system event, system event color (primary) might be preferred? 
                // Or maybe show multiple dots? 
                // For now, let's allow overwrite or if already set keep primary.
                if (!eventColor) eventColor = '#a29bfe';
            }

            if (hasEvent) {
                const dot = document.createElement('div');
                dot.className = 'event-dot';
                dot.style.backgroundColor = eventColor;
                el.appendChild(dot);
            }

            grid.appendChild(el);
        }
    }

    // --- DAY INTERACTION (Long Press) ---
    function setupDayLongPress(el, dateKey) {
        let pressTimer;
        const PRESS_DURATION = 600;

        const start = (e) => {
            // Start timer
            el.style.transform = 'scale(0.9)';
            el.style.transition = 'transform 0.2s';

            pressTimer = setTimeout(() => {
                openDayModal(dateKey);
                // Reset
                el.style.transform = 'scale(1)';
            }, PRESS_DURATION);
        };

        const cancel = (e) => {
            clearTimeout(pressTimer);
            el.style.transform = 'scale(1)';
        };

        el.addEventListener('mousedown', start);
        el.addEventListener('mouseup', cancel);
        el.addEventListener('mouseleave', cancel);
        el.addEventListener('touchstart', start, { passive: true });
        el.addEventListener('touchend', cancel);
    }

    // --- MODAL LOGIC ---
    function openDayModal(dateKey) {
        const modalDetails = document.getElementById('modal-day-details');
        const detailsDateStr = document.getElementById('day-details-date');
        const noteInput = document.getElementById('day-note-input');
        const btnSave = document.getElementById('btn-save-day');
        const btnDelete = document.getElementById('btn-delete-day');

        if (!modalDetails) return;

        let selectedDateKey = dateKey;
        const parts = dateKey.split('-');
        detailsDateStr.textContent = `${parts[2]}.${parts[1]}.${parts[0]}`;

        // Populate Note
        // Ensure settings.customEvents exists
        if (!settings.customEvents) settings.customEvents = {};

        const eventData = settings.customEvents[dateKey];
        if (eventData) {
            noteInput.value = eventData.note || '';
            btnDelete.style.display = 'block';
        } else {
            noteInput.value = '';
            btnDelete.style.display = 'none';
        }

        document.body.classList.add('modal-open');
        modalDetails.classList.remove('hidden');
        requestAnimationFrame(() => modalDetails.classList.add('active'));
        setTimeout(() => noteInput.focus(), 100);

        // Bind Actions (Rebind to capture closure variables if needed, or stick to simple)
        // Actually better to define these once outside? 
        // Since this is inside setupCarouselAndCalendar, we can define once.

        // One-time Setup check? NO, simpler to just re-assign onclick here for the closure `selectedDateKey`
        // BUT we need to be careful of multiple bindings if we defined it outside.
        // Let's bind here.

        btnSave.onclick = () => {
            const note = noteInput.value.trim();
            if (note) {
                settings.customEvents[selectedDateKey] = { note: note };
                showToast('Not kaydedildi 📝');
            } else {
                delete settings.customEvents[selectedDateKey];
            }
            saveSettings();
            renderCalendar();
            closeDayModal();
        };

        btnDelete.onclick = () => {
            if (settings.customEvents[selectedDateKey]) {
                delete settings.customEvents[selectedDateKey];
                saveSettings();
                renderCalendar();
                showToast('Not silindi 🗑️');
            }
            closeDayModal();
        };
    }

    function closeDayModal() {
        const modalDetails = document.getElementById('modal-day-details');
        if (modalDetails) modalDetails.classList.add('hidden');
        document.body.classList.remove('modal-open');
    }

    // Static binds
    const btnCloseDetails = document.getElementById('close-day-details');
    if (btnCloseDetails) btnCloseDetails.onclick = closeDayModal;
    const modalDetails = document.getElementById('modal-day-details');
    if (modalDetails) {
        const backdrop = modalDetails.querySelector('.modal-backdrop');
        if (backdrop) backdrop.onclick = closeDayModal;
    }


    // Nav Listeners
    if (prevBtn) prevBtn.addEventListener('click', () => {
        calDate.setMonth(calDate.getMonth() - 1);
        renderCalendar();
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
        calDate.setMonth(calDate.getMonth() + 1);
        renderCalendar();
    });

    // --- FULL CALENDAR MODAL LOGIC (New) ---
    const fullModal = document.getElementById('modal-full-calendar');
    const fullGrid = document.getElementById('full-calendar-grid');
    const fullMonthLabel = document.getElementById('full-cal-month-year');
    const fullPrev = document.getElementById('full-cal-prev');
    const fullNext = document.getElementById('full-cal-next');
    const fullEventList = document.getElementById('full-cal-event-list');
    const btnCloseFull = document.getElementById('close-full-cal');

    // Re-use logic but separate date state so full cal can browse independently
    let fullCalDate = new Date();

    function renderFullCalendar() {
        if (!fullGrid || !fullMonthLabel) return;
        fullGrid.innerHTML = '';

        const year = fullCalDate.getFullYear();
        const month = fullCalDate.getMonth();
        const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
        fullMonthLabel.textContent = `${monthNames[month]} ${year}`;

        const firstDay = new Date(year, month, 1).getDay();
        const startOffset = (firstDay === 0) ? 6 : firstDay - 1;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        // Special Days List (Static for 2026/Recurring)
        const specialDays = [
            { d: 1, m: 0, msg: "Yılbaşı 🎄" }, // Jan 1
            { d: 14, m: 1, msg: "Sevgililer Günü ❤️", color: '#ff6b6b' }, // Feb 14
            { d: 23, m: 3, msg: "23 Nisan 🇹🇷" }, // Apr 23
            { d: 1, m: 4, msg: "Emek ve Dayanışma Günü" }, // May 1
            { d: 19, m: 4, msg: "19 Mayıs 🇹🇷" }, // May 19
            { d: 15, m: 6, msg: "15 Temmuz 🇹🇷" }, // Jul 15
            { d: 30, m: 7, msg: "30 Ağustos 🇹🇷" }, // Aug 30
            { d: 29, m: 9, msg: "29 Ekim 🇹🇷" } // Oct 29
            // Religious holidays need dynamic calc or static list for 2026-2027
            // For now, these fixed ones cover user request + Valentine's.
        ];

        // Empty Slots
        for (let i = 0; i < startOffset; i++) {
            const el = document.createElement('div');
            el.className = 'cal-day empty';
            fullGrid.appendChild(el);
        }

        // Days
        for (let d = 1; d <= daysInMonth; d++) {
            const el = document.createElement('div');
            el.className = 'cal-day clickable-day';

            const numSpan = document.createElement('span');
            numSpan.textContent = d;
            el.appendChild(numSpan);

            const dayDate = new Date(year, month, d);
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            el.dataset.date = dateKey;

            // Bind Long Press & Click
            setupDayLongPress(el, dateKey);

            // Click to Note removed (User requested long-press explicitly)
            // el.onclick = () => { openDayModal(dateKey); };

            if (dayDate.toDateString() === today.toDateString()) el.classList.add('today');

            // Check Events
            let hasEvent = false;
            let eventColor = '';

            // 1. Defined Special Days
            const special = specialDays.find(s => s.d === d && s.m === month);
            if (special) {
                hasEvent = true;
                eventColor = special.color || 'var(--primary-color)';
            }

            // 2. System Dates
            const nisanDate = settings.dates?.engagement ? new Date(settings.dates.engagement) : null;
            const nikahDate = settings.dates?.wedding ? new Date(settings.dates.wedding) : null;

            if (nisanDate && dayDate.toDateString() === nisanDate.toDateString()) {
                hasEvent = true;
                eventColor = 'var(--primary-color)';
            }
            if (nikahDate && dayDate.toDateString() === nikahDate.toDateString()) {
                hasEvent = true;
                eventColor = 'var(--primary-color)';
            }

            // 3. Custom Notes
            if (!settings.customEvents) settings.customEvents = {};
            if (settings.customEvents[dateKey]) {
                hasEvent = true;
                // Distinction: If multiple events, ideally show multiple dots or split.
                // For simplicity, custom note overrides color or we check priority.
                // User wants special days marked.
                // If it's Valentine's AND I have a note, maybe Valentine color wins? or Note color?
                // Let's stick to Note Color (Purple) if Note exists, else Special Day Color.
                if (settings.customEvents[dateKey]) eventColor = '#a29bfe';
            }

            if (hasEvent) {
                const dot = document.createElement('div');
                dot.className = 'event-dot';
                dot.style.backgroundColor = eventColor;
                el.appendChild(dot);
            }
            fullGrid.appendChild(el);
        }

        renderUpcomingEventsList(specialDays);
    }

    function renderUpcomingEventsList(specialDays) {
        if (!fullEventList) return;
        fullEventList.innerHTML = '';

        const year = fullCalDate.getFullYear();
        const month = fullCalDate.getMonth();

        let events = [];

        // 1. Static Special Days
        specialDays.forEach(s => {
            if (s.m === month) {
                events.push({ d: s.d, msg: s.msg, color: s.color || 'var(--primary-color)' });
            }
        });

        // 2. System
        const nisanDate = settings.dates?.engagement ? new Date(settings.dates.engagement) : null;
        const nikahDate = settings.dates?.wedding ? new Date(settings.dates.wedding) : null;

        if (nisanDate && nisanDate.getFullYear() === year && nisanDate.getMonth() === month) {
            events.push({ d: nisanDate.getDate(), msg: "Nişan 💍", color: "var(--primary-color)" });
        }
        if (nikahDate && nikahDate.getFullYear() === year && nikahDate.getMonth() === month) {
            events.push({ d: nikahDate.getDate(), msg: "Nikah 🤍", color: "var(--primary-color)" });
        }

        // 3. Custom
        if (settings.customEvents) {
            for (const [key, val] of Object.entries(settings.customEvents)) {
                const [y, m, d] = key.split('-').map(Number);
                if (y === year && m === (month + 1)) {
                    events.push({ d: d, msg: val.note, color: "#a29bfe" });
                }
            }
        }

        events.sort((a, b) => a.d - b.d);

        // Deduplicate? (e.g. Valentine's Note + Holiday) - Keep all for list

        if (events.length === 0) {
            fullEventList.innerHTML = '<div style="padding:1rem; text-align:center;">Bu ay özel bir gün yok.</div>';
            return;
        }

        events.forEach(ev => {
            const row = document.createElement('div');
            row.className = 'event-list-item';
            row.innerHTML = `<div class="date-circle" style="color:${ev.color === '#a29bfe' ? '#6c5ce7' : 'var(--primary-color)'}; opacity:0.9;">${ev.d}</div><div class="note-text">${ev.msg}</div>`;
            fullEventList.appendChild(row);
        });
    }

    function openFullModal() {
        if (!fullModal) return;
        // Sync date
        fullCalDate = new Date();
        renderFullCalendar();
        document.body.classList.add('modal-open');
        fullModal.classList.remove('hidden');
        requestAnimationFrame(() => fullModal.classList.add('active'));
    }
    function closeFullModal() {
        if (fullModal) fullModal.classList.add('hidden');
        document.body.classList.remove('modal-open'); // Warning: might conflict if DayModal is also active?
        // But DayModal opens ON TOP of FullModal ideally. 
        // If we close FullModal, we assume DayModal is closed.
    }

    if (btnCloseFull) btnCloseFull.onclick = closeFullModal;
    if (fullModal) {
        const backdrop = fullModal.querySelector('.modal-backdrop');
        if (backdrop) backdrop.onclick = closeFullModal;
    }

    // Bind Click on Small Calendar Card
    const smallCalCard = document.querySelector('.calendar-card');
    if (smallCalCard) {
        smallCalCard.addEventListener('click', (e) => {
            // Ignore clicks on prev/next buttons
            if (e.target.closest('.cal-nav-btn')) return;
            // Also ignore if clicking a day?
            // User said "takvimin herhangi bir yerine". 
            // If they click a day, maybe they want to open detail directly?
            // But currently we have long press for detail on small cal.
            // Let's make "Click" -> Open Full Modal universally for now.
            openFullModal();
        });
    }

    // Full Cal Nav
    if (fullPrev) fullPrev.onclick = () => {
        if (fullCalView === 'year') {
            fullCalDate.setFullYear(fullCalDate.getFullYear() - 1);
        } else {
            fullCalDate.setMonth(fullCalDate.getMonth() - 1);
        }
        renderFullCalendar();
    };
    if (fullNext) fullNext.onclick = () => {
        if (fullCalView === 'year') {
            fullCalDate.setFullYear(fullCalDate.getFullYear() + 1);
        } else {
            fullCalDate.setMonth(fullCalDate.getMonth() + 1);
        }
        renderFullCalendar();
    };

    // --- Full Cal Swipe & Zoom Logic ---
    let fullCalView = 'month'; // 'month' or 'year'

    // Render Year View
    function renderYearGridView() {
        if (!fullGrid || !fullMonthLabel) return;
        fullGrid.innerHTML = '';

        const year = fullCalDate.getFullYear();
        fullMonthLabel.textContent = `${year}`;

        // Hide day headers and event list in year mode?
        const daysHeader = fullModal.querySelector('.calendar-days-header');
        if (daysHeader) daysHeader.style.display = 'none';
        if (fullEventList) fullEventList.parentElement.style.display = 'none';

        // Year Grid Style
        fullGrid.style.display = 'grid';
        fullGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        fullGrid.style.rowGap = '1rem';
        fullGrid.style.padding = '1rem 0';

        const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

        monthNames.forEach((mName, idx) => {
            const mEl = document.createElement('div');
            mEl.className = 'year-month-item';
            mEl.textContent = mName;
            mEl.style.padding = '1rem';
            mEl.style.textAlign = 'center';
            mEl.style.background = 'var(--surface-color)';
            mEl.style.borderRadius = '12px';
            mEl.style.fontWeight = '500';
            mEl.style.cursor = 'pointer';

            if (idx === new Date().getMonth() && year === new Date().getFullYear()) {
                mEl.style.color = 'var(--primary-color)';
                mEl.style.fontWeight = '700';
            }

            mEl.onclick = () => {
                fullCalDate.setMonth(idx);
                fullCalView = 'month';
                renderFullCalendar();
            };

            fullGrid.appendChild(mEl);
        });
    }

    // Wrap renderFullCalendar to dispatch
    const originalRenderFull = renderFullCalendar;
    renderFullCalendar = function () {
        if (fullCalView === 'year') {
            renderYearGridView();
        } else {
            // Restore styles for month view
            const daysHeader = fullModal.querySelector('.calendar-days-header');
            if (daysHeader) daysHeader.style.display = 'grid';
            if (fullEventList) fullEventList.parentElement.style.display = 'block';
            fullGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';
            fullGrid.style.rowGap = '8px';
            fullGrid.style.padding = '0';

            originalRenderFull();
        }
    };

    // Gestures
    let fcStartX = 0;
    let fcStartY = 0; // For pinch calc maybe?
    let initialPinchDist = 0;
    let isPinching = false;

    const getDist = (touches) => {
        return Math.hypot(
            touches[0].pageX - touches[1].pageX,
            touches[0].pageY - touches[1].pageY
        );
    };

    const sheetBody = fullModal.querySelector('.sheet-body');
    if (sheetBody) {
        sheetBody.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                fcStartX = e.touches[0].clientX;
                isPinching = false;
            } else if (e.touches.length === 2) {
                isPinching = true;
                initialPinchDist = getDist(e.touches);
            }
        }, { passive: true });

        sheetBody.addEventListener('touchmove', (e) => {
            if (isPinching && e.touches.length === 2) {
                e.preventDefault(); // Prevent scroll while pinching
            }
        }, { passive: false }); // Need false to prevent default

        sheetBody.addEventListener('touchend', (e) => {
            if (isPinching && e.touches.length < 2) {
                // End Pinch
                // Just wait for logic or check changedTouches? 
                // Easier to check 'touchmove' but simple pinch logic usually done on end or throttle move.
                // Let's rely on stored distance vs final distance?
                // Actually standard pinch API involves 'touchmove'.
                isPinching = false;
                return;
            }

            if (!isPinching && e.changedTouches.length === 1) {
                // Swipe Logic
                const endX = e.changedTouches[0].clientX;
                const diff = fcStartX - endX;
                if (Math.abs(diff) > 60) {
                    if (diff > 0) fullNext.click();
                    else fullPrev.click();
                }
            }
        });

        // Pinch Logic on Move
        sheetBody.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                const dist = getDist(e.touches);
                // Threshold
                if (Math.abs(dist - initialPinchDist) > 50) {
                    if (dist < initialPinchDist) {
                        // Pinch In -> Zoom Out -> Year View
                        if (fullCalView !== 'year') {
                            fullCalView = 'year';
                            renderFullCalendar();
                            isPinching = false; // Trigger once
                        }
                    } else {
                        // Pinch Out -> Zoom In -> Month View
                        if (fullCalView === 'year') {
                            fullCalView = 'month';
                            renderFullCalendar();
                            isPinching = false;
                        }
                    }
                }
            }
        }, { passive: false });
    }



    // Initial Render
    renderCalendar();
}
setupCarouselAndCalendar();
    } // End of setupEventListeners

setupEventListeners();

}); // End of DOMContentLoaded






// --- 5. CATEGORY MODAL REFINEMENTS (Search & Interaction) ---
// Auto-focus on open
const originalOpenModal = window.openModal;
window.openModal = function (id) {
    if (originalOpenModal) originalOpenModal(id);

    // If opening categories, focus input
    if (id === 'modal-categories') {
        setTimeout(() => {
            const inp = document.getElementById('new-cat-input');
            if (inp) inp.focus();
            // Reset search
            const search = document.getElementById('cat-search');
            if (search) search.value = '';
            if (window.renderCategoryManager) window.renderCategoryManager();
        }, 100);
    }
};

// Category Search Listener
const catSearch = document.getElementById('cat-search');
if (catSearch) {
    catSearch.addEventListener('input', (e) => {
        const val = e.target.value.trim().toLowerCase();
        // Filter the category list
        const list = document.getElementById('category-list-container');
        if (list) {
            const items = list.querySelectorAll('.cat-manage-item');
            items.forEach(item => {
                const txt = item.textContent.toLowerCase();
                item.style.display = txt.includes(val) ? 'flex' : 'none';
            });
        }
    });
    // Stop click propagation
    catSearch.addEventListener('click', e => e.stopPropagation());
}

// New Category Input Enter Key
const newCatInput = document.getElementById('new-cat-input');
if (newCatInput) {
    newCatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Trigger add logic
            if (window.addCategory) window.addCategory();
        }
    });
    // Ensure formatting/focus
    newCatInput.addEventListener('click', e => e.stopPropagation());
}

// Override Add Category to be robust and reset focus
const originalAddCat = window.addCategory;
window.addCategory = function (optVal) {
    console.log('[addCategory] Called');

    const input = document.getElementById('new-cat-input');
    let val = optVal || (input ? input.value.trim() : '');

    if (!val) {
        alert("Kategori adı yazınız.");
        return;
    }

    // Use window.appData for scope access
    if (!window.appData) {
        console.warn('App data not ready yet');
        return;
    }

    const currentTab = window.appData.currentTab || 'ceyiz';
    const targetType = (currentTab === 'stats') ? 'ceyiz' : currentTab;
    const userCats = window.appData.userCategories;
    const defaultCats = window.appData.defaultCategories;

    if (!userCats[targetType]) userCats[targetType] = [];

    // Check if exists
    const allCats = [...defaultCats[targetType], ...userCats[targetType]];
    if (allCats.some(c => c.toLowerCase() === val.toLowerCase())) {
        alert('Bu kategori zaten var.');
        return;
    }

    // Add - IMPORTANT: Update through setter to ensure persistence
    userCats[targetType].push(val);
    window.appData.userCategories = userCats; // Trigger setter

    console.log('[addCategory] userCats after push:', userCats);
    console.log('[addCategory] window.appData.userCategories:', window.appData.userCategories);

    // Save and refresh
    console.log('[addCategory] Calling saveCategories...');
    if (window.appData.saveCategories) {
        window.appData.saveCategories();
        console.log('[addCategory] saveCategories called');
        console.log('[addCategory] localStorage check:', localStorage.getItem('ceyiz_cats_v1'));
    } else {
        console.error('[addCategory] saveCategories NOT FOUND');
    }

    console.log('[addCategory] Calling renderCategoryManager...');
    if (window.appData.renderCategoryManager) {
        window.appData.renderCategoryManager();
        console.log('[addCategory] renderCategoryManager called');
    } else {
        console.error('[addCategory] renderCategoryManager NOT FOUND');
    }

    console.log('[addCategory] Calling updateAllCategoryDropdowns...');
    if (window.appData.updateAllCategoryDropdowns) {
        window.appData.updateAllCategoryDropdowns();
        console.log('[addCategory] updateAllCategoryDropdowns called');
    } else {
        console.error('[addCategory] updateAllCategoryDropdowns NOT FOUND');
    }

    // Show success message
    if (window.appData.showToast) {
        window.appData.showToast(`"${val}" kategorisi eklendi! ✅`, false);
    }

    // Reset UI
    const btn = document.getElementById('btn-add-cat');
    if (btn) btn.disabled = true;
    if (input) {
        input.value = '';
        input.focus();
    }

    console.log('[addCategory] Success:', val);
}


    // === Daily Quote Rotation ===
    (function () {
        const quotes = [
            "Bir yuva kurmak, iki kalbin birleşmesiyle başlar... 💕",
            "Her çeyiz parçası, aşkla örülen hayallerden bir parça ✨",
            "Birlikte kuracağınız yuva, sevginin en güzel eseri olacak 🏠",
            "Gönül bağıyla bağlanmış iki kalp, bir ömür birlikte 💑",
            "Hayalinizdeki ev, aşkınızla daha da güzel olacak 🌸",
            "Her hazırlık, birlikte atacağınız adımlara bir adım daha ✨",
            "Sevgiyle hazırlanan çeyiz, mutluluğun temeli 💝",
            "İki gönül bir olunca, yuva mutlulukla doluncа 🌟",
            "Evlilik, aşkın en güzel serüvenidir 💫",
            "Birlikte kurduğunuz her şey, sevginizin bir yansıması 💖",
            "Hayallerinizi gerçeğe dönüştürmenin tam zamanı ✨",
            "Aşkla hazırlanan her detay, yuvayı daha özel kılar 🌺",
            "İki kalbin birleştiği yerde, mutluluk çiçek açar 🌹",
            "Çeyiz hazırlamak, geleceği hayal etmektir 💭",
            "Sevgiyle başlayan her yolculuk, mutlulukla sürer 🎊"
        ];

        let currentQuoteIndex = 0;
        const quoteElement = document.getElementById('daily-quote-text');

        if (!quoteElement) return;

        function changeQuote() {
            // Fade out
            quoteElement.style.animation = 'none';
            quoteElement.style.opacity = '0';

            setTimeout(() => {
                // Change text
                currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
                quoteElement.textContent = quotes[currentQuoteIndex];

                // Fade in
                quoteElement.style.animation = 'fadeIn 1s ease-in';
                quoteElement.style.opacity = '1';
            }, 500);
        }

        // Change quote every 10 seconds
        setInterval(changeQuote, 10000);
    })();







// === Countdown Timers ===
(function () {
    const nisanDate = new Date('2026-10-01T00:00:00');
    const nikahDate = new Date('2027-10-01T00:00:00');

    const nisanTimer = document.getElementById('home-nisan-timer');
    const nikahTimer = document.getElementById('home-nikah-timer');

    if (!nisanTimer || !nikahTimer) return;

    function updateCountdown() {
        const now = new Date();

        // Nişan countdown
        const nisanDiff = nisanDate - now;
        if (nisanDiff > 0) {
            const days = Math.floor(nisanDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((nisanDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((nisanDiff % (1000 * 60 * 60)) / (1000 * 60));
            nisanTimer.textContent = `${days} gün ${hours} saat ${minutes} dk`;
        } else {
            nisanTimer.textContent = '🎉 Geçti!';
        }

        // Nikah countdown
        const nikahDiff = nikahDate - now;
        if (nikahDiff > 0) {
            const days = Math.floor(nikahDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((nikahDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((nikahDiff % (1000 * 60 * 60)) / (1000 * 60));
            nikahTimer.textContent = `${days} gün ${hours} saat ${minutes} dk`;
        } else {
            nikahTimer.textContent = '💕 Geçti!';
        }
    }

    // Initial update
    updateCountdown();

    // Update every second
    setInterval(updateCountdown, 1000);
})();
// === Dark Mode Toggle Button ===
document.addEventListener('DOMContentLoaded', function () {
    // Initialize dark mode from localStorage on page load
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
        document.body.classList.add('dark-mode');
    }

    const darkModeBtn = document.getElementById('btn-dark-mode-toggle');
    if (!darkModeBtn) {
        console.log('Dark mode button not found');
        return;
    }

    const icon = darkModeBtn.querySelector('i');
    if (!icon) {
        console.log('Icon not found in dark mode button');
        return;
    }

    // Update icon based on current mode
    function updateIcon() {
        const isDark = document.body.classList.contains('dark-mode');
        if (isDark) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }

    // Toggle dark mode
    darkModeBtn.addEventListener('click', () => {
        console.log('Dark mode toggle clicked');
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark ? 'true' : 'false');
        updateIcon();
    });

    // Initial icon update
    updateIcon();
    console.log('Dark mode toggle initialized');
});
