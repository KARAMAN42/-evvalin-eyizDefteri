console.log("APP LOADED - \u015EŞevval Theme Mode");

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
        const STORAGE_KEY='ceyiz_data_v2';
        const STORAGE_CATS_KEY='ceyiz_cats_v1';
        const STORAGE_SETTINGS_KEY='ceyiz_settings_v1';
        const STORAGE_WELCOME_KEY='ceyiz_welcome_shown_v1';

        // Default Categories
        const defaultCategories= {
            ceyiz: ['Mutfak', 'Yatak Odas\u0131', 'Banyo', 'Salon', 'Elektronik', 'Di\u011Fer'],
            damat: ['Giyim', 'Ki\u015Fisel Bak\u0131m', 'Aksesuar', 'Di\u011Fer']
        }

        ;

        // --- Image Compression Helper ---
        function resizeImage(file, maxWidth=800, quality=0.7) {
            return new Promise((resolve, reject)=> {
                    console.log("Resizing image:", file.name);
                    const reader=new FileReader();
                    reader.readAsDataURL(file);

                    reader.onload=(event)=> {
                        const img=new Image();

                        // DÜZELTME: onload event listener'ı src atanmadan önce tanımlanmalı!
                        img.onload=()=> {
                            console.log("Image loaded for resizing:", img.width, "x", img.height);
                            let width=img.width;
                            let height=img.height;

                            if (width > maxWidth) {
                                height=Math.round(height * (maxWidth / width));
                                width=maxWidth;
                            }

                            const canvas=document.createElement('canvas');
                            canvas.width=width;
                            canvas.height=height;
                            const ctx=canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, width, height);

                            const dataURL=canvas.toDataURL('image/jpeg', quality);
                            console.log("Resizing complete, data URL generated.");
                            resolve(dataURL);
                        }

                        ;

                        img.onerror=(err)=> {
                            console.error("Image load error:", err);
                            reject(err);
                        }

                        ;
                        img.src=event.target.result;
                    }

                    ;

                    reader.onerror=(err)=> {
                        console.error("FileReader error:", err);
                        reject(err);
                    }

                    ;
                });
        }

        let userCategories= {
            ceyiz: [],
            damat: []
        }

        ;

        let items=[];
        let lastSelectedCategory='';
        let pendingDeleteItem=null;
        let undoTimeout=null;
        let currentTab='home'; // Start on home screen
        const tabOrder=['home', 'ceyiz', 'damat', 'stats']; // Global Tab Order

        let settings= {

            darkMode: false,
            name: 'Şevval',
            partnerName: 'Yusuf',
            dates: {
                engagement: '2026-10-01', wedding: '2027-10-01'
            }

            ,
            appearance: {
                fontSize: 'normal', animations: true
            }

            ,
            budget: 0, // Current remaining budget for this month
            monthlyBudget: 0, // Monthly budget limit (resets every month)
            lastMonthReset: null, // Last time budget was reset (YYYY-MM format)
            budgetLastUpdated: null, // Last update timestamp
            feedback: '',
            weeklyGoal: 'Bu hafta için bir güzellik belirle...',
            syncCode: '' // Cloud sync code
        }

        ;

        // Make variables globally accessible for addCategory function
        window.appData= {
            get userCategories() {
                return userCategories;
            }

            ,
            set userCategories(val) {
                userCategories=val;
            }

            ,
            get defaultCategories() {
                return defaultCategories;
            }

            ,
            get currentTab() {
                return currentTab;
            }

            ,
            set currentTab(val) {
                currentTab=val;
            }

            ,
            saveCategories: null, // Will be assigned later
            renderCategoryManager: null, // Will be assigned later
            updateAllCategoryDropdowns: null // Will be assigned later
        }

        ;


        /* --- Interactive Daily Quote --- */
        function setupDailyQuote() {
            const quoteWidget=document.querySelector('.daily-quote-widget');
            const quoteText=document.getElementById('daily-quote-text');

            if ( !quoteWidget || !quoteText) return;

            const quotes=[ "Bir yuva kurmak, iki kalbin birle\u015Fmesiyle ba\u015Flar...",
            "Sevgi bir eylem, sadece bir duygu de\u011Fildir.",
            "Seninle her \u015Feye var\u0131m ben!",
            "A\u015Fk, iki ki\u015Finin tek bir y\u00FCrek olmas\u0131d\u0131r.",
            "Evlilik, sonsuz bir yolculu\u011Fun ilk ad\u0131m\u0131d\u0131r.",
            "Mutluluk payla\u015Ft\u0131k\u00E7a \u00E7o\u011Fal\u0131r.",
            "Sen benim en g\u00FCzel '\u0130yi ki'msin.",
            "Birlikte ya\u015Flanmak de\u011Fil, birlikte b\u00FCy\u00FCmek...",
            "Huzur kokan yuvam\u0131za az kald\u0131.",
            "A\u015Fk sab\u0131rd\u0131r, a\u015Fk iyiliktir.",
            "Kalbim senin evin, sonsuza kadar beklerim.",
            "Hayallerimiz bir, yolumuz bir."
            ];

            let currentIdx=0;

            // Try to verify if we have a saved quote index to start optionally?
            // Let's just random start or keep as is. Default HTML has the first one.

            quoteWidget.addEventListener('click', ()=> {
                    // Animate Out
                    quoteText.style.opacity='0';
                    quoteText.style.transform='translateY(-10px)';

                    setTimeout(()=> {
                            // Change Text
                            let nextIdx;

                            do {
                                nextIdx=Math.floor(Math.random() * quotes.length);
                            }

                            while (nextIdx===currentIdx && quotes.length > 1);

                            currentIdx=nextIdx;
                            quoteText.textContent=quotes[currentIdx];

                            // Animate In
                            quoteText.style.opacity='1';
                            quoteText.style.transform='translateY(0)';
                        }

                        , 300);
                });
        }

        /* --- Splash Screen Logic --- */
        function setupSplashScreen() {
            const splash=document.getElementById('splash-screen');
            if ( !splash) return;

            // Swipe Up to Dismiss (Interactive)
            let startY=0;
            let currentY=0;
            let isDragging=false;

            // Helper to handle both touch and mouse
            function getClientY(e) {
                return e.touches ? e.touches[0].clientY : e.clientY;
            }

            function startDrag(e) {
                isDragging=true;
                startY=getClientY(e);
                splash.style.transition='none';
            }

            function moveDrag(e) {
                if ( !isDragging) return;
                currentY=getClientY(e);
                const diffY=currentY - startY;

                if (diffY < 0) {
                    e.preventDefault(); // Prevent default scroll on mouse too

                    splash.style.transform = `translateY(${diffY}px)`;
                }
            }

            function endDrag(e) {
                if ( !isDragging) return;
                isDragging=false;

                // For touchend, changedTouches is needed, for mouse e.clientY is fine
                // But getting endY from mouseup event is simply e.clientY
                let endY;
                if (e.changedTouches) endY=e.changedTouches[0].clientY;
                else endY=e.clientY;

                const diffY=endY - startY;

                splash.style.transition='transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';

                if (diffY < -100) {
                    splash.classList.add('hidden');
                    splash.style.transform='translateY(-100%)';

                    setTimeout(()=> {
                            splash.style.display='none';
                        }

                        , 650);
                }

                else {
                    splash.style.transform='translateY(0)';
                }
            }

            // Touch Events
            splash.addEventListener('touchstart', startDrag, {
                passive: false
            }); // passive:false allows preventDefault

        splash.addEventListener('touchmove', moveDrag, {
            passive: false
        });
    splash.addEventListener('touchend', endDrag);

    // Mouse Events
    splash.addEventListener('mousedown', startDrag);
    splash.addEventListener('mousemove', moveDrag);
    splash.addEventListener('mouseup', endDrag);

            splash.addEventListener('mouseleave', () => {
                if (isDragging) endDrag({ clientY: currentY });
            });

            // Fallback: Click to dismiss if swipe is missed or difficult
            splash.addEventListener('click', (e) => {
                // If it was a meaningful drag, don't trigger click dismissal
                if (Math.abs(currentY - startY) > 5) return;
                
                // Allow theme toggle to work
                if (e.target.closest('#splash-theme-toggle')) return;

                console.log("Splash clicked - dismissing via fallback");
                splash.classList.add('hidden');
                splash.style.transform = 'translateY(-100%)';
                setTimeout(() => { splash.style.display = 'none'; }, 650);
            });

try {
    // Get dates
    const nisanDate=new Date((settings.dates?.engagement || '2026-10-01') + 'T00:00:00');
    const nikahDate=new Date((settings.dates?.wedding || '2027-10-01') + 'T00:00:00');
    const now=new Date();

    const elNisan=document.getElementById('splash-nisan');
    const elNikah=document.getElementById('splash-nikah');

    function getDays(target) {
        const diff=target - now;
        if (diff <=0) return "Tamamland\u0131 \u2728";
        return Math.ceil(diff / (1000 * 60 * 60 * 24)) + " G\u00FCn";
    }

    if (elNisan) elNisan.textContent=getDays(nisanDate);
    if (elNikah) elNikah.textContent=getDays(nikahDate);

    // Find NEXT calendar event for splash
    const elNextEvent=document.getElementById('splash-next-event');
    const elNextMsg=document.getElementById('splash-next-msg');

    if (elNextEvent && elNextMsg) {
        let events=[];

        const specials=[ {
            d: 1, m: 0, msg: "Yılbaşı 🎄"
        }

        ,
        {
        d: 14, m: 1, msg: "Sevgililer Günü 🤍"
    }

    ,
    {
    d: 23, m: 3, msg: "23 Nisan 🇹🇷"
}

,
{
d: 1, m: 4, msg: "Emek ve Dayanışma Günü"
}

,
{
d: 19, m: 4, msg: "19 Mayıs 🇹🇷"
}

,
{
d: 15, m: 6, msg: "15 Temmuz 🇹🇷"
}

,
{
d: 30, m: 7, msg: "30 Ağustos 🇹🇷"
}

,
{
d: 29, m: 9, msg: "29 Ekim 🇹🇷"
}

];
const currentYear=now.getFullYear();

specials.forEach(s=> {
        let d=new Date(currentYear, s.m, s.d);
        if (d < now && (now.getDate() !==s.d || now.getMonth() !==s.m)) d=new Date(currentYear + 1, s.m, s.d);

        events.push({
            date: d, msg: s.msg
        });
});

const todayOnly=new Date(now.getFullYear(), now.getMonth(), now.getDate());

if (settings.customEvents) {
    for (const [key, val] of Object.entries(settings.customEvents)) {
        const d=new Date(key);

        if (d >=todayOnly) {
            const noteText=(typeof val==='object') ? (val.note || '') : val;

            if (noteText) events.push({
                date: d, msg: noteText
            });
    }
}
}

events.sort((a, b)=> a.date - b.date);
const next=events[0];

if (next) {
    elNextMsg.textContent=next.msg;
    elNextEvent.classList.remove('hidden');
}
}

}

catch (err) {
    console.warn("Splash date calc error:", err);
}
}

// --- Selectors ---

// Core
const navItems=document.querySelectorAll('.nav-item');

const sections= {
    home: document.getElementById('home-section'),
    ceyiz: document.getElementById('ceyiz-section'),
    damat: document.getElementById('damat-section'),
    stats: document.getElementById('stats-section')
}

;

const lists= {
    ceyiz: document.getElementById('ceyiz-list'),
    damat: document.getElementById('damat-list')
}

;

// Header & Actions
const btnSettings=document.getElementById('btn-settings');


const btnManageCats=document.getElementById('btn-manage-cats');
const fab=document.getElementById('fab-add');

// Modals
const modalForm=document.getElementById('modal-form');
const modalSettings=document.getElementById('modal-settings');
const modalCats=document.getElementById('modal-categories'); // ADDED - Missing variable
const form=document.getElementById('item-form');


// Filters
const searchInput=document.getElementById('search-input');
const categoryFilter=document.getElementById('category-filter');
const statusFilter=document.getElementById('status-filter');

// Toast
const toastContainer=document.getElementById('toast-container');
const toastMessage=document.getElementById('toast-message');
const btnUndo=document.getElementById('btn-undo');

// Settings
const darkModeToggle=document.getElementById('darkModeToggle');
const btnExport=document.getElementById('btn-export');
const btnImport=document.getElementById('btn-import');
const fileImport=document.getElementById('file-import');

// Reset settings modal state
function resetSettingsState() {
    const modal=document.getElementById('modal-settings');
    if ( !modal) return;

    // 1. Reset inputs to current settings
    const sNisan=document.getElementById('setting-date-nisan');
    const sNikah=document.getElementById('setting-date-nikah');
    if (sNisan) sNisan.value=settings.dates.engagement;
    if (sNikah) sNikah.value=settings.dates.wedding;

    const animToggle=document.getElementById('animations-toggle');
    if (animToggle) animToggle.checked=settings.appearance.animations;

    // 2. Reset scroll
    const sheet=modal.querySelector('.settings-sheet');
    const body=modal.querySelector('.settings-body');
    if (sheet) sheet.scrollTop=0;
    if (body) body.scrollTop=0;

    // 3. Collapse special message
    const msgContent=document.getElementById('special-message-content');
    const msgChevron=document.getElementById('message-chevron');
    const msgCard=document.querySelector('.special-message-card');
    if (msgContent) msgContent.classList.remove('expanded');
    if (msgChevron) msgChevron.classList.remove('rotated');
    if (msgCard) msgCard.classList.remove('active');

    // 4. Hide import area if open
    const importArea=document.getElementById('import-area');
    const btnImport=document.getElementById('btn-import-paste');
    if (importArea) importArea.classList.add('hidden');
    if (btnImport) btnImport.innerHTML='<i class="fas fa-cloud-upload-alt"></i> Yedek Yükle';
}

window.resetSettingsState=resetSettingsState;

// Helpers
const currencyFormatter=new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
});

const successMessages=[ "Harika! Bir adım daha tamam 💖",
"Çok güzel gidiyorsun Şevval ✨",
"Bu da tamamlandı! \u2705",
"Eksikler azalıyor... 🤟",
"Süpersin! 🌸"
];

// Daily Quotes - Random quote on each page load
const dailyQuotes=[ "Bir yuva kurmak, iki kalbin birle\u015Fmesiyle ba\u015Flar...",
"Her haz\u0131rl\u0131k, hayallerinize bir ad\u0131m daha yakla\u015Ft\u0131r\u0131r.",
"Sab\u0131rla yap\u0131lan her \u015Fey, en g\u00FCzel sonu\u00E7lar\u0131 verir.",
"Bug\u00FCn at\u0131lan her ad\u0131m, yar\u0131n\u0131n an\u0131lar\u0131n\u0131 in\u015Fa eder.",
"Birlikte kuraca\u011F\u0131n\u0131z yuva, sevgiyle daha da g\u00FCzelle\u015Fecek.",
"Her detay, mutlulu\u011Funuzun bir par\u00E7as\u0131 olacak.",
"Planlamak, hayal etmekten \u00E7ok daha keyifli.",
"Gelece\u011Finizi bug\u00FCnden haz\u0131rl\u0131yorsunuz.",
"Her liste, yeni bir ba\u015Flang\u0131c\u0131n habercisi.",
"Haz\u0131rl\u0131k s\u00FCreci de t\u0131pk\u0131 d\u00FC\u011F\u00FCn\u00FCn\u00FCz kadar \u00F6zel."
];

// --- Init ---
try {
    loadData();
}

catch (e) {
    console.error("CRITICAL ERROR loading data:", e);
    // Fallback to empty to allow app to load
    items=[];

    userCategories= {
        ceyiz: [], damat: []
    }

    ;
}

try {
    applySettings();
    initDarkMode();
}

catch (e) {
    console.error("Error applying settings:", e);
}

// listeners first to ensure interactivity
try {
    setupEventListeners();

    // Add Search Listeners
    ['ceyiz', 'damat'].forEach(type=> {
            const inp=document.getElementById('search-' + type);

            if (inp) {
                inp.addEventListener('input', ()=> renderList(type));
            }
        });
    console.log("EventListeners setup complete.");
}

catch (e) {
    console.error("Error setting up listeners:", e);
}

try {
    renderApp();
    updateCountdowns();
    updateHomeCountdowns();
    startLiveCountdown();
    updateDailyQuote();
    if (typeof updateGreeting==='function') updateGreeting(); // Initialize Greeting
    if (typeof updateMiniStats==='function') updateMiniStats(); // Initialize Mini Stats
    checkMonthlyBudgetReset(); // Check if budget needs monthly reset
    updateBudgetDisplay(); // Update budget UI
}

catch (e) {
    console.error("Error initializing UI:", e);
}

// Always run splash screen logic last
setupSplashScreen();
setupSwipeNavigation();

// Start Home Countdown Timer (update every minute)
setInterval(updateHomeCountdowns, 60000);

// Hide FAB on initial load if on home or stats
if (currentTab==='home' || currentTab==='stats') {
    if (fab) fab.style.display='none';
    const fb=document.getElementById('filter-bar');
    if (fb) fb.style.display='none';
}

// --- Swipe Navigation Logic ---
function setupSwipeNavigation() {
    const container=document.getElementById('main-swipe-container');
    if ( !container) return;

    const tabOrder=['home', 'ceyiz', 'damat', 'stats'];
    let touchStartX=0;
    let touchStartY=0;
    let touchEndX=0;
    let touchEndY=0;

    container.addEventListener('touchstart', (e)=> {
            touchStartX=e.changedTouches[0].screenX;
            touchStartY=e.changedTouches[0].screenY;
        }

        , {
        passive: true
    });

container.addEventListener('touchend', (e)=> {
        touchEndX=e.changedTouches[0].screenX;
        touchEndY=e.changedTouches[0].screenY;
        handleSwipe();
    }

    , {
    passive: true
});

function handleSwipe() {
    const deltaX=touchEndX - touchStartX;
    const deltaY=touchEndY - touchStartY;

    // Ensure it's a horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 80) {
        const currentIndex=tabOrder.indexOf(currentTab);
        if (currentIndex===-1) return;

        if (deltaX < 0) {

            // Swipe Left -> Next Tab
            if (currentIndex < tabOrder.length - 1) {
                window.switchTab(tabOrder[currentIndex + 1]);
            }
        }

        else {

            // Swipe Right -> Previous Tab
            if (currentIndex > 0) {
                window.switchTab(tabOrder[currentIndex - 1]);
            }
        }
    }
}
}



function initDarkMode() {
    const toggle=document.getElementById('darkModeToggle');
    const headerBtn=document.getElementById('btn-dark-mode-toggle');

    // Load state (1 = dark, 0 = light)
    const isDark=localStorage.getItem('darkMode')==='1';

    // Apply to body
    document.body.classList.toggle('dark-mode', isDark);

    // Sync Switch
    if (toggle) toggle.checked=isDark;

    // Change Handler
    function setMode(dark) {
        document.body.classList.toggle('dark-mode', dark);
        localStorage.setItem('darkMode', dark ? '1' : '0');
        if (toggle) toggle.checked=dark;

        // Update Splash Toggle Icon if exists
        const splashBtn=document.getElementById('splash-theme-toggle');

        if (splashBtn) {
            const icon=splashBtn.querySelector('i');

            if (icon) {
                icon.className=dark ? 'fas fa-sun' : 'fas fa-moon';
            }
        }

        // Also update standard header toggle icon if it exists via CSS or different class
        if (headerBtn) {
            const hIcon=headerBtn.querySelector('i');

            if (hIcon) {
                hIcon.className=dark ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }

    if (toggle) {
        toggle.addEventListener('change', (e)=> {
                setMode(e.target.checked);
            });
    }

    // Header Button Support
    if (headerBtn) {
        headerBtn.onclick=()=> {
            const current=document.body.classList.contains('dark-mode');
            setMode( !current);
        }

        ;
    }

    // Initialize Icons on load
    setMode(isDark);

    // Global exposure for debugging or other buttons
    window.toggleTheme=()=> {
        const current=document.body.classList.contains('dark-mode');
        setMode( !current);
    }

    ;
}


function updateCountdowns() {
    // Standard Day Countdown (Header/Stats)
    const now=new Date();
    // Use settings dates or defaults
    const nisanDate=new Date((settings.dates?.engagement || '2026-10-01') + 'T00:00:00');
    const nikahDate=new Date((settings.dates?.wedding || '2027-10-01') + 'T00:00:00');

    function getDaysOnly(target) {
        const diff=target - now;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    const nisanDays=getDaysOnly(nisanDate);
    const nikahDays=getDaysOnly(nikahDate);

    const els= {
        mainNisan: document.getElementById('main-nisan-txt'),
        mainNikah: document.getElementById('main-nikah-txt')
    }

    ;

    if (els.mainNisan && els.mainNikah) {
        if (nisanDays > 0) {
            els.mainNisan.textContent = `${nisanDays} gün kaldı`;
        }

        else if (nisanDays===0) {
            els.mainNisan.textContent="Bugün nişan günü 💖";
        }

        else {
            els.mainNisan.textContent="Mutlulukla geçti 💖";
        }

            els.mainNikah.textContent = `${nikahDays} gün kaldı`;
        }

        else if (nikahDays===0) {
            els.mainNikah.textContent="Bugün nikah günü 🤍";
        }

        else {
            els.mainNikah.textContent="Mutlulukla geçti 🤍";
        }
    }
}

// Home Screen Countdowns (Real-time format: X g\u00FCn Y saat Z dakika)
function updateHomeCountdowns() {
    const now=new Date();

    // Get dates from settings or fallback STRICTLY
    let nisanStr=settings.dates?.engagement;
    let nikahStr=settings.dates?.wedding;

    // Failsafe
    if ( !nisanStr) nisanStr='2026-10-01';
    if ( !nikahStr) nikahStr='2027-10-01';

    const nisanDate=new Date(nisanStr + 'T00:00:00');
    const nikahDate=new Date(nikahStr + 'T00:00:00');

    function formatTimeDiff(target) {
        if ( !target || isNaN(target.getTime())) return "Tarih Hatal\u0131"; // Should not happen with hardcodes

        const diff=target - now;
        if (diff <=0) return "Tamamland\u0131 \u2728";

        const totalSecs=Math.floor(diff / 1000);
        const days=Math.floor(totalSecs / 86400);
        const hours=Math.floor((totalSecs % 86400) / 3600);
        const minutes=Math.floor((totalSecs % 3600) / 60);

        return `${days} gün<br>${hours} saat<br>${minutes} dakika`;
    }

    const elNisanTimer=document.getElementById('home-nisan-timer');
    const elNikahTimer=document.getElementById('home-nikah-timer');

    if (elNisanTimer) {
        const result=formatTimeDiff(nisanDate);
        elNisanTimer.innerHTML=result;
    }

    if (elNikahTimer) {
        const result=formatTimeDiff(nikahDate);
        elNikahTimer.innerHTML=result;
    }

    // Update dates display
    const elNisanDate=document.getElementById('home-nisan-date');
    const elNikahDate=document.getElementById('home-nikah-date');

    if (elNisanDate) {
        const d=nisanDate;

        elNisanDate.textContent=d.toLocaleDateString('tr-TR', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
}

if (elNikahDate) {
    const d=nikahDate;

    elNikahDate.textContent=d.toLocaleDateString('tr-TR', {
        day: 'numeric', month: 'long', year: 'numeric'
    });
}
}


// Update Daily Quote with random selection
function updateDailyQuote() {
    const quoteElement=document.getElementById('daily-quote-text');

    if (quoteElement && dailyQuotes.length > 0) {
        const randomIndex=Math.floor(Math.random() * dailyQuotes.length);
        quoteElement.textContent=dailyQuotes[randomIndex];
    }
}


// Live Detailed Countdown Widget
function startLiveCountdown() {
    const widget=document.getElementById('fixed-countdown-widget');
    const elNisan=document.getElementById('fc-nisan');
    const elNikah=document.getElementById('fc-nikah');

    if ( !widget) return;
    widget.classList.remove('hidden');

    function getDetailedTime(target) {
        const now=new Date();
        let diff=target - now;

        if (diff <=0) return "Tamamland\u0131 \u2728";

        // Calculate breakup
        // Simple approximation for Year/Month to be robust
        let y=target.getFullYear() - now.getFullYear();
        let m=target.getMonth() - now.getMonth();
        let d=target.getDate() - now.getDate();

        if (d < 0) {
            m--;
            // Days in previous month
            const prevMonth=new Date(target.getFullYear(), target.getMonth(), 0);
            d +=prevMonth.getDate();
        }

        if (m < 0) {
            y--;
            m +=12;
        }

        // Hours/Mins/Secs from remainder implies pure time diff, 
        // but "Y M D" is calendar diff. 
        // Let's stick to strict time diff for H:M:S? 
        // No, user wants Y M D H.
        // Let's use the time part of the dates.
        let h=target.getHours() - now.getHours();
        let min=target.getMinutes() - now.getMinutes();
        let s=target.getSeconds() - now.getSeconds();

        if (s < 0) {
            min--; s +=60;
        }

        if (min < 0) {
            h--; min +=60;
        }

        if (h < 0) {
            d--; h +=24;
        }

        // Adjust d/m/y cascading if H caused negative D
        // This is getting complex strictly.
        // Simplified: Total Seconds -> Breakdown
        // Yet "Year" and "Month" are variable.
        // Let's use the standard approximate string for display:

        const totalSecs=Math.floor(diff / 1000);
        const days=Math.floor(totalSecs / 86400);
        const remSecs=totalSecs % 86400;
        const hours=Math.floor(remSecs / 3600);
        const mins=Math.floor((remSecs % 3600) / 60);
        const secs=remSecs % 60;

        // Convert Total Days to Y/M/D approx
        const yy=Math.floor(days / 365);
        const mm=Math.floor((days % 365) / 30);
        const dd=(days % 365) % 30;

        let str='';

        if (yy > 0) str += `${yy}Y `;
        if (mm > 0) str += `${mm}A `;
        if (dd > 0) str += `${dd}G `;
        str += `${hours}s ${mins}dk ${secs}sn`;

        return str;
    }

    function update() {
        const nisanDate=new Date((settings.dates?.engagement || '2026-10-01') + 'T00:00:00');
        const nikahDate=new Date((settings.dates?.wedding || '2027-10-01') + 'T00:00:00');

        if (elNisan) elNisan.textContent=getDetailedTime(nisanDate);
        if (elNikah) elNikah.textContent=getDetailedTime(nikahDate);
    }

    update();
    setInterval(update, 1000);
}

// ... logic continues ...

function loadData() {
    try {
        const rawData=localStorage.getItem(STORAGE_KEY);

        if (rawData) {
            items=JSON.parse(rawData);

            items.forEach(i=> {
                    if (typeof i.price==='undefined') i.price=0;
                    if (typeof i.note==='undefined') i.note='';

                    // Repair: Backfill dateBought for legacy bought items
                    if (i.isBought && !i.dateBought) {
                        i.dateBought=new Date().toISOString();
                    }
                });
        }

        else {
            // First time load (or data cleared)
            items=[];
            populateDefaultItems();
        }
    }

    catch (e) {
        console.error("Error parsing items:", e);
        items=[];
        // If error, maybe safe to populate defaults? Or just leave empty to avoid overwriting potentially broken but valuable data?
        // Let's populate defaults to be safe for user experience if corrupted.
        populateDefaultItems();
    }

    // REMOVED: The check "if (items.length === 0) populateDefaultItems()" was causing the bug.
    // It was re-adding items if the user deleted everything.


    try {
        const rawCats=localStorage.getItem(STORAGE_CATS_KEY);
        if (rawCats) userCategories=JSON.parse(rawCats);
    }

    catch (e) {
        console.error("Error parsing categories:", e);

        userCategories= {
            ceyiz: [], damat: []
        }

        ;
    }

    try {
        const rawSettings=localStorage.getItem(STORAGE_SETTINGS_KEY);

        if (rawSettings) {
            const loaded=JSON.parse(rawSettings);

            // Deep merge to ensure all properties exist
            settings= {

                ...settings,
                ...loaded,
                dates: {
                    ...settings.dates, ...(loaded.dates || {})
                }

                ,
                appearance: {
                    ...settings.appearance, ...(loaded.appearance || {})
                }
            }

            ;
        }
    }

    catch (e) {
        console.error("Error parsing settings:", e);
        // Keep default settings
    }

    // --- Budget Reset Logic (New System) ---
    // The monthly check/reset is handled by checkMonthlyBudgetReset() which is called in init.
    // We don't need the legacy budgetConf migration here.

    // --- FORCE VALID DATES RECOVERY ---
    // If local storage had bad/empty dates, we must overwrite them to ensure the countown works.
    const defaultNisan='2026-10-01';
    const defaultNikah='2027-10-01';

    if ( !settings.dates.engagement || settings.dates.engagement.length < 10) {
        console.log("Fixing missing engagement date...");
        settings.dates.engagement=defaultNisan;
    }

    if ( !settings.dates.wedding || settings.dates.wedding.length < 10) {
        console.log("Fixing missing wedding date...");
        settings.dates.wedding=defaultNikah;
    }
}

function saveData() {
    console.log("Saving data... Items count:", items.length);

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        console.log("Data saved to localStorage successfully.");

        // Cloud Sync for Items (CRITICAL: Was missing!)
        if (typeof window.syncToCloud==='function') {
            window.syncToCloud('items', items);
        }
    }

    catch (e) {
        console.error("Error saving to localStorage:", e);
        alert("Veriler kaydedilemedi: Depolama alanı dolu olabilir veya Firebase limiti aşılmış olabilir.");
    }

    renderStats();
}

function saveCategories() {
    localStorage.setItem(STORAGE_CATS_KEY, JSON.stringify(userCategories));
    updateAllCategoryDropdowns();
    // Cloud Sync
    if (typeof window.syncToCloud==='function') window.syncToCloud('categories', userCategories);
}

window.appData.saveCategories=saveCategories; // Expose globally


function saveSettings() {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    applySettings();
    // Update live counters immediately
    updateCountdowns();
    updateHomeCountdowns();
    if (typeof renderHomeUpcomingEvents==='function') renderHomeUpcomingEvents();
    // Cloud Sync
    if (typeof window.syncToCloud==='function') window.syncToCloud('settings', settings);
}

// ========================================
// Monthly Budget System
// ========================================

// Check if month has changed and reset budget if needed
function checkMonthlyBudgetReset() {
    const now=new Date();

    const currentMonth=`${now.getFullYear()}-${now.getMonth() + 1}`;

    // If lastMonthReset is null, this is first time - set it
    if ( !settings.lastMonthReset) {
        settings.lastMonthReset=currentMonth;
        saveSettings();
        return;
    }

    // If month has changed, reset budget
    if (settings.lastMonthReset !==currentMonth) {
        console.log(`📅 Month changed: 

            -> 

            `);

        // Reset budget to monthly budget
        const oldBudget=settings.budget;
        settings.budget=settings.monthlyBudget;
        settings.lastMonthReset=currentMonth;
        settings.budgetLastUpdated=new Date().toISOString();
        saveSettings();

        // Show notification
        showMonthlyBudgetResetNotification(oldBudget);
    }
}

// Show notification when budget is reset
function showMonthlyBudgetResetNotification(oldBudget) {
    const modal=document.createElement('div');
    modal.className='modal active';
    modal.style.zIndex='10000';

    modal.innerHTML = `
        <div class="modal-backdrop" style="background: rgba(0, 0, 0, 0.8);"></div>
        <div class="modal-content-sheet" style="max-width: 400px; text-align: center; padding: 2rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🗓️</div>
            <h2 style="margin-bottom: 1rem; color: var(--primary-color);">Yeni Ay Başladı !</h2>
            <p style="margin-bottom: 1.5rem; color: var(--text-light);">
                Bütçeniz sıfırlandı.<br>
                <strong>${currencyFormatter.format(settings.monthlyBudget)}</strong> bütçeniz bulunmaktadır.
            </p>
            <button id="btn-close-budget-notification" class="btn-primary" style="width: 100%;">Anladım</button>
        </div>
    `;

document.body.appendChild(modal);
document.body.classList.add('modal-open');

const closeBtn=modal.querySelector('#btn-close-budget-notification');

closeBtn.addEventListener('click', ()=> {
        modal.remove();
        document.body.classList.remove('modal-open');

        // If no monthly budget set, open budget modal
        if (settings.monthlyBudget===0) {
            if (window.openBudgetModal) window.openBudgetModal();
        }
    });
}


function populateDefaultItems() {
    console.log("Populating default items...");

    const ceyizDefaults=[ {
        name: "12 Ki\u015Filik Yemek Tak\u0131m\u0131", category: "Mutfak", price: 15000
    }

    ,
    {
    name: "\u00C7atal B\u0131\u00E7ak Seti", category: "Mutfak", price: 4500
}

,
{
name: "\u00C7elik Tencere Seti", category: "Mutfak", price: 6000
}

,
{
name: "Granit Tencere Seti", category: "Mutfak", price: 4000
}

,
{
name: "Kahvalt\u0131 Tak\u0131m\u0131", category: "Mutfak", price: 3500
}

,
{
name: "Nevresim Tak\u0131m\u0131 (\u00C7ift)", category: "Yatak Odas\u0131", price: 2500
}

,
{
name: "Yatak \u00D6rt\u00FCs\u00FC", category: "Yatak Odas\u0131", price: 3000
}

,
{
name: "Bornoz Seti", category: "Banyo", price: 2000
}

,
{
name: "Elektronik S\u00FCp\u00FCrge", category: "Elektronik", price: 12000
}

,
{
name: "\u00DCt\u00FC", category: "Elektronik", price: 3000
}

];

const damatDefaults=[ {
    name: "Damatl\u0131k", category: "Giyim", price: 8000
}

,
{
name: "Damat Ayakkab\u0131s\u0131", category: "Giyim", price: 3000
}

,
{
name: "Kol Saati", category: "Aksesuar", price: 5000
}

,
{
name: "Parf\u00FCm", category: "Ki\u015Fisel Bak\u0131m", price: 2500
}

,
{
name: "T\u0131ra\u015F Makinesi", category: "Elektronik", price: 4000
}

,
{
name: "G\u00F6mlek & Kravat", category: "Giyim", price: 1500
}

];

ceyizDefaults.forEach(d=> {
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

damatDefaults.forEach(d=> {
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
    // 1. Name
    const nameInput=document.getElementById('setting-user-name');
    if (nameInput) nameInput.value=settings.name || 'Şevval';

    const partnerInput=document.getElementById('setting-partner-name');
    if (partnerInput) partnerInput.value=settings.partnerName || 'Yusuf';

    // 2. Dark Mode (Handled by initDarkMode)

    // 3. Appearance
    const animToggle=document.getElementById('animations-toggle');
    if (animToggle) animToggle.checked=settings.appearance.animations;

    // Apply Animations Class
    if ( !settings.appearance.animations) document.body.classList.add('no-anim');
    else document.body.classList.remove('no-anim');

    // Update Title & Greetings
    const pageTitle=document.getElementById('page-title');
    const currentName=settings.name || 'Şevval';
    const partnerName=settings.partnerName || 'Yusuf';

    if (pageTitle) pageTitle.innerHTML=`${currentName}'in Çeyiz Defteri <i class="fas fa-heart pulse-heart"></i>`;

    // Update Splash Names
    const splashBride=document.getElementById('splash-name-bride');
    const splashGroom=document.getElementById('splash-name-groom');
    if (splashBride) splashBride.textContent=currentName;
    if (splashGroom) splashGroom.textContent=partnerName;

    // Update Special Message Signature
    const sigEl=document.getElementById('special-message-signature');

    if (sigEl) sigEl.textContent = `- ${partnerName}`;

    // Update Home Greeting if exists
    const welcomeTitle=document.querySelector('.welcome-title');

    if (welcomeTitle) {
        const now=new Date();
        const hour=now.getHours();
        let greeting="İyi Günler";
        if (hour < 12) greeting="Günaydın";
        else if (hour < 18) greeting="Tünaydın";
        else greeting="İyi Akşamlar";

        welcomeTitle.textContent = `${greeting}, ${currentName} ✨`;
    }

    // 4. Weekly Goal
    renderWeeklyGoal();
}

function renderWeeklyGoal() {
    const goalText=document.getElementById('weekly-goal-text');

    if (goalText) {
        goalText.textContent=settings.weeklyGoal || 'Bu hafta i\u00E7in bir g\u00FCzellik belirle...';
    }
}



function getCategories(type) {
    const typeKey=type==='stats' ? 'ceyiz': type;
    const defaults=defaultCategories[typeKey] || defaultCategories.ceyiz;
    const customs=userCategories[typeKey] || [];
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
    const container=lists[type];
    const emptyState=container.parentElement.querySelector('.empty-state');

    // Search Input specific to section
    const sInput=document.getElementById('search-' + type);
    const searchText=sInput ? sInput.value.toLowerCase(): '';

    // Filter
    const catFilterVal=categoryFilter?.value || '';
    const statusFilterVal=statusFilter?.value || 'all';

    let filtered=items.filter(item=> item.type===type);
    const isFiltering=searchText || catFilterVal || statusFilterVal !=='all';

    if (searchText) {
        filtered=filtered.filter(item=> item.name.toLowerCase().includes(searchText));
    }

    if (catFilterVal) {
        filtered=filtered.filter(item=> item.category===catFilterVal);
    }

    if (statusFilterVal !=='all') {
        if (statusFilterVal==='true' || statusFilterVal==='false') {
            filtered=filtered.filter(item=> item.isBought===(statusFilterVal==='true'));
        }

        else if (statusFilterVal==='hasPrice') {
            filtered=filtered.filter(item=> item.price > 0);
        }

        else if (statusFilterVal==='noPrice') {
            filtered=filtered.filter(item=> !item.price);
        }
    }

    container.innerHTML='';

    if (filtered.length===0) {
        emptyState.classList.remove('hidden');
    }

    else {
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
                        ${(item.images && item.images.length > 0) ? `<div class="item-thumbnail" onclick="window.viewImage('${item.images[0]}'); event.stopPropagation();"><img src="${item.images[0]}" alt="Ürün"></div>` : (item.image ? `<div class="item-thumbnail" onclick="window.viewImage('${item.image}'); event.stopPropagation();"><img src="${item.image}" alt="Ürün"></div>` : '')}
                        ${item.isBought ? '<div class="completed-badge">Tamamlandı ✓</div>' : ''}
                    </div>
                `;

</div> `;
// Add actions: Edit + Delete
const actionsDiv=document.createElement('div');
actionsDiv.className='item-actions';
actionsDiv.innerHTML=` <button class="btn-icon edit" data-id="${item.id}" style="margin-right: 4px;" ><i class="fas fa-pen" ></i></button> <button class="btn-icon delete" ><i class="fas fa-trash" ></i></button> `;
el.appendChild(actionsDiv);

// Listeners
el.querySelector('.action-check').addEventListener('change', (e)=> toggleStatus(item.id, e.target.checked));

// Edit Button - Inline implementation to avoid scope issues
const editBtn=el.querySelector('.edit');

if (editBtn) {
    editBtn.addEventListener('click', (e)=> {
            e.stopPropagation();
            e.preventDefault();

            // Open edit modal directly
            const qaModal=document.getElementById('modal-quick-add-category');
            const qaName=document.getElementById('qa-new-product-name');
            const qaSelect=document.getElementById('qa-new-category-select');
            const qaQty=document.getElementById('qa-new-qty');
            const qaPrice=document.getElementById('qa-new-price');
            const qaNote=document.getElementById('qa-new-note');
            const qaLink=document.getElementById('qa-new-link');
            const qaPhotoInput=document.getElementById('qa-new-photo');
            const qaPhotoPreview=document.getElementById('qa-photo-preview');
            const qaPhotoImg=qaPhotoPreview?.querySelector('img');
            const qaError=document.getElementById('qa-new-error-msg');
            // Fix selector to match new HTML structure
            const modalTitle=document.getElementById('qa-title');
            const modalSubtitle=qaModal.querySelector('.sheet-subtitle');

            if ( !qaModal) {
                alert('Modal bulunamadı!');
                return;
            }

            // Set modal to edit mode
            qaModal.dataset.editId=item.id;
            if (modalTitle) modalTitle.textContent='Ürünü Düzenle';
            if (modalSubtitle) modalSubtitle.textContent='Ürün bilgilerini güncelle. ✏️';

            // Fill form
            if (qaName) qaName.value=item.name;
            if (qaQty) qaQty.value=item.quantity || 1;
            if (qaPrice) qaPrice.value=item.price || '';
            if (qaNote) qaNote.value=item.note || '';
            if (qaLink) qaLink.value=item.link || '';
            if (qaError) qaError.classList.add('hidden');

            // Populate categories
            if (qaSelect) {
                qaSelect.innerHTML='<option value="" disabled>Kategori Seçiniz</option>';
                let cats=(item.type==='damat' ? userCategories.damat : userCategories.ceyiz) || [];

                // Fallback to defaults if empty
                if (cats.length===0) {
                    cats=(item.type==='damat' ? defaultCategories.damat : defaultCategories.ceyiz);
                    console.log('📋 Using default categories:', cats);
                }

                else {
                    console.log('📋 Using user categories:', cats);
                }

                console.log('📋 Item type:', item.type, 'Selected:', item.category);

                cats.forEach(c=> {
                        const opt=document.createElement('option');
                        opt.value=c;
                        opt.textContent=c;
                        if (c===item.category) opt.selected=true;
                        qaSelect.appendChild(opt);
                    });
            }

            // Open modal
            qaModal.classList.remove('hidden');
            requestAnimationFrame(()=> qaModal.classList.add('active'));
            document.body.classList.add('modal-open');

            if (qaName) qaName.focus();
        });
}

// Delete Button Click
el.querySelector('.delete').addEventListener('click', (e)=> {
        e.stopPropagation();
        initiateDelete(item.id);
    });

// Open Product Detail on Card Click
el.addEventListener('click', (e)=> {

        // Ignore clicks on specific controls
        if (e.target.closest('.checkbox-wrapper') || e.target.closest('.item-actions') || e.target.closest('.drag-handle') || e.target.closest('.item-link-btn') || e.target.closest('.item-thumbnail')) {
            return;
        }

        openProductDetailModal(item);
    });

// Thumbnail Click - Open Image Viewer with all photos
const thumbnail=el.querySelector('.item-thumbnail');

if (thumbnail) {
    thumbnail.addEventListener('click', (e)=> {
            e.stopPropagation();

            // Support both new (images array) and old (image string) formats
            let imagesToShow=[];

            if (item.images && Array.isArray(item.images) && item.images.length > 0) {
                // New format: images array
                imagesToShow=item.images;
            }

            else if (item.image) {
                // Old format: single image string
                imagesToShow=[item.image];
            }

            if (imagesToShow.length > 0) {
                // Pass first image and all images array
                window.viewImage(imagesToShow[0], imagesToShow);
            }
        });
}

if ( !isFiltering) addDragEvents(el);
container.appendChild(el);
});
}
}

function addDragEvents(el) {
    const dragHandle=el.querySelector('.drag-handle');
    if ( !dragHandle) return;

    // Desktop: HTML5 Drag & Drop
    dragHandle.addEventListener('dragstart', (e)=> {
            e.stopPropagation();
            el.classList.add('dragging');
            e.dataTransfer.effectAllowed='move';
            e.dataTransfer.setData('text/html', el.innerHTML);

            setTimeout(()=> {
                    el.style.opacity='0.6';
                }

                , 0);
        });

    dragHandle.addEventListener('dragend', ()=> {
            el.classList.remove('dragging');
            el.style.opacity='';
            saveReorderedList();
        });
}

function saveReorderedList() {
    const container=lists[currentTab];
    const newIds=Array.from(container.children).map(child=> parseInt(child.getAttribute('data-id')));
    const otherItems=items.filter(i=> i.type !==currentTab);
    const thisTabItems=items.filter(i=> i.type===currentTab);

    const reorderedThisTab=[];

    newIds.forEach(id=> {
            const item=thisTabItems.find(i=> i.id===id);
            if (item) reorderedThisTab.push(item);
        });

    // Merge keeping others
    items=[...otherItems,
    ...reorderedThisTab];
    saveData();
}

['ceyiz-list',
'damat-list'].forEach(id=> {
        const container=document.getElementById(id);

        container.addEventListener('dragover', (e)=> {
                e.preventDefault();
                const afterElement=getDragAfterElement(container, e.clientY);
                const draggable=document.querySelector('.dragging');

                if (draggable) {
                    if (afterElement==null) {
                        container.appendChild(draggable);
                    }

                    else {
                        container.insertBefore(draggable, afterElement);
                    }
                }
            });

        // Listen for touch reorder events from touch-drag-support.js
        container.addEventListener('itemsReordered', ()=> {
                saveReorderedList();
            });
    });

function getDragAfterElement(container, y) {
    const draggableElements=[...container.querySelectorAll('.item-card:not(.dragging)')];

    return draggableElements.reduce((closest, child)=> {
            const box=child.getBoundingClientRect();
            const offset=y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return {
                    offset: offset, element: child
                }

                ;
            }

            else {
                return closest;
            }
        }

        , {
        offset: Number.NEGATIVE_INFINITY
    }).element;
}

function renderStats() {
    const totalCount=items.length;
    const boughtCount=items.filter(i=> i.isBought).length;
    // const remainingCount = totalCount - boughtCount; // Unused
    const pct=totalCount===0 ? 0: Math.round((boughtCount / totalCount) * 100);

    // 1. Hero Card Financials
    let totalCost=0,
    spentCost=0,
    remainingCost=0;
    let monthlySpent=0;

    const now=new Date();
    const currentYear=now.getFullYear();
    const currentMonth=now.getMonth();

    items.forEach(i=> {
            const cost=(i.price || 0) * (i.quantity || 1);
            totalCost +=cost;

            if (i.isBought) {
                spentCost +=cost;

                // Monthly Check
                if (i.dateBought) {
                    const d=new Date(i.dateBought);

                    if (d.getFullYear()===currentYear && d.getMonth()===currentMonth) {
                        monthlySpent +=cost;
                    }
                }
            }

            else {
                remainingCost +=cost;
            }

            if (i.type==='ceyiz') {
                // ... (sub-counts remain same)
            }
        });

    // ... (re-running sub loops for counts if needed, but above loop structure is shared)
    // Re-implementing sub loop logic properly to match existing structure:
    items.forEach(i=> {
            // Redundant loop for safety or keep single? 
            // The original code mixed them. Let's start fresh with single loop above.
        });
    // Fixing variable scope issues by just using one loop. 
    // Resetting counters to correct logic below:

    // Reset counters for correct calculation
    totalCost=0;
    spentCost=0;
    remainingCost=0;
    monthlySpent=0;
    let ceyizTotal=0,
    ceyizSpent=0,
    ceyizCount=0,
    ceyizBought=0;
    let damatTotal=0,
    damatSpent=0,
    damatCount=0,
    damatBought=0;

    items.forEach(i=> {
            const cost=(i.price || 0) * (i.quantity || 1);
            totalCost +=cost;

            if (i.isBought) {
                spentCost +=cost;

                if (i.dateBought) {
                    const d=new Date(i.dateBought);

                    if ( !isNaN(d.getTime()) && d.getFullYear()===currentYear && d.getMonth()===currentMonth) {
                        monthlySpent +=cost;
                    }
                }
            }

            else {
                remainingCost +=cost;
            }

            if (i.type==='ceyiz') {
                ceyizCount++;
                ceyizTotal +=cost;

                if (i.isBought) {
                    ceyizBought++; ceyizSpent +=cost;
                }
            }

            else if (i.type==='damat') {
                damatCount++;
                damatTotal +=cost;

                if (i.isBought) {
                    damatBought++; damatSpent +=cost;
                }
            }
        });

    // User Budget Logic (New Monthly System)
    const useBudget=settings.monthlyBudget>0 || ! !settings.budgetLastUpdated;

    // Ensure values are numbers
    const initialLimit=parseFloat(settings.monthlyBudget || 0);
    const currentWallet=parseFloat(settings.budget || 0);

    // CALCULATIONS:
    // 1. Big Value: In budget mode, show REMAINING BALANCE (Decreases as we spend)
    // In cost mode, show TOTAL COST of everything.
    let displayTotal=useBudget ? (currentWallet - monthlySpent) : totalCost;

    // 2. Spent Value: In budget mode, show spent THIS MONTH. In cost mode, show TOTAL spent.
    let displaySpent=useBudget ? monthlySpent : spentCost;

    // 3. Remaining Value: ALWAYS show COST of items NOT YET BOUGHT (The actual "Need")
    let displayRemaining=remainingCost;

    // Apply to UI
    const statTotalEl=document.getElementById('stat-total-money');
    const statSpentEl=document.getElementById('stat-spent-money');
    const statRemainingEl=document.getElementById('stat-remaining-money');
    const gaugeEl=document.getElementById('budget-gauge-fill');
    const totalLabel=document.querySelector('.hero-main-val .label');

    if (statTotalEl) statTotalEl.textContent=currencyFormatter.format(displayTotal).replace('₺', '').trim();
    if (statSpentEl) statSpentEl.textContent=currencyFormatter.format(displaySpent);
    if (statRemainingEl) statRemainingEl.textContent=currencyFormatter.format(displayRemaining);

    // Update labels for clarity
    if (totalLabel) totalLabel.textContent=useBudget ? 'Kalan Bakiye' : 'Tahmini Toplam';

    const spentLabel=document.querySelector('.hero-item:first-child .label');
    if (spentLabel) spentLabel.textContent=useBudget ? 'Bu Ay Harcanan' : 'Harcanan ve alınanlar';

    if (gaugeEl) {
        // Gauge is always Spent vs Original Limit (or Total Cost)
        const gaugeTotal=useBudget ? initialLimit: totalCost;
        const gaugePct=gaugeTotal===0 ? 0: Math.min(100, Math.round((displaySpent / gaugeTotal) * 100));

        gaugeEl.style.width=gaugePct+'%';

        // Warning color if over budget
        if (useBudget && (initialLimit - monthlySpent) < 0) {
            gaugeEl.style.background='#e74c3c';
        }

        else {
            gaugeEl.style.background='white';
        }
    }


    // 2. Main Progress Cards
    const rings=document.getElementById('total-progress-ring');
    const badge=document.getElementById('total-pct-badge');
    const elTotalCount=document.getElementById('total-items-count');
    const elBoughtCount=document.getElementById('total-bought-count');

    if (rings) {
        const radius=rings.r.baseVal.value;
        const circumference=radius * 2 * Math.PI;
        const offset=circumference - (pct / 100) * circumference;
        rings.style.strokeDashoffset=offset;
    }

    const totalPct = totalCount === 0 ? 0 : Math.round((boughtCount / totalCount) * 100);

    if (badge) badge.textContent = `% ${totalPct}`;
    if (elTotalCount) elTotalCount.textContent=totalCount;
    if (elBoughtCount) elBoughtCount.textContent=boughtCount;

    // Mini Lists
    const ceyizPct=ceyizCount===0 ? 0 : Math.round((ceyizBought / ceyizCount) * 100);
    const damatPct=damatCount===0 ? 0 : Math.round((damatBought / damatCount) * 100);

    const elCBar=document.getElementById('stat-ceyiz-bar');
    const elCRatio=document.getElementById('stat-ceyiz-ratio');

    if (elCBar) elCBar.style.width = `${ceyizPct}%`;
    if (elCRatio) elCRatio.textContent = `${ceyizBought}/${ceyizCount}`;

    const elDBar = document.getElementById('stat-damat-bar');
    const elDRatio = document.getElementById('stat-damat-ratio');

    if (elDBar) elDBar.style.width = `${damatPct}%`;
    if (elDRatio) elDRatio.textContent = `${damatBought}/${damatCount}`;


    // 3. Category Breakdown
    const cats= {}

    ;

    items.forEach(i=> {
            const c=i.category || 'Diğer';
            const cost=(i.price || 0) * (i.quantity || 1);

            if ( !cats[c]) cats[c]= {
                name: c, spent: 0, total: 0
            }

            ;
            cats[c].total +=cost;
            if (i.isBought) cats[c].spent +=cost;
        });

    // Convert to array and sort by TOTAL cost desc
    const sortedCats=Object.values(cats).sort((a, b)=> b.total - a.total).slice(0, 5); // Top 5
    const maxCatVal=sortedCats.length>0 ? sortedCats[0].total : 1;

    const catContainer=document.getElementById('category-breakdown-container');

    if (catContainer) {
        if (sortedCats.length===0) {
            catContainer.innerHTML='<div class="empty-chart-msg">Henüz veri yok</div>';
        }

        else {
            catContainer.innerHTML = sortedCats.map(c => `
                <div class="category-bar-item">
                    <div class="c-bar-icon"><i class="fas fa-tag"></i></div>
                    <div class="c-bar-content">
                        <div class="c-bar-header">
                            <span class="c-name">${c.name}</span>
                            <span class="c-price">${currencyFormatter.format(c.total)}</span>
                        </div>
                        <div class="c-track">
                            <div class="c-fill" style="width: ${(c.total / maxCatVal) * 100}%"></div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }


    // 4. Recent Activity (Last 5 bought items)
    const recentList=document.getElementById('recent-activity-list');

    if (recentList) {
        const boughtItems=items.filter(i=> i.isBought).sort((a, b)=> {
                // If dateAdded exists, sort by date? Otherwise ID desc
                return (b.id || 0) - (a.id || 0);
            }).slice(0, 5);

        if (boughtItems.length === 0) {
            recentList.innerHTML = '<div class="empty-chart-msg">Henüz alınan ürün yok</div>';
        } else {
            recentList.innerHTML = boughtItems.map(i => `
                <div class="recent-item">
                    <div class="recent-img-box">
                        ${(i.images && i.images.length > 0) ? `<img src="${i.images[0]}" alt="Ürün">` : (i.image ? `<img src="${i.image}" alt="Ürün">` : '<i class="fas fa-shopping-bag"></i>')}
                    </div>
                    <div class="recent-info">
                        <span class="recent-name">${i.name}</span>
                        <span class="recent-date">${new Date(i.dateBought || i.dateAdded).toLocaleDateString('tr-TR')}</span>
                    </div>
                    <div class="recent-price">${currencyFormatter.format((i.price || 0) * (i.quantity || 1))}</div>
                </div>
            `).join('');
        }
}

// Update Mini Dashboard on Home Screen
if (typeof updateMiniStats==='function') updateMiniStats();
}


// --- Quotes Logic Removed ---

function updateAllCategoryDropdowns() {
    const type=(currentTab==='stats' || currentTab==='home') ? 'ceyiz': currentTab;
    const currentCats=getCategories(type);

    // 1. Update Filter Dropdown
    if (categoryFilter) {
        const prevFilter=categoryFilter.value;
        categoryFilter.innerHTML='<option value="">T\u00FCm Kategoriler</option>';

        currentCats.forEach(c=> {
                const opt=document.createElement('option');
                opt.value=c;
                opt.textContent=c;
                categoryFilter.appendChild(opt);
            });
        categoryFilter.value=prevFilter;
    }

    // 2. Update Quick Add/Edit Modal Dropdown
    const qaSelect=document.getElementById('qa-new-category-select');

    if (qaSelect) {
        const prevVal=qaSelect.value;
        qaSelect.innerHTML='<option value="" disabled selected>Kategori Se\u00E7iniz</option>';

        currentCats.forEach(c=> {
                const opt=document.createElement('option');
                opt.value=c;
                opt.textContent=c;
                qaSelect.appendChild(opt);
            });

        // Add "Add New" option
        const specialOpt=document.createElement('option');
        specialOpt.value="ADD_NEW";
        specialOpt.textContent="--- Yeni Kategori Ekle ---";
        specialOpt.style.fontWeight="bold";
        specialOpt.style.color="var(--primary-color)";
        qaSelect.appendChild(specialOpt);

        if (prevVal && [...qaSelect.options].some(o=> o.value===prevVal)) {
            qaSelect.value=prevVal;
        }

        // Explicitly set change handler to ensure it works and doesn't stack
        qaSelect.onchange=(e)=> {
            const newCatContainer=document.getElementById('qa-new-cat-container');
            const val=e.target.value;

            // Handle both "new" (legacy) and "ADD_NEW"
            if (val==='new' || val==='ADD_NEW') {
                if (newCatContainer) {
                    newCatContainer.classList.remove('hidden');

                    setTimeout(()=> {
                            const input=document.getElementById('qa-new-cat-input');
                            if (input) input.focus();
                        }

                        , 50);
                }
            }

            else {
                if (newCatContainer) newCatContainer.classList.add('hidden');
            }
        }

        ;
    }
}

window.appData.updateAllCategoryDropdowns=updateAllCategoryDropdowns;

// --- Actions ---

// Helper function to close the quick add modal
// --- Legacy Functions Removed (2025-02-01) ---
// (closeQuickAddModal, saveQuickAddItem, openQuickAddModal were duplicates)
// ----------------------------------------------

// Edit Item Modal - Opens the quick add modal in edit mode
window.editItemModal=function (item) {
    const qaModal=document.getElementById('modal-quick-add-category');
    const qaName=document.getElementById('qa-new-product-name');
    const qaSelect=document.getElementById('qa-new-category-select');
    const qaQty=document.getElementById('qa-new-qty');
    const qaPrice=document.getElementById('qa-new-price');
    const qaNote=document.getElementById('qa-new-note');
    const qaError=document.getElementById('qa-new-error-msg');
    const modalTitle=qaModal?.querySelector('.modal-header h2');

    if ( !qaModal || !item) {
        console.error('Modal or item missing', {
            qaModal, item
        });
    return;
}

// Set modal to edit mode
qaModal.dataset.editId=item.id;
if (modalTitle) modalTitle.textContent='\u00DCr\u00FCn\u00FC D\u00FCzenle';

// Fill form with existing data
if (qaName) qaName.value=item.name;
if (qaQty) qaQty.value=item.quantity || 1;
if (qaPrice) qaPrice.value=item.price || '';
if (qaNote) qaNote.value=item.note || '';
if (qaError) qaError.classList.add('hidden');

// Populate and select category
if (qaSelect) {
    qaSelect.innerHTML='<option value="" disabled>Kategori Se\u00E7iniz</option>';
    const cats=(item.type==='damat' ? userCategories.damat : userCategories.ceyiz) || [];

    if (cats.length===0) {
        alert('\u00D6nce kategori eklemelisiniz!');
        return;
    }

    cats.forEach(c=> {
            const opt=document.createElement('option');
            opt.value=c;
            opt.textContent=c;
            if (c===item.category) opt.selected=true;
            qaSelect.appendChild(opt);
        });
}

// Open modal
qaModal.classList.remove('hidden');
requestAnimationFrame(()=> qaModal.classList.add('active'));
document.body.classList.add('modal-open');
if (qaName) qaName.focus();
}

;

// Verify function is assigned
console.log('âœ… window.editItemModal assigned:', typeof window.editItemModal);

// --- New Home Logic (Greeting & Mini Dashboard) ---
function updateGreeting() {
    const el=document.getElementById('home-greeting');
    if ( !el) return;

    const now=new Date();
    const hour=now.getHours();
    const titleEl=el.querySelector('.greeting-title');
    const subEl=el.querySelector('.greeting-subtitle');

    let greeting="Merhaba";
    if (hour >=6 && hour < 12) greeting="G\u00FCnayd\u0131n";
    else if (hour >=12 && hour < 18) greeting="T\u00FCnayd\u0131n";
    else if (hour >=18 && hour < 22) greeting="\u0130yi Ak\u015Famlar";
    else greeting="\u0130yi Geceler";

    // Dil kontrol\u00FC ve selamlama
    // User asked for Turkish, ensure all text is Turkish
    // (Existing text is already Turkish)

    const name=settings.name || '\u015EŞevval';

    if (titleEl) titleEl.textContent=`

    ,
    

    👋`;

    // Random subtitle motivation
    const subs=[ "Bug\u00FCn hayallerin i\u00E7in harika bir g\u00FCn!",
    "Eksikler azal\u0131yor, mutluluk art\u0131yor.",
    "Her detay seninle g\u00FCzelle\u015Fiyor.",
    "\u00C7eyiz listesi seni bekliyor âœ¨"
    ];

    if (subEl) {
        // Change subtitle only occasionally or static? Let's keep it static for now or random on load.
        // subEl.textContent = subs[Math.floor(Math.random() * subs.length)];
    }
}

function updateMiniStats() {

    // Calculate percentages for Ceyiz and Bohca
    ['ceyiz',
    'damat'].forEach(type=> {
            const subItems=items.filter(i=> i.type===type);
            const total=subItems.length;
            const bought=subItems.filter(i=> i.isBought).length;
            const pct=total===0 ? 0 : Math.round((bought / total) * 100);

            const elPct=document.getElementById(`mini-${type}

                -percent`);

            const elFill=document.getElementById(`mini-${type}

                -fill`);

            if (elPct) elPct.textContent=`%${pct}

            `;

            if (elFill) elFill.style.width=`${pct}%`;
        });
}

// New Home Action Cards Listener
document.addEventListener('click', (e)=> {
        const card=e.target.closest('.home-action-card');

        if (card) {
            const target=card.dataset.nav;

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
        if (e.key==='Enter') {
            const active=document.activeElement;

            if (active && (active.id==='qa-product-name' || active.id==='qa-name' || active.id==='qa-qty' || active.id==='qa-category-select')) {
                e.preventDefault();
                // Call global execute directly
                if (window.executeQuickAdd) window.executeQuickAdd();
            }
        }
    });

// ... (Toggle Status and other funcs remain same) ...

function toggleStatus(id, isChecked) {
    const item=items.find(i=> i.id===id);

    if (item) {
        item.isBought=isChecked;

        if (isChecked) {
            item.dateBought=new Date().toISOString();
        }

        else {
            delete item.dateBought;
        }

        saveData();

        // Wait for animation to complete before re-rendering (0.6s total animation time)
        setTimeout(()=> {
                renderApp();
            }

            , 600);

        if (isChecked) {
            const msg=successMessages[Math.floor(Math.random() * successMessages.length)];
            showToast(msg, false);
            const boughtCount=items.filter(i=> i.isBought).length;

            if (boughtCount > 0 && boughtCount % 5===0) {
                setTimeout(()=> showToast(`ŞŞevval, harikasın ! 

                        ürün oldu bile ! ✨`, false), 3000);
            }
        }
    }
}

let returnToSettingsOnClose=false;

function openCategoryModal(fromSettings=false) {
    returnToSettingsOnClose=fromSettings;

    if (modalSettings) {
        modalSettings.classList.remove('active'); // Close settings if open

        // Do not hide immediately if we want to preserve state? 
        // Actually, hiding is fine, we just reopen it later.
        setTimeout(()=> {
                if (modalSettings) modalSettings.classList.add('hidden');
            }

            , 300);
    }

    if (modalCats) {
        modalCats.classList.remove('hidden');
        requestAnimationFrame(()=> modalCats.classList.add('active'));
        document.body.classList.add('modal-open');
        // Default render current tab or ceyiz
        const type=(currentTab==='stats' || currentTab==='home') ? 'ceyiz': currentTab;

        if (typeof renderCategoryManager==='function') {
            renderCategoryManager(type);
        }

        else {
            console.error("renderCategoryManager not found");
        }
    }
}

window.openCategoryModal=openCategoryModal;

// Listener for Settings Button
const btnSettingsManageCats=document.getElementById('btn-settings-manage-cats');

if (btnSettingsManageCats) {
    btnSettingsManageCats.addEventListener('click', ()=> openCategoryModal(true));
}

// Listener for Main Button (Using existing references)
if (btnManageCats) {
    btnManageCats.onclick=()=>openCategoryModal(false);
}

function showToast(msg, allowUndo=false) {
    // Ensure elements exist
    if ( !toastMessage || !toastContainer) return;

    toastMessage.textContent=msg;
    if (allowUndo && btnUndo) btnUndo.classList.remove('hidden');
    else if (btnUndo) btnUndo.classList.add('hidden');

    toastContainer.classList.remove('hidden');
    if (undoTimeout) clearTimeout(undoTimeout);

    undoTimeout=setTimeout(()=> {
            toastContainer.classList.add('hidden');
        }

        , 4000);
}

window.appData.showToast=showToast;

// ========================================
// Custom In-App Notification System
// ========================================

// Show notification modal (replaces alert())
function showNotification(message, options= {}) {
    const {
        title='Bildirim',
        icon='💬',
        type='info',
        // info, success, error, warning
        duration=null,
        // null = requires click to close
        onClose=null
    }

    =options;

    // Create modal
    const modal=document.createElement('div');
    modal.className='modal active';
    modal.style.zIndex='10000';

    // Type-based colors
    const typeColors= {
        info: {
            bg: 'var(--primary-color)', icon: '💬'
        }

        ,
        success: {
            bg: '#2ecc71', icon: '✅'
        }

        ,
        error: {
            bg: '#e74c3c', icon: '⚠️'
        }

        ,
        warning: {
            bg: '#f39c12', icon: '⚡'
        }
    }

    ;

    const colorScheme=typeColors[type] || typeColors.info;
    const displayIcon=icon || colorScheme.icon;

    modal.innerHTML=` <div class="modal-backdrop" style="background: rgba(0, 0, 0, 0.7);"></div><div class="modal-content-sheet" style="max-width: 400px; text-align: center; padding: 2rem; border-radius: 16px;"><div style="font-size: 3rem; margin-bottom: 1rem; animation: bounce 0.6s ease-out;">

    </div><h3 style="margin-bottom: 1rem; color: var(--text-color); font-size: 1.3rem;">

    </h3><p style="margin-bottom: 1.5rem; color: var(--text-light); line-height: 1.6; white-space: pre-line;">

    </p><button class="btn-notification-close"
    style="width: 100%; padding: 1rem; background: ${colorScheme.bg}; 
 border: none;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: transform 0.2s;
    ">
 Anladım </button></div>`;

    document.body.appendChild(modal);
    document.body.classList.add('modal-open');

    const closeBtn=modal.querySelector('.btn-notification-close');
    const backdrop=modal.querySelector('.modal-backdrop');

    const closeModal=()=> {
        modal.classList.remove('active');

        setTimeout(()=> {
                modal.remove();

                if ( !document.querySelector('.modal.active')) {
                    document.body.classList.remove('modal-open');
                }
            }

            , 200);
        if (onClose) onClose();
    }

    ;

    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    // Auto-close if duration specified
    if (duration) {
        setTimeout(closeModal, duration);
    }

    // Add bounce animation
    const style=document.createElement('style');

    style.textContent=` @keyframes bounce {

        0%,
        100% {
            transform: translateY(0);
        }

        50% {
            transform: translateY(-10px);
        }
    }

    `;
    document.head.appendChild(style);
}

// Show confirmation dialog (replaces confirm())
function showConfirm(message, options= {}) {
    return new Promise((resolve)=> {
            const {
                title='Onay',
                icon='❓',
                confirmText='Evet',
                cancelText='Hayır',
                confirmColor='#2ecc71',
                cancelColor='#95a5a6'
            }

            =options;

            const modal=document.createElement('div');
            modal.className='modal active';
            modal.style.zIndex='10000';

            modal.innerHTML=` <div class="modal-backdrop" style="background: rgba(0, 0, 0, 0.7);" ></div> <div class="modal-content-sheet" style="max-width: 400px; text-align: center; padding: 2rem; border-radius: 16px;" > <div style="font-size: 3rem; margin-bottom: 1rem;" > 

            </div> <h3 style="margin-bottom: 1rem; color: var(--text-color); font-size: 1.3rem;" > 

            </h3> <p style="margin-bottom: 1.5rem; color: var(--text-light); line-height: 1.6; white-space: pre-line;" > 

            </p> <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;" > <button class="btn-confirm-cancel"
            style="padding: 1rem; background: ${cancelColor}; 
 border: none; border-radius: 12px; color: white; font-weight: 600;

            font-size: 1rem; cursor: pointer; ">


            </button> <button class="btn-confirm-ok"
            style="padding: 1rem; background: ${confirmColor}; 
 border: none; border-radius: 12px; color: white; font-weight: 600;

            font-size: 1rem; cursor: pointer; ">


            </button> </div> </div> `;

            document.body.appendChild(modal);
            document.body.classList.add('modal-open');

            const btnOk=modal.querySelector('.btn-confirm-ok');
            const btnCancel=modal.querySelector('.btn-confirm-cancel');
            const backdrop=modal.querySelector('.modal-backdrop');

            const closeModal=(result)=> {
                modal.classList.remove('active');

                setTimeout(()=> {
                        modal.remove();

                        if ( !document.querySelector('.modal.active')) {
                            document.body.classList.remove('modal-open');
                        }
                    }

                    , 200);
                resolve(result);
            }

            ;

            btnOk.addEventListener('click', ()=> closeModal(true));
            btnCancel.addEventListener('click', ()=> closeModal(false));
            backdrop.addEventListener('click', ()=> closeModal(false));
        });
}

// Expose globally
window.showNotification=showNotification;
window.showConfirm=showConfirm;

function initiateDelete(id) {
    console.log("initiateDelete called for id:", id);
    const itemIndex=items.findIndex(i=> i.id===id);

    if (itemIndex===-1) {
        console.error("Item not found for deletion:", id);
        return;
    }

    const item=items[itemIndex];
    pendingDeleteItem=item;

    // Use slice/splice to ensure mutation or re-assignment is clear
    items=items.filter(i=> i.id !==id);
    console.log("Item removed. New items length:", items.length);

    saveData();
    renderApp();

    showToast("Ürün silindi", true);
}

// --- Render Category Manager ---
function renderCategoryManager(type, filter='') {

    // Default to provided type or current tab
    if ( !type) {
        type=(currentTab==='stats' || currentTab==='home') ? 'ceyiz': currentTab;
    }

    const listContainer=document.getElementById('category-list-container');
    if ( !listContainer) return;

    // Header with switch buttons
    listContainer.innerHTML=` <div style="display:flex; gap:10px; margin-bottom:15px;"><button onclick="renderCategoryManager('ceyiz')" class="btn-ghost ${type === 'ceyiz' ? 'active' : ''}" style="${type === 'ceyiz' ? 'background:var(--primary-light); color:var(--primary-color); font-weight:bold;' : ''}">Çeyiz</button><button onclick="renderCategoryManager('damat')" class="btn-ghost ${type === 'damat' ? 'active' : ''}" style="${type === 'damat' ? 'background:var(--primary-light); color:var(--primary-color); font-weight:bold;' : ''}">Bohça</button></div><div style="display:flex; gap:8px; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:15px;"><input type="text" id="cat-man-new-input" placeholder="Yeni Kategori Adı" class="modern-input" style="flex:1;"><button id="cat-man-add-btn" class="btn-primary" style="padding:0 15px;"><i class="fas fa-plus"></i></button></div><div id="cat-man-list" style="max-height: 300px; overflow-y: auto;"></div>`;

    // Add Button Logic
    const addBtn=document.getElementById('cat-man-add-btn');
    const input=document.getElementById('cat-man-new-input');

    if (addBtn && input) {
        addBtn.onclick=()=> {
            const val=input.value.trim();

            if (val) {
                window.addCategory(val, type); // Modified addCategory to accept type
                input.value='';
                renderCategoryManager(type); // Re-render
            }
        }

        ;
    }

    const defs=defaultCategories[type] || [];
    const users=userCategories[type] || [];

    // Combine
    const allCats=[ ...users.map(c=> ({
            name: c, isDefault: false

        })),
...defs.map(c=> ({
        name: c, isDefault: true
    }))];

let filtered=allCats;

if (filter) {
    filtered=allCats.filter(c=> c.name.toLowerCase().includes(filter.toLowerCase()));
}

const listDiv=document.getElementById('cat-man-list');
if ( !listDiv) return;

if (filtered.length===0) {
    listDiv.innerHTML=`<div class="empty-state-small">Sonuç yok</div>`;
    return;
}

filtered.forEach(cat=> {
        const el=document.createElement('div');
        el.className='cat-manage-item';
        el.style.display='flex';
        el.style.justifyContent='space-between';
        el.style.padding='12px';
        el.style.borderBottom='1px solid #eee';
        el.style.alignItems='center';

        const left=document.createElement('span');
        left.textContent=cat.name;
        left.style.fontWeight='500';

        const right=document.createElement('div');

        if (cat.isDefault) {
            const badge=document.createElement('span');
            badge.className='badge-default';
            badge.textContent='Varsayılan';
            badge.style.fontSize='0.75rem';
            badge.style.background='#f0f0f0';
            badge.style.padding='4px 8px';
            badge.style.borderRadius='12px';
            badge.style.color='#888';
            right.appendChild(badge);
        }

        else {
            const btnDel=document.createElement('button');
            btnDel.className='btn-icon-sm delete';
            btnDel.innerHTML='<i class="fas fa-trash"></i>';
            btnDel.style.color='salmon';

            btnDel.onclick=()=> {
                if (confirm(`${cat.name} kategorisini silmek istediğine emin misin?`)) {
                    deleteCategory(cat.name, type);
                    renderCategoryManager(type);
                }
            }

            ;
            right.appendChild(btnDel);
        }

        el.appendChild(left);
        el.appendChild(right);
        listDiv.appendChild(el);
    });
}

// Assign global for inline onclicks
window.renderCategoryManager=renderCategoryManager;


function updateAllCategoryDropdowns() {
    const type=(currentTab==='stats' || currentTab==='home') ? 'ceyiz': currentTab;
    const currentCats=getCategories(type);

    // 1. Update Filter Dropdown
    if (categoryFilter) {
        const prevFilter=categoryFilter.value;
        categoryFilter.innerHTML='<option value="">Tüm Kategoriler</option>';

        currentCats.forEach(c=> {
                const opt=document.createElement('option');
                opt.value=c;
                opt.textContent=c;
                categoryFilter.appendChild(opt);
            });
        categoryFilter.value=prevFilter;
    }

    // 2. Update Quick Add/Edit Modal Dropdown
    const qaSelect=document.getElementById('qa-new-category-select');

    if (qaSelect) {
        // Remove "ADD_NEW" logic, just render details
        const prevVal=qaSelect.value;
        qaSelect.innerHTML='<option value="" disabled selected>Kategori Seçiniz</option>';

        currentCats.forEach(c=> {
                const opt=document.createElement('option');
                opt.value=c;
                opt.textContent=c;
                qaSelect.appendChild(opt);
            });

        if (prevVal && [...qaSelect.options].some(o=> o.value===prevVal)) {
            qaSelect.value=prevVal;
        }

        // Remove change listener that toggles the (now deleted) input
        qaSelect.onchange=null;
    }
}

// --- Add Category (Updated) ---
window.addCategory=function (newCatName, typeArg) {
    if ( !newCatName) return;
    const type=typeArg || ((currentTab==='damat') ? 'damat' : 'ceyiz'); // Robust fallback

    if ( !userCategories[type]) userCategories[type]=[];
    const exists=userCategories[type].map(c=> c.toLowerCase()).includes(newCatName.toLowerCase()) || defaultCategories[type].map(c=> c.toLowerCase()).includes(newCatName.toLowerCase());

    if (exists) {
        alert("Bu kategori zaten mevcut!");
        return;
    }

    userCategories[type].push(newCatName);
    saveData();
    updateAllCategoryDropdowns();

    console.log(`✅ New category added to 

        : 

        `);
    showToast("Kategori eklendi! ✨");
}

;

// --- Delete Category --- (Consolidated)
function deleteCategory(name, type) {
    if ( !confirm(`${cat.name} kategorisini silmek istediğine emin misin?`)) return;

    if (userCategories[type]) {
        userCategories[type]=userCategories[type].filter(c=> c !==name);
        saveData();
        updateAllCategoryDropdowns();
        renderCategoryManager(type); // Re-render local list
        showToast("Kategori silindi.");
    }
}






// Globals for inline calls
// Helper needs to be global if we have scope issues, but let's try to keep it clean.
// We will stick to local function hoisting, but protect the call.

// Globals for inline calls
// --- Item Editor State & Logic ---
window.currentItemPhotos=[];
window.currentItemLinks=[];

// Helper: Render Photo Grid in Editor
function renderPhotoGrid() {
    try {
        const grid=document.getElementById('editor-photo-grid');
        if ( !grid) return;
        grid.innerHTML='';

        const photos=window.currentItemPhotos || [];

        photos.forEach((imgSrc, idx)=> {
                const div=document.createElement('div');
                div.className='photo-preview-item';
                div.innerHTML=` <img src="${imgSrc}" alt="Photo ${idx}" > <button type="button" class="photo-remove-btn" onclick="removeEditorPhoto(${idx})" > <i class="fas fa-times" ></i> </button> `;
                grid.appendChild(div);
            });
    }

    catch (e) {
        console.error("Error rendering photo grid:", e);
    }
}

window.removeEditorPhoto=function (idx) {
    if (window.currentItemPhotos) {
        window.currentItemPhotos.splice(idx, 1);
        renderPhotoGrid();
    }
}

;

// Helper: Render Link List in Editor
function renderLinkList() {
    try {
        const list=document.getElementById('editor-links-list');
        if ( !list) return;
        list.innerHTML='';

        const links=window.currentItemLinks || [];

        links.forEach((link, idx)=> {
                const row=document.createElement('div');
                row.className='link-item-row';

                row.innerHTML=` <i class="fas fa-link" style="color:var(--text-light); font-size:0.8rem;" ></i> <a href="${link}" target="_blank" >

                </a> <button type="button" class="link-remove-btn" onclick="removeEditorLink(${idx})" > <i class="fas fa-times" ></i> </button> `;
                list.appendChild(row);
            });
    }

    catch (e) {
        console.error("Error rendering link list:", e);
    }
}

window.removeEditorLink=function (idx) {
    if (window.currentItemLinks) {
        window.currentItemLinks.splice(idx, 1);
        renderLinkList();
    }
}

;

// Main Function to Open Editor
window.openItemEditor=function (item=null) {
    console.log("Opening item editor...", item ? "Edit mode" : "New mode");
    const modal=document.getElementById('modal-item-editor');
    if ( !modal) return;

    // Reset state
    window.currentItemPhotos=[];
    window.currentItemLinks=[];

    const isEdit= ! !item;
    const editorTitle=document.getElementById('editor-title');
    const editorId=document.getElementById('editor-id');
    const nameInput=document.getElementById('editor-name');
    const qtyInput=document.getElementById('editor-qty');
    const priceInput=document.getElementById('editor-price');
    const noteInput=document.getElementById('editor-note');
    const boughtCheck=document.getElementById('editor-bought');
    const catSelect=document.getElementById('editor-category');
    const newCatContainer=document.getElementById('editor-new-cat-container');
    const newCatInput=document.getElementById('editor-new-cat-input');

    // Reset UI
    if (editorId) editorId.value=isEdit ? item.id: '';
    if (nameInput) nameInput.value=isEdit ? item.name: '';
    if (qtyInput) qtyInput.value=isEdit ? (item.quantity || 1): 1;
    if (priceInput) priceInput.value=(isEdit && item.price) ? item.price: '';
    if (noteInput) noteInput.value=(isEdit && item.note) ? item.note: '';
    if (boughtCheck) boughtCheck.checked=isEdit ? item.isBought: false;
    if (newCatContainer) newCatContainer.classList.add('hidden');
    if (newCatInput) newCatInput.value='';
    if (editorTitle) editorTitle.textContent=isEdit ? 'Ürünü Düzenle ✏️': 'Yeni Ürün Ekle ✨';

    // Load Categories
    const type=isEdit ? item.type: currentTab;
    const targetType=(type==='stats' || type==='home') ? 'ceyiz': type;
    const cats=getCategories(targetType);

    if (catSelect) {
        catSelect.innerHTML='<option value="" disabled selected>Seçiniz</option>';

        cats.forEach(c=> {
                const opt=document.createElement('option');
                opt.value=c;
                opt.textContent=c;
                catSelect.appendChild(opt);
            });
        const addNewOpt=document.createElement('option');
        addNewOpt.value='ADD_NEW';
        addNewOpt.textContent='+ Yeni Kategori Ekle';
        catSelect.appendChild(addNewOpt);

        if (isEdit) catSelect.value=item.category;

        catSelect.onchange=(e)=> {
            if (e.target.value==='ADD_NEW') {
                newCatContainer.classList.remove('hidden');
                newCatInput.focus();
            }

            else {
                newCatContainer.classList.add('hidden');
            }
        }

        ;
    }

    // Load item data if edit
    if (isEdit) {
        if (item.images && Array.isArray(item.images)) {
            window.currentItemPhotos=[...item.images];
        }

        else if (item.image) {
            window.currentItemPhotos=[item.image];
        }

        if (item.links && Array.isArray(item.links)) {
            window.currentItemLinks=[...item.links];
        }

        else if (item.link) {
            window.currentItemLinks=[item.link];
        }
    }

    renderPhotoGrid();
    renderLinkList();

    modal.classList.remove('hidden');
    requestAnimationFrame(()=> modal.classList.add('active'));
    document.body.classList.add('modal-open');
}

;

window.closeItemEditor=function () {
    const modal=document.getElementById('modal-item-editor');

    if (modal) {
        modal.classList.remove('active');
        setTimeout(()=> modal.classList.add('hidden'), 200);
        document.body.classList.remove('modal-open');
    }
}

;

// Editor Interactions - Photos
const photoInput=document.getElementById('editor-photo-input');
const dropZone=document.getElementById('editor-drop-zone');

async function processAndAddPhotos(files) {
    if ( !files || files.length===0) return;

    // Use window.currentItemPhotos ensuring it is initialized
    if ( !window.currentItemPhotos) window.currentItemPhotos=[];

    const validFiles=Array.from(files).filter(f=> f.type.startsWith ('image/') && f.size <=25 * 1024 * 1024);

    if (validFiles.length===0) {
        showToast("Lütfen geçerli bir görsel dosyası seçin (Maks 25MB)", false);
        return;
    }

    const grid=document.getElementById('editor-photo-grid');
    let loader=null;

    if (grid) {
        loader=document.createElement('div');
        loader.className='photo-loading-indicator';
        loader.innerHTML='<i class="fas fa-spinner fa-spin"></i> İşleniyor...';
        loader.style.cssText="grid-column: 1/-1; padding: 20px; text-align: center; color: var(--primary-color);";
        grid.appendChild(loader);
    }

    let addedCount=0;

    for (const file of validFiles) {
        try {
            console.log("Processing file:", file.name);
            // Reduced size to 800px and quality 0.6 to save storage space
            const base64=await resizeImage(file, 800, 0.6);

            if (base64) {
                window.currentItemPhotos.push(base64);
                addedCount++;
            }
        }

        catch (e) {
            console.error("Photo process error for " + file.name + ":", e);

            showToast(`❌ 

                işlenemedi`, false);
        }
    }

    if (loader) loader.remove();
    renderPhotoGrid();

    if (addedCount > 0) {
        showToast(`✅ 

            fotoğraf eklendi`);
    }
}

if (photoInput) {
    photoInput.onchange=async (e)=> {
        await processAndAddPhotos(e.target.files);
        photoInput.value='';
    }

    ;
}

if (dropZone) {

    ['dragenter',
    'dragover',
    'dragleave',
    'drop'].forEach(name=> {
            dropZone.addEventListener(name, (e)=> {
                    e.preventDefault(); e.stopPropagation();
                });
        });
    dropZone.addEventListener('dragenter', ()=> dropZone.classList.add('drag-active'));
    dropZone.addEventListener('dragleave', ()=> dropZone.classList.remove('drag-active'));

    dropZone.addEventListener('drop', async (e)=> {
            dropZone.classList.remove('drag-active');
            await processAndAddPhotos(e.dataTransfer.files);
        });

    dropZone.onclick=(e)=> {
        if (e.target.tagName !=='BUTTON' && !e.target.closest('button')) {
            if (photoInput) photoInput.click();
        }
    }

    ;
}

// Editor Interactions - Links
const btnAddLink=document.getElementById('btn-add-link');
const linkInput=document.getElementById('editor-link-input');

if (btnAddLink && linkInput) {
    btnAddLink.onclick=()=> {
        let url=linkInput.value.trim();
        if ( !url) return;
        if ( !url.startsWith ('http')) url='https://'+url;
        window.currentItemLinks.push(url);
        linkInput.value='';
        renderLinkList();
    }

    ;
}

// Save Logic
const btnSaveEditor=document.getElementById('btn-save-editor');

if (btnSaveEditor) {
    btnSaveEditor.onclick=async ()=> {
        if (btnSaveEditor.disabled) return;

        const name=document.getElementById('editor-name').value.trim();
        const catSelect=document.getElementById('editor-category');
        let category=catSelect.value;

        if (category==='ADD_NEW') {
            category=document.getElementById('editor-new-cat-input').value.trim();
            if (category) window.addCategory(category, (currentTab==='stats' || currentTab==='home') ? 'ceyiz' : currentTab);
        }

        if ( !name || !category) {
            alert("Ürün adı ve kategori zorunludur.");
            return;
        }

        const idVal=document.getElementById('editor-id').value;
        const isEdit= ! !idVal;
        const itemId=isEdit ? parseInt(idVal) : Date.now();
        let type=(currentTab==='stats' || currentTab==='home') ? 'ceyiz' : currentTab;

        if (isEdit) {
            const existing=items.find(i=> i.id===itemId);
            if (existing) type=existing.type;
        }

        const isBought=document.getElementById('editor-bought').checked;

        const newItem= {
            id: itemId,
                type: type,
                name: name,
                category: category,
                quantity: parseInt(document.getElementById('editor-qty').value) || 1,
                price: parseFloat(document.getElementById('editor-price').value) || 0,
                note: document.getElementById('editor-note').value.trim(),
                isBought: isBought,
                images: window.currentItemPhotos,
                links: window.currentItemLinks,
                image: window.currentItemPhotos[0] || '',
                link: window.currentItemLinks[0] || '',
                dateAdded: isEdit ? (items.find(i=> i.id===itemId)?.dateAdded || new Date().toISOString()): new Date().toISOString()
        }

        ;

        if (isEdit) {
            const idx=items.findIndex(i=> i.id===itemId);
            if (idx > -1) items[idx]=newItem;
        }

        else {
            items.push(newItem);
        }

        btnSaveEditor.disabled=true;
        btnSaveEditor.textContent='...';

        try {
            saveData();
            renderApp();
            window.closeItemEditor();
            showToast(isEdit ? "Güncellendi" : "Eklendi");
        }

        finally {
            btnSaveEditor.disabled=false;
            btnSaveEditor.textContent='Kaydet';
        }
    }

    ;
}

window.editItemModal=window.openItemEditor;
const fabAdd=document.getElementById('fab-add');

if (fabAdd) {
    fabAdd.onclick=()=> {
        if (currentTab==='home' || currentTab==='stats') currentTab='ceyiz';
        window.openItemEditor();
    }

    ;
}


// --- General Stats Detail Modal Logic ---
function renderGeneralStatsDetail() {
    const totalItems=items.length;
    const boughtItems=items.filter(i=> i.isBought).length;
    const remainItems=totalItems - boughtItems;

    // Cost
    let totalCost=0;
    let spentCost=0;

    items.forEach(i=> {
            const p=(i.price || 0) * (i.quantity || 1);
            totalCost +=p;
            if (i.isBought) spentCost +=p;
        });

    const remainCost=totalCost - spentCost;

    // Update DOM
    document.getElementById('gen-stat-bought').textContent=boughtItems;
    document.getElementById('gen-stat-remain').textContent=remainItems;
    document.getElementById('gen-stat-total').textContent=totalItems;

    if (settings.budget > 0 || totalCost > 0) {
        document.getElementById('gen-stat-cost-total').textContent=currencyFormatter.format(totalCost);
        document.getElementById('gen-stat-cost-spent').textContent=currencyFormatter.format(spentCost);
        document.getElementById('gen-stat-cost-remain').textContent=currencyFormatter.format(remainCost);
    }

    // Breakdown by Category (Top 5 + Others or just All)
    const catMap= {}

    ;

    items.forEach(i=> {
            const k=i.category || 'Diğer';

            if ( !catMap[k]) catMap[k]= {
                total: 0, bought: 0
            }

            ;
            catMap[k].total++;
            if (i.isBought) catMap[k].bought++;
        });

    const sortedCats=Object.entries(catMap).sort((a, b)=> b[1].total - a[1].total);
    const listDiv=document.getElementById('gen-stat-cat-breakdown');

    if (listDiv) {
        listDiv.innerHTML='';

        sortedCats.forEach(([cat, stats])=> {
                const pct=Math.round((stats.bought / stats.total) * 100);
                const row=document.createElement('div');
                row.className='cat-stat-row';

                row.innerHTML=` <div class="cs-info" > <span class="cs-name" >

                </span> <span class="cs-val" >

                /

                </span> </div> <div class="cs-bar-bg" > <div class="cs-bar-fill" style="width: ${pct}%" ></div> </div> `;
                listDiv.appendChild(row);
            });
    }
}

const statCardGeneral=document.getElementById('stat-card-general');
const modalGenStats=document.getElementById('modal-general-stats');
const btnCloseGenStats=document.getElementById('btn-close-gen-stats');

if (statCardGeneral && modalGenStats) {
    statCardGeneral.addEventListener('click', ()=> {
            renderGeneralStatsDetail();
            modalGenStats.classList.remove('hidden');
            requestAnimationFrame(()=> modalGenStats.classList.add('active'));
            document.body.classList.add('modal-open');
        });
}

if (btnCloseGenStats && modalGenStats) {
    btnCloseGenStats.addEventListener('click', ()=> {
            modalGenStats.classList.remove('active');
            setTimeout(()=> modalGenStats.classList.add('hidden'), 200);
            document.body.classList.remove('modal-open');
        });
}

// --- Lists Detail Modal Logic ---
function renderListsDetail() {

    ['ceyiz',
    'damat'].forEach(type=> {
            const listItems=items.filter(i=> i.type===type);
            const total=listItems.length;
            const bought=listItems.filter(i=> i.isBought).length;
            const remain=total - bought;

            let cost=0;

            listItems.forEach(i=> {
                    if (i.isBought) cost +=(i.price || 0) * (i.quantity || 1);
                });

            document.getElementById(`ld-${type}

                -total`).textContent=total;

            document.getElementById(`ld-${type}

                -bought`).textContent=bought;

            document.getElementById(`ld-${type}

                -remain`).textContent=remain;

            // For cost, show Spent 
            document.getElementById(`ld-${type}

                -cost`).textContent=currencyFormatter.format(cost);
        });
}

const statCardLists=document.getElementById('stat-card-lists');
const modalListsDetail=document.getElementById('modal-lists-detail');
const btnCloseListsDetail=document.getElementById('btn-close-lists-detail');

if (statCardLists && modalListsDetail) {
    statCardLists.addEventListener('click', ()=> {
            renderListsDetail();
            modalListsDetail.classList.remove('hidden');
            requestAnimationFrame(()=> modalListsDetail.classList.add('active'));
            document.body.classList.add('modal-open');
        });
}

if (btnCloseListsDetail && modalListsDetail) {
    btnCloseListsDetail.addEventListener('click', ()=> {
            modalListsDetail.classList.remove('active');
            setTimeout(()=> modalListsDetail.classList.add('hidden'), 200);
            document.body.classList.remove('modal-open');
        });
}

// --- Category Spend Detail Modal Logic ---
function renderCategorySpendDetail() {
    const catMap= {}

    ;
    let grandTotal=0;

    items.forEach(i=> {
            const k=i.category || 'Diğer';

            if ( !catMap[k]) catMap[k]= {
                cost: 0, count: 0, boughtCount: 0
            }

            ;

            const price=(i.price || 0) * (i.quantity || 1);
            catMap[k].cost +=price;
            catMap[k].count++;
            if (i.isBought) catMap[k].boughtCount++;

            grandTotal +=price;
        });

    document.getElementById('csd-total-cost').textContent=currencyFormatter.format(grandTotal);

    const sortedCats=Object.entries(catMap).sort((a, b)=> b[1].cost - a[1].cost);
    const listDiv=document.getElementById('csd-list');

    if (listDiv) {
        listDiv.innerHTML='';

        sortedCats.forEach(([cat, stats])=> {
                if (stats.cost===0 && stats.count===0) return; // Skip empty? No, show all if existing

                const row=document.createElement('div');
                row.className='cat-stat-row';
                // Find icon based on category name roughly or default
                // We'll use a generic tag icon

                row.innerHTML=` <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-color); padding:10px; border-radius:12px; border:1px solid var(--border-color);" > <div style="display:flex; align-items:center; gap:10px;" > <span style="width:32px; height:32px; background:#f0f0f0; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#666;" > <i class="fas fa-tag" ></i> </span> <div> <div style="font-weight:600; font-size:0.95rem;" >

                </div> <div style="font-size:0.75rem; color:var(--text-light);" >

                /

                Ürün</div> </div> </div> <div style="text-align:right;" > <div style="font-weight:700; color:var(--primary-color); font-size:1rem;" >

                </div> </div> </div> `;
                listDiv.appendChild(row);
            });
    }
}

const cardCatBreakdown=document.getElementById('category-breakdown-container');
const modalCatSpend=document.getElementById('modal-cat-spend-detail');
const btnCloseCatSpend=document.getElementById('btn-close-cat-spend');

if (cardCatBreakdown && modalCatSpend) {
    cardCatBreakdown.addEventListener('click', ()=> {
            renderCategorySpendDetail();
            modalCatSpend.classList.remove('hidden');
            requestAnimationFrame(()=> modalCatSpend.classList.add('active'));
            document.body.classList.add('modal-open');
        });
}

if (btnCloseCatSpend && modalCatSpend) {
    btnCloseCatSpend.addEventListener('click', ()=> {
            modalCatSpend.classList.remove('active');
            setTimeout(()=> modalCatSpend.classList.add('hidden'), 200);
            document.body.classList.remove('modal-open');
        });
}

// Close Listeners
document.querySelectorAll('.close-modal-sheet').forEach(btn=> {
        btn.addEventListener('click', ()=> {
                closeItemEditor();
                // Close detail modal too if open
                const detailModal=document.getElementById('modal-product-detail');

                if (detailModal) {
                    detailModal.classList.remove('active');
                    setTimeout(()=> detailModal.classList.add('hidden'), 200);
                }

                document.body.classList.remove('modal-open');
            });
    });

// Global Backdrop Click Listener
// This ensures that clicking the dark background (backdrop) of ANY modal closes it.
// Global Backdrop/Outside Click Listener
// This ensures that clicking the dark background (backdrop) or the empty modal container area closes the modal.
document.addEventListener('click', (e)=> {
        const isBackdrop=e.target.classList.contains('modal-backdrop');
        const isModalContainer=e.target.classList.contains('modal'); // Clicking the flex container padding area

        if (isBackdrop || isModalContainer) {
            const modal=e.target.closest('.modal');

            if (modal) {

                // Determine which modal it is to handle specific logic
                if (modal.id==='modal-categories') {
                    if (window.closeCategoryModal) window.closeCategoryModal();
                }

                else if (modal.id==='modal-item-editor') {
                    if (window.closeItemEditor) window.closeItemEditor();
                }

                else if (modal.id==='modal-product-detail') {
                    // Product detail modal specifically
                    modal.classList.remove('active');
                    setTimeout(()=> modal.classList.add('hidden'), 200);
                    document.body.classList.remove('modal-open');
                }

                else {
                    // Generic closing for all other sheet modals (General Stats, Lists Detail, Cat Spend, Settings)
                    modal.classList.remove('active');

                    setTimeout(()=> {
                            modal.classList.add('hidden');

                            // Special case: if Settings modal is closed, do we need to reset anything? No.
                        }

                        , 200);

                    // Cleanup body class if this was the last modal
                    setTimeout(()=> {
                            const anyActive=document.querySelector('.modal.active');
                            if ( !anyActive) document.body.classList.remove('modal-open');
                        }

                        , 200);
                }
            }
        }
    });

// --- UI Helper Functions ---
window.switchTab = function (tabId) {
        const tabOrder = ['home', 'ceyiz', 'damat', 'stats'];
        currentTab = tabId;

        const allSections = document.querySelectorAll('.swipe-section');
        allSections.forEach(sec => {
            if (sec.id === `${tabId}-section`) sec.classList.add('active-section');
            else sec.classList.remove('active-section');
        });

        navItems.forEach(item => {
            if (item.dataset.target === tabId) item.classList.add('active');
            else item.classList.remove('active');
        });

        const container = document.getElementById('main-swipe-container');
        if (container) {
            const index = tabOrder.indexOf(tabId);
            if (index !== -1) {
                container.style.transform = `translateX(-${index * 25}%)`;
            }
        }

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

        const shouldHideUI = (tabId === 'stats' || tabId === 'home');
        const filterBar = document.getElementById('filter-bar');
        if (filterBar) filterBar.style.display = shouldHideUI ? 'none' : 'block';
        if (fab) fab.style.display = shouldHideUI ? 'none' : 'flex';

        // Reset scroll to top
        const appContainer = document.getElementById('app-container');
        if (appContainer) {
            appContainer.scrollTo({ top: 0, behavior: 'instant' });
        }

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
    navItems.forEach(item=> {
            item.addEventListener('click', (e)=> {
                    e.preventDefault();
                    const target=item.dataset.target;
                    console.log("Nav Item Clicked:", target);
                    window.switchTab(target);
                });
        });

    // Home Action Buttons
    const homeBtns=document.querySelectorAll('.home-action-btn');

    homeBtns.forEach(btn=> {
            btn.addEventListener('click', (e)=> {
                    e.preventDefault();
                    e.stopPropagation();
                    const nav=btn.dataset.nav;
                    console.log("Home Button Clicked:", nav);
                    if (nav) window.switchTab(nav);
                });
        });




    // Initialize Daily Quote
    if (typeof setupDailyQuote==='function') {
        setupDailyQuote();
    }

    // Quick Add Modal Buttons (Refined)
    const btnSaveQA=document.getElementById('btn-save-qa');
    const btnCancelQA=document.querySelector('#modal-quick-add-category .modal-close-btn');

    // btnSaveQA listener removed to prevent double-save (handled by delegation)

    if (btnCancelQA) {
        btnCancelQA.addEventListener('click', (e)=> {
                e.preventDefault();
                closeQAModal();
            });
    }



    // --- Photo Input Listener ---
    const photoInput=document.getElementById('qa-new-photo');
    const photoPreview=document.getElementById('qa-photo-preview');
    const btnRemovePhoto=document.getElementById('btn-remove-photo');

    if (photoInput) {
        photoInput.addEventListener('change', async (e)=> {
                const file=e.target.files[0];
                if ( !file) return;

                try {
                    console.log("Compressing image...");
                    const base64=await resizeImage(file, 800, 0.7);

                    // Show preview
                    const img=photoPreview.querySelector('img');
                    if (img) img.src=base64;
                    photoPreview.classList.remove('hidden');

                    // Store in modal data for saving later
                    const modal=document.getElementById('modal-quick-add-category');
                    if (modal) modal.dataset.tempImage=base64;

                }

                catch (err) {
                    console.error("Image compression error:", err);
                    alert("Foto\u011Fraf i\u015Flenirken hata olu\u015Ftu.");
                }
            });
    }

    if (btnRemovePhoto) {
        btnRemovePhoto.addEventListener('click', ()=> {
                const modal=document.getElementById('modal-quick-add-category');
                if (modal) delete modal.dataset.tempImage;

                if (photoPreview) photoPreview.classList.add('hidden');
                if (photoInput) photoInput.value='';
            });
    }

    // --- Image Viewer Modal (Premium) ---
    window.viewImage=(src)=> {
        const overlay=document.createElement('div');
        overlay.className='image-viewer-overlay';
        overlay.innerHTML=` <div class="iv-backdrop"></div><div class="iv-content"><img src="${src}" class="iv-img" alt="Zoomed Product"><button class="iv-close"><i class="fas fa-times"></i></button></div>`;
        document.body.appendChild(overlay);

        // Lock scroll
        document.body.style.overflow='hidden';

        const close=()=> {
            overlay.classList.add('closing');

            setTimeout(()=> {
                    overlay.remove();
                    document.body.style.overflow='';
                }

                , 300);
        }

        ;

        overlay.onclick=close;
        overlay.querySelector('.iv-close').onclick=close;
        overlay.querySelector('.iv-img').onclick=(e)=>e.stopPropagation();
    }

    ;

    // --- Inline Category Creation Toggle ---
    const qaSelect=document.getElementById('qa-new-category-select');
    const qaNewCatContainer=document.getElementById('qa-new-cat-container');
    const qaNewCatInput=document.getElementById('qa-new-cat-input');

    if (qaSelect && qaNewCatContainer) {
        qaSelect.addEventListener('change', (e)=> {
                if (e.target.value==='ADD_NEW') {
                    qaNewCatContainer.classList.remove('hidden');
                    if (qaNewCatInput) qaNewCatInput.focus();
                }

                else {
                    qaNewCatContainer.classList.add('hidden');
                }
            });
    }

    // Generic close buttons are handled globally below, but specific ones help clarity
    const btnSaveItem=document.getElementById('btn-save-item');
    const btnCloseItem=document.getElementById('btn-close-item');
    const btnCancelItem=document.getElementById('btn-cancel-item');

    if (btnSaveItem) {
        btnSaveItem.addEventListener('click', ()=> {
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
    window.openSettings=function () {
        console.log("Settings Clicked (Inline)");

        try {
            resetSettingsState();
        }

        catch (err) {
            console.warn("Error resetting settings state:", err);
        }

        document.body.classList.add('modal-open');

        const modal=document.getElementById('modal-settings');

        if (modal) {
            modal.style.display='flex'; // Force display
            modal.classList.remove('hidden');

            // Small delay to ensure display:block applies before opacity transition
            setTimeout(()=> {
                    modal.classList.add('active');
                }

                , 10);
        }

        else {
            alert("Ayarlar men\u00FCs\u00FC bulunamad\u0131.");
        }
    }

    ;


    // Header
    if (btnSettings) {
        btnSettings.addEventListener('click', (e)=> {
                console.log("Settings Clicked");
                e.preventDefault();
                e.stopPropagation();

                try {

                    // Try to reset state, but don't block opening if it fails
                    if (typeof resetSettingsState==='function') {
                        resetSettingsState();
                    }
                }

                catch (err) {
                    console.warn("Error resetting settings state:", err);
                }

                document.body.classList.add('modal-open');

                // Robust modal opening
                const modal=document.getElementById('modal-settings');

                if (modal) {
                    modal.classList.remove('hidden');

                    // Small delay to ensure display:block applies before opacity transition
                    requestAnimationFrame(()=> {
                            modal.classList.add('active');
                        });
                }

                else {
                    console.error("Settings modal not found!");
                    alert("Ayarlar men\u00FCs\u00FC y\u00FCklenemedi.");
                }
            });
    }

    // FAB
    if (fab) {
        fab.addEventListener('click', ()=> {
                console.log("FAB Clicked");
                openQuickAddModal();
            });
    }

    // Features
    if (btnManageCats) {
        btnManageCats.addEventListener('click', ()=> {
                renderCategoryManager();
                document.body.classList.add('modal-open'); // Add modal-open class

                if (modalCats) {
                    modalCats.classList.remove('hidden');
                    requestAnimationFrame(()=> modalCats.classList.add('active'));
                }
            });
    }


    const btnAddCat=document.getElementById('btn-add-cat');
    if (btnAddCat) btnAddCat.addEventListener('click', ()=> window.addCategory());

    // Close category modal handlers
    const closeModalCats=modalCats?.querySelectorAll('.close-modal-sheet');

    closeModalCats?.forEach(btn=> {
            btn.addEventListener('click', ()=> {
                    modalCats.classList.remove('active');
                    setTimeout(()=> modalCats.classList.add('hidden'), 200);
                    document.body.classList.remove('modal-open');
                });
        });

    // Close on backdrop click
    modalCats?.querySelector('.modal-backdrop')?.addEventListener('click', ()=> {
            modalCats.classList.remove('active');
            setTimeout(()=> modalCats.classList.add('hidden'), 200);
            document.body.classList.remove('modal-open');
        });

    // Enter key support and button activation for adding category
    const newCatInput=document.getElementById('new-cat-input');
    const btnAddCat2=document.getElementById('btn-add-cat');

    if (newCatInput && btnAddCat2) {
        // Initially disable button if empty
        btnAddCat2.disabled= !newCatInput.value.trim();

        // Enable/disable button based on input value
        newCatInput.addEventListener('input', (e)=> {
                const hasValue=e.target.value.trim().length > 0;
                btnAddCat2.disabled= !hasValue;
            });

        // Enter key support
        newCatInput.addEventListener('keydown', (e)=> {
                if (e.key==='Enter' && e.target.value.trim()) {
                    e.preventDefault();
                    window.addCategory();
                }
            });
    }

    // Search listeners for modals
    const catSearch=document.getElementById('cat-search');
    if (catSearch) catSearch.addEventListener('input', (e)=> renderCategoryManager(e.target.value));



    // === EVENT DELEGATION FOR MODAL BUTTONS ===
    // This handles all modal button clicks via delegation to avoid pointer-events issues
    document.addEventListener('click', (e)=> {
            const target=e.target;

            // Find if click was on or inside a button
            const button=target.closest('button');
            if ( !button) return;

            const buttonId=button.id;
            console.log("🔘 Button clicked:", buttonId, button);

            // Handle close button
            if (buttonId==='btn-close-item' || buttonId==='btn-cancel-item' || button.classList.contains('modal-close')) {
                console.log("✅ Close/Cancel button detected:", buttonId);
                e.preventDefault();
                e.stopPropagation();
                closeQAModal();
                return;
            }

            // Handle save button
            if (buttonId==='btn-save-item' || buttonId==='btn-save-qa') {
                console.log("✅ Save button detected:", buttonId);
                e.preventDefault();
                e.stopPropagation();

                if (typeof saveQuickAddItem==='function') {
                    saveQuickAddItem();
                }

                else {
                    console.error("CRITICAL: saveQuickAddItem function is missing!");
                    alert("Kaydetme fonksiyonu bulunamad\u0131!");
                }

                return;
            }

            // Handle edit button (Delegation)
            if (button.classList.contains('edit')) {
                const id=button.getAttribute('data-id');

                if (id) {
                    const item=items.find(i=> i.id==id);

                    if (item) {
                        e.preventDefault();
                        e.stopPropagation();

                        console.log("✏️ Opening Item Editor for:", item.name);

                        // Use new editor
                        if (typeof window.openItemEditor==='function') {
                            window.openItemEditor(item);
                        }

                        else if (typeof window.editItemModal==='function') {
                            // Fallback to alias
                            window.editItemModal(item);
                        }

                        else {
                            console.error("Critical: openItemEditor not found");
                            alert("Hata: Editör yüklenemedi. Sayfayı yenilemeyi deneyin.");
                        }
                    }

                    else {
                        console.error('Item not found for ID:', id);
                    }
                }

                return;
            }
        }

        , true); // Use capture phase to catch events early

    console.log("✅ Event delegation for modal buttons is ACTIVE");

    // Home Action Buttons
    // Duplicate listeners removed


    // Form
    if (form) {
        form.addEventListener('submit', (e)=> {
                e.preventDefault();
                const id=document.getElementById('edit-id').value;
                const name=document.getElementById('item-name').value;
                const category=document.getElementById('item-category').value;
                const quantity=parseInt(document.getElementById('item-quantity').value);
                const price=parseFloat(document.getElementById('item-price').value) || 0;
                const isBought=document.getElementById('item-bought').checked;
                const note=document.getElementById('item-note').value;

                let type=currentTab==='stats' ? 'ceyiz' : currentTab;

                if (id) {
                    const existing=items.find(i=> i.id==id);
                    if (existing) type=existing.type;
                }

                lastSelectedCategory=category;

                const newData= {
                    name, category, quantity, price, isBought, note, type
                }

                ;

                if (id) {
                    const idx=items.findIndex(i=> i.id==id);

                    if (idx > -1) items[idx]= {
                        ...items[idx], ...newData
                    }

                    ;
                }

                else {
                    items.push({
                        id: Date.now(), ...newData
                    });
            }

            saveData();
            renderApp();

            if (modalForm) {
                modalForm.classList.remove('active');
                setTimeout(()=> modalForm.classList.add('hidden'), 200);
            }

            form.reset();
        });
}

// Modals Close (Generic for all modals including new sheets)
// Close on X button
document.querySelectorAll('.close-modal, .close-modal-sheet, .close-modal-settings, .modal-close').forEach(btn=> {
        btn.addEventListener('click', (e)=> {
                const modal=e.target.closest('.modal');

                if (modal) {
                    modal.classList.remove('active');
                    setTimeout(()=> modal.classList.add('hidden'), 200);
                    document.body.classList.remove('modal-open');
                }
            });
    });

// Close on Backdrop Click
document.querySelectorAll('.modal').forEach(modal=> {
        modal.addEventListener('click', (e)=> {
                if (e.target===modal || e.target.classList.contains('modal-backdrop')) {
                    modal.classList.remove('active');
                    setTimeout(()=> modal.classList.add('hidden'), 200);
                }
            });
    });

// Close on ESC
document.addEventListener('keydown', (e)=> {
        if (e.key==='Escape') {
            document.querySelectorAll('.modal.active').forEach(modal=> {
                    modal.classList.remove('active');
                    setTimeout(()=> modal.classList.add('hidden'), 200);
                });
        }
    });


// Welcome
if (typeof btnWelcomeClose !=='undefined' && btnWelcomeClose) btnWelcomeClose.addEventListener('click', closeWelcome);

// --- Settings Listeners ---
// Dark Mode
if (darkModeToggle) {
    darkModeToggle.addEventListener('change', (e)=> {
            settings.darkMode=e.target.checked;
            saveSettings();
        });
}


// Font size settings removed

// Animations Flow
const animToggle=document.getElementById('animations-toggle');

if (animToggle) {
    animToggle.addEventListener('change', (e)=> {
            settings.appearance.animations=e.target.checked;
            saveSettings();
        });
}

// (sSaveFeedback handler removed as ID is gone)

// Special Message Toggle  
const romanticMessages=[ "Gecenin bu vaktinde bile seni düşünmek kalbimi ısıtıyor, her hayalim seninle süslü. ✨",
// 00
"Rüyalarımda bile seninle kuracağımız yuvayı görüyorum, seni seviyorum. 🌙",
// 01
"Evi senin sesinle, senin gülüşünle dolduracağımız günü sabırsızlıkla bekliyorum. 🏠",
// 02
"Uykumda bile kalbim senin ismini fısıldıyor ŞŞevval'im. 💖",
// 03
"Yeni bir günün şafağında, seninle uyanacağımız sabahların hayaliyle doluyum. 🌅",
// 04
"Her sabah senin sevginle uyanmak, ömrümün en büyük ödülü olacak. 🌸",
// 05
"Güneş doğarken aklıma ilk gelen sensin, her saniyem seninle güzel. ☀️",
// 06
"Seninle içeceğimiz ilk sabah kahvaltısının kokusu şimdiden burnumda tütecek. ☕",
// 07
"Listemize eklediğimiz her tabak, her bardak aslında seninle paylaşacağımız bir ömür. ✨",
// 08
"Çeyiz telaşımızın her anı, seninle olan yolculuğumuzun en tatlı hatırası. 🎀",
// 09
"Mutluluğa giden bu yolda, her adımda elini tutmak bana güç veriyor. 🤝",
// 10
"Seninle kuracağımız yuva, dünyanın en huzurlu limanı olacak. ⚓",
// 11
"Günün tam ortasında, seni ne kadar çok sevdiğimi hatırlatmak istedim. ❤️",
// 12
"Kalbimdeki yerin, bu uygulamadaki tüm listelerden çok daha derin ve sonsuz. ♾️",
// 13
"Birlikte seçeceğimiz her detay, evimizin ruhuna senden bir parça katacak. 🎨",
// 14
"Gelecekteki her anımızda seninle yan yana, can cana olmayı diliyorum. 💞",
// 15
"Zaman akıp gidiyor ama sana olan aşkım her saat daha da büyüyor. ⏳",
// 16
"Evimizin her köşesinde senin zarafetin ve imzan olacak ŞŞevval'im. 🌺",
// 17
"Günün yorgunluğunu seninle eve döndüğümüzde unutacağımız günlere az kaldı. ☕",
// 18
"Paylaşacağımız her akşam yemeği, senin sevginle daha da lezzetlenecek. 🍽️",
// 19
"Yıldızlar çıkarken seni düşünmek, karanlık gecelerimi aydınlatıyor. 🌠",
// 20
"Her adımda, her eşyada bizim hikayemiz, bizim aşkımız gizli. 📖",
// 21
"Günün sonunda, huzur bulduğum tek yer senin sevgin. 🕊️",
// 22
"Yatmadan önce son duam; seninle, sevgi dolu, mutlu bir ömür sürdürmek. 🙏" // 23
];

// --- Special Message Functions ---
window.refreshSpecialMessage=function () {
    const textEl=document.getElementById('special-message-text');

    if (textEl && romanticMessages) {
        const hour=new Date().getHours();
        textEl.textContent=romanticMessages[hour] || romanticMessages[12];
    }
}

;

window.toggleSpecialMessage=function () {
    console.log("💌 toggleSpecialMessage CALLED");
    if (typeof window.refreshSpecialMessage==='function') window.refreshSpecialMessage();

    const messageContent=document.getElementById('special-message-content');
    const messageChevron=document.getElementById('message-chevron');
    const messageCard=document.querySelector('.special-message-card');

    if ( !messageContent) return;

    const isExpanded=messageContent.classList.contains('expanded');

    if (isExpanded) {
        messageContent.classList.remove('expanded');
        if (messageChevron) messageChevron.classList.remove('rotated');
        if (messageCard) messageCard.classList.remove('active');
    }

    else {
        messageContent.classList.add('expanded');
        if (messageChevron) messageChevron.classList.add('rotated');
        if (messageCard) messageCard.classList.add('active');
    }
}

;

window.closeCategoryModal=function () {
    const modal=document.getElementById('modal-categories');

    if (modal) {
        modal.classList.remove('active');

        setTimeout(()=> {
                modal.classList.add('hidden');

                if (returnToSettingsOnClose) {
                    returnToSettingsOnClose=false; // Reset

                    if (window.openSettingsModal) {
                        window.openSettingsModal();
                    }

                    else {
                        // Fallback if function not found, though it should be there
                        const sModal=document.getElementById('modal-settings');

                        if (sModal) {
                            sModal.classList.remove('hidden');
                            requestAnimationFrame(()=> sModal.classList.add('active'));
                            document.body.classList.add('modal-open');
                        }
                    }
                }

                else {
                    document.body.classList.remove('modal-open');
                }
            }

            , 200);
    }
}

;


// Data Management
// --- NEW ALL-IN-ONE SETTINGS SAVE ---
const btnSaveAllSettings=document.getElementById('btn-save-all-settings');

if (btnSaveAllSettings) {
    btnSaveAllSettings.addEventListener('click', ()=> {
            const nameInput=document.getElementById('setting-user-name');
            const partnerInput=document.getElementById('setting-partner-name');
            const animToggle=document.getElementById('animations-toggle');
            const modal=document.getElementById('modal-settings');

            if (nameInput) settings.name=nameInput.value.trim() || 'Şevval';
            if (partnerInput) settings.partnerName=partnerInput.value.trim() || 'Yusuf';
            if (animToggle) settings.appearance.animations=animToggle.checked;

            saveSettings();
            applySettings();

            // Close Modal
            if (modal) {
                modal.classList.remove('active');
                setTimeout(()=> modal.classList.add('hidden'), 200);
                document.body.classList.remove('modal-open');
            }

            showToast('Ayarlar başarıyla kaydedildi! ✅', false);
        });
}

// --- Data Management ---
// --- Data Management (File Based) ---
const btnBackup=document.getElementById('btn-backup-copy');

if (btnBackup) {
    console.log("Backup button found, adding listener");

    btnBackup.addEventListener('click', async (e)=> {
            e.preventDefault();
            console.log("Backup button clicked");

            try {
                console.log("Preparing data...", {
                    itemsCount: items?.length, settings: ! !settings
                });

            const data= {

                items: items || [],
                settings: settings || {}

                ,
                userCategories: userCategories || {}

                ,
                timestamp: new Date().toISOString()
            }

            ;

            const dataStr=JSON.stringify(data, null, 2);
            const date=new Date().toISOString().split('T')[0];

            const fileName=`ceyiz_yedek_

            .json`;

            // Strategy: Try Web Share API with .txt extension (Best for iOS)
            // iOS Share Sheet handles .txt much better than .json, avoiding "2 Items" or "Content Unavailable" errors.
            if (navigator.share && navigator.canShare) {
                try {
                    const txtFileName=`ceyiz_yedek_

                    .txt`;

                    const file=new File([dataStr], txtFileName, {
                        type: 'text/plain'
                    });

                if (navigator.canShare({
                        files: [file]

                    })) {
                await navigator.share({
                    files: [file],
                    title: 'Yedek Dosyası'
                });
            showToast('Paylaşım ekranı açıldı! "Dosyalara Kaydet"i seçin. 📱', false);
            return;
        }
    }

    catch (shareErr) {
        console.warn("Share API failed, falling back to standard download:", shareErr);
    }
}

// Fallback: Standard Download (Desktop / Android)
console.log("Using standard download method...");

const blob=new Blob([dataStr], {
    type: 'application/json'
});
const url=URL.createObjectURL(blob);

const a=document.createElement('a');
a.href=url;
a.download=fileName;

document.body.appendChild(a);
a.click();
document.body.removeChild(a);

URL.revokeObjectURL(url);

// Specific helper for iOS where download attribute might be ignored and opens preview
if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
    showToast('Dosya açıldıysa alttaki "Paylaş" butonuna basıp kaydedin. ℹ️', false);
}

else {
    showToast('Yedek dosyası indiriliyor... 📥', false);
}
}

catch (err) {
    console.error("Backup failed:", err);
    showToast('Yedek oluşturulurken hata: ' + err.message, true);
}
});

}

else {
    console.error("Backup button NOT found!");
}

// Limit Import to File Only
document.getElementById('btn-import-paste')?.addEventListener('click', ()=> {
        const fileInput=document.getElementById('backup-file-input');
        if (fileInput) fileInput.click();
    });

// File Input Handler
document.getElementById('backup-file-input')?.addEventListener('change', (e)=> {
        const file=e.target.files[0];
        if ( !file) return;

        const reader=new FileReader();

        reader.onload=(event)=> {
            try {
                const val=event.target.result;
                const data=JSON.parse(val);

                if (confirm('Bu yedek dosyası yüklendiğinde mevcut tüm verileriniz silinecek ve dosyadaki verilerle değiştirilecek. İşlemi onaylıyor musunuz?')) {

                    if (data.items) items=data.items;
                    if (data.settings) Object.assign(settings, data.settings);
                    if (data.userCategories) userCategories=data.userCategories;

                    saveData();
                    saveSettings();
                    saveUserCategories();

                    showToast('Veriler başarıyla yüklendi! 🔄', false);
                    setTimeout(()=> location.reload(), 1500);
                }
            }

            catch (err) {
                showToast('Dosya okunamadı veya format hatalı! ❌', true);
                console.error("Import Error:", err);
            }
        }

        ;
        reader.readAsText(file);
        e.target.value=''; // Reset
    });

// --- RESET DATA ---
document.getElementById('btn-reset-app-data')?.addEventListener('click', ()=> {
        if (confirm('DİKKAT! Tüm verileriniz (listeler, bütçe, hedefler) kalıcı olarak silinecek. Devam etmek istiyor musunuz?')) {
            localStorage.clear();
            showToast('Tüm veriler sıfırlandı. Sayfa yenileniyor...', false);
            setTimeout(()=> location.reload(), 1500);
        }
    });


// Undo
if (btnUndo) {
    btnUndo.addEventListener('click', ()=> {
            if (pendingDeleteItem) {
                items.push(pendingDeleteItem);
                saveData();
                renderApp();
                pendingDeleteItem=null;
                if (toastContainer) toastContainer.classList.add('hidden');
                clearTimeout(undoTimeout);
            }
        });
}

// Redundant Navigation Block Removed

// Filters
if (searchInput) searchInput.addEventListener('input', ()=> renderList(currentTab));
if (categoryFilter) categoryFilter.addEventListener('change', ()=> renderList(currentTab));
if (statusFilter) statusFilter.addEventListener('change', ()=> renderList(currentTab));

// Export/Import (Legacy Check - only add if elements exist)
if (btnExport) {
    btnExport.addEventListener('click', ()=> {
            const dataStr="data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items));
            const dl=document.createElement('a');
            dl.setAttribute("href", dataStr);
            dl.setAttribute("download", "sŞevval_ceyiz_yedek.json");
            document.body.appendChild(dl); dl.click(); dl.remove();
        });
}

if (btnImport && fileImport) {
    btnImport.addEventListener('click', ()=> fileImport.click());

    fileImport.addEventListener('change', (e)=> {
            const file=e.target.files[0];
            if ( !file) return;
            const r=new FileReader();

            r.onload=(ev)=> {
                try {
                    const data=JSON.parse(ev.target.result);

                    if (Array.isArray(data) && confirm('Liste geri y\u00FCklensin mi?')) {
                        items=data; saveData(); renderApp();
                    }
                }

                catch (err) {
                    alert('Hata: ' + err);
                }
            }

            ;
            r.readAsText(file);
        });
}

// --- Header Countdown Logic ---
let headerTimerInterval=null;

function startHeaderCountdowns() {
    const container=document.getElementById('header-countdowns');
    if ( !container) return;

    function update() {
        // Get Dates
        const nisanStr=settings.dates?.engagement;
        const nikahStr=settings.dates?.wedding;
        const now=new Date().getTime();

        // 1. HEADER (Compact) - REMOVED per user request
        // const container = document.getElementById('header-countdowns');
        // if (container) { ... }

        // 2. STATS SECTION (Detailed) - REMOVED per user request

        const formatStats=(targetStr)=> {
            if ( !targetStr) return 'Tarih se\u00E7ilmedi';
            const target=new Date(targetStr + 'T00:00:00').getTime();
            const diff=target - now;

            if (diff < 0) return "Gerçekleşti ✅";

            const days=Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours=Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes=Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            // User requested days, hours, minutes. Seconds optional? User didn't ask for seconds in the specific format, but "XX g\u00FCn XX saat XX dakika" implies no seconds.
            // Let's stick to D/H/M.

            return `

            g\u00FCn 

            saat 

            dakika`;
        }

        ;

        // 
        // if (elStatsNisan) elStatsNisan.textContent = formatStats(nisanStr);
        // if (elStatsNikah) elStatsNikah.textContent = formatStats(nikahStr);
    }

    // Run immediately then interval
    update();
    if (headerTimerInterval) clearInterval(headerTimerInterval);
    headerTimerInterval=setInterval(update, 1000);
}

// Call on start
startHeaderCountdowns();

// Hook into saveSettings (Patch existing function or append logic?)
// Since I can't easily patch the insides of saveSettings with this tool without replacing it,
// I will redefine saveSettings or add a listener if possible. 
// Actually, I can just override the global references if any, but `saveSettings` is local.
// I will use a reliable replace on `updateCountdowns` to also call `startHeaderCountdowns`.

// Override existing updateCountdowns to also start header timer
const originalUpdateCountdowns=updateCountdowns;

updateCountdowns=function () {
    if (typeof originalUpdateCountdowns==='function') originalUpdateCountdowns();
    startHeaderCountdowns();
}

;

// --- ADDED: Long Press on Countdown (Settings) ---
function setupLongPressForCountdown() {
    const countdownCard=document.querySelector('.unified-countdown-card:not(.calendar-mode):not(.upcoming-mode)');
    if ( !countdownCard) return;

    // Visual feedback via CSS (optional but nice)
    countdownCard.style.cursor='pointer';

    let pressTimer;
    const LONG_PRESS_DURATION=800; // ms

    function startPress(e) {
        // Ignore right click
        if (e.type==='mousedown' && e.button !==0) return;

        // Visual feedback: slightly scale down
        countdownCard.style.transform='scale(0.98)';
        countdownCard.style.transition='transform 0.2s';

        pressTimer=setTimeout(()=> {

                // Open Settings Modal
                if (modalSettings) {
                    resetSettingsState(); // Ensure cleaner state
                    document.body.classList.add('modal-open');
                    modalSettings.classList.remove('hidden');
                    requestAnimationFrame(()=> modalSettings.classList.add('active'));
                    showToast("Ayarlar açıldı ⚙️", false);

                    // Reset visual
                    countdownCard.style.transform='scale(1)';
                }
            }

            , LONG_PRESS_DURATION);
    }

    function cancelPress() {
        clearTimeout(pressTimer);
        // Reset visual
        countdownCard.style.transform='scale(1)';
    }

    // Mouse Events
    countdownCard.addEventListener('mousedown', startPress);
    countdownCard.addEventListener('mouseup', cancelPress);
    countdownCard.addEventListener('mouseleave', cancelPress);

    // Touch Events
    countdownCard.addEventListener('touchstart', (e)=> {
            startPress(e);
        }

        , {
        passive: true
    });

countdownCard.addEventListener('touchend', cancelPress);
countdownCard.addEventListener('touchcancel', cancelPress);

// Prevent context menu on long press (mobile)
countdownCard.addEventListener('contextmenu', (e)=> {
        e.preventDefault();
    });
}

setupLongPressForCountdown();

// --- Swipe Navigation (Instagram-style) ---
// --- Swipe Navigation (Instagram-style) ---
// --- Swipe Navigation (Instagram-style) ---
function setupSwipeNavigation() {
    const container=document.getElementById('swipe-container');
    if ( !container) return;

    let startX=0;
    let startY=0;
    let isDragging=false;
    let isVerticalScroll=false;

    container.addEventListener('touchstart', (e)=> {
            // Ignore if touching a carousel (which has its own logic)
            if (e.target.closest('.countdown-carousel-wrapper')) return;

            startX=e.touches[0].clientX;
            startY=e.touches[0].clientY;
            isDragging=true;
            isVerticalScroll=false; // Reset assumption
        }

        , {
        passive: true
    });

container.addEventListener('touchmove', (e)=> {
        if ( !isDragging || isVerticalScroll) return;

        const currentX=e.touches[0].clientX;
        const currentY=e.touches[0].clientY;
        const diffX=startX - currentX;
        const diffY=startY - currentY;

        // 1. Detect Axis
        if (Math.abs(diffY) > Math.abs(diffX)) {
            isVerticalScroll=true; // User is scrolling list
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
    }

    , {
    passive: false
});

container.addEventListener('touchend', (e)=> {
        if ( !isDragging || isVerticalScroll) {
            isDragging=false;
            return;
        }

        const endX=e.changedTouches[0].clientX;
        const diffX=startX - endX;
        const threshold=80; // Min px to trigger swipe

        if (Math.abs(diffX) > threshold) {
            // Current Tab Index?
            // We need to know current active tab order:
            // 0: Stats, 1: Home, 2: Ceyiz, 3: Damat
            const order=['stats', 'home', 'ceyiz', 'damat'];
            const currentTab=window.appData.currentTab || 'home';
            let idx=order.indexOf(currentTab);
            if (idx===-1) idx=1; // Default to home

            if (diffX > 0) {

                // Swipe LEFT -> Next Tab
                if (idx < order.length - 1) {
                    switchTab(order[idx + 1]);
                }
            }

            else {

                // Swipe RIGHT -> Prev Tab
                if (idx > 0) {
                    switchTab(order[idx - 1]);
                }
            }
        }

        isDragging=false;
    });
}

// setupSwipeNavigation(); // Temporarily Disabled to fix scroll issues


// --- CAROUSEL & CALENDAR LOGIC (Phase 6) ---
function setupCarouselAndCalendar() {
    const track=document.getElementById('home-carousel-track');
    const wrapper=document.querySelector('.countdown-carousel-wrapper');
    const dots=document.querySelectorAll('.c-dot');
    const prevBtn=document.getElementById('cal-prev-month');
    const nextBtn=document.getElementById('cal-next-month');
    const monthLabel=document.getElementById('cal-month-year');
    const grid=document.getElementById('calendar-grid');

    if ( !track || !wrapper) return;

    let currentSlide=0;
    let startX=0;
    let isDragging=false;

    // Carousel Navigation
    function updateCarousel() {
        track.style.transform=`translateX(-

            %)`;

        dots.forEach((dot, idx)=> {
                if (idx===currentSlide) dot.classList.add('active');
                else dot.classList.remove('active');
            });
    }

    // Swipe Logic
    wrapper.addEventListener('touchstart', (e)=> {
            startX=e.touches[0].clientX;
            isDragging=true;
        }

        , {
        passive: true
    });

wrapper.addEventListener('touchmove', (e)=> {
        if ( !isDragging) return;
        // Optional: add resistance logic here if needed
    }

    , {
    passive: true
});

wrapper.addEventListener('touchend', (e)=> {
        if ( !isDragging) return;
        const endX=e.changedTouches[0].clientX;
        const diff=startX - endX;

        // Threshold for swipe
        if (Math.abs(diff) > 50) {
            const totalSlides=dots.length || 2;

            if (diff > 0) {

                // Swipe Left
                if (currentSlide < totalSlides - 1) {
                    currentSlide++;
                    updateCarousel();
                    e.stopPropagation(); // Don't let global handler switch tabs too!
                }

                else {
                    // Boundary! Let global handler handle it
                    isDragging=false;
                }
            }

            else {

                // Swipe Right
                if (currentSlide > 0) {
                    currentSlide--;
                    updateCarousel();
                    e.stopPropagation(); // Don't let global handler switch tabs too!
                }

                else {
                    // Boundary! Let global handler handle it
                    isDragging=false;
                }
            }
        }

        isDragging=false;
    });

// Dot Click
dots.forEach(dot=> {
        dot.addEventListener('click', ()=> {
                const slide=parseInt(dot.dataset.slide);
                currentSlide=slide;
                updateCarousel();
            });
    });


// --- Calendar Logic ---
let calDate=new Date(); // Current viewing month

function renderCalendar() {
    if ( !grid || !monthLabel) return;

    // Mini Cal Interaction: Click Header/Bg -> Open Full Modal
    monthLabel.style.cursor='pointer';

    monthLabel.onclick=()=> {
        if (typeof openFullModal==='function') openFullModal();
    }

    ;

    grid.style.cursor='pointer';

    grid.onclick=(e)=> {
        // Only invoke if clicking the grid background (gaps), as days handle their own click
        if (e.target===grid && typeof openFullModal==='function') openFullModal();
    }

    ;

    grid.innerHTML='';

    const year=calDate.getFullYear();
    const month=calDate.getMonth();

    // Format Month
    const monthNames=["Ocak",
    "\u015Eubat",
    "Mart",
    "Nisan",
    "May\u0131s",
    "Haziran",
    "Temmuz",
    "A\u011Fustos",
    "Eyl\u00FCl",
    "Ekim",
    "Kas\u0131m",
    "Aral\u0131k"];

    monthLabel.textContent=`

    

    `;

    // Calculate Days
    const firstDay=new Date(year, month, 1).getDay(); // 0 = Sun
    // Adjust for Monday start (Turkey default)
    // 0 (Sun) -> 6, 1 (Mon) -> 0
    const startOffset=(firstDay===0) ? 6 : firstDay - 1;

    const daysInMonth=new Date(year, month + 1, 0).getDate();

    // Get special dates
    const today=new Date();
    const nisanDate=settings.dates?.engagement ? new Date(settings.dates.engagement) : null;
    const nikahDate=settings.dates?.wedding ? new Date(settings.dates.wedding) : null;

    // Empty Slots
    for (let i=0; i < startOffset; i++) {
        const el=document.createElement('div');
        el.className='cal-day empty';
        grid.appendChild(el);
    }

    // Days
    for (let d=1; d <=daysInMonth; d++) {
        const el=document.createElement('div');
        el.className='cal-day clickable-day';

        const numSpan=document.createElement('span');
        numSpan.textContent=d;
        el.appendChild(numSpan);

        const dayDate=new Date(year, month, d);

        const dateKey=`

        -

        -

        `;

        // setupDayLongPress(el, dateKey);
        // Mini Calendar Mode: Click opens Full Calendar
        el.onclick=()=> {
            // Optional: Set full calendar to this date?
            // fullCalDate = new Date(year, month, d); 
            if (typeof openFullModal==='function') openFullModal();
        }

        ;

        // Check Today
        if (dayDate.toDateString()===today.toDateString()) {
            el.classList.add('today');
        }

        // Check Special Dates
        let hasEvent=false;
        let eventColor='';

        // 1. System Events
        if (nisanDate && dayDate.toDateString()===nisanDate.toDateString()) {
            hasEvent=true;
            eventColor='var(--primary-color)';
        }

        if (nikahDate && dayDate.toDateString()===nikahDate.toDateString()) {
            hasEvent=true;
            eventColor='var(--primary-color)';
        }

        // 2. Custom Notes (Blue/Purple)
        // Ensure customEvents exists
        if ( !settings.customEvents) settings.customEvents= {}

        ;

        if (settings.customEvents[dateKey]) {
            hasEvent=true;
            // Use a distinct color for custom notes (purple-ish)
            // If it overlaps with system event, system event color (primary) might be preferred? 
            // Or maybe show multiple dots? 
            // For now, let's allow overwrite or if already set keep primary.
            if ( !eventColor) eventColor='#a29bfe';
        }

        if (hasEvent) {
            const dot=document.createElement('div');
            dot.className='event-dot';
            dot.style.backgroundColor=eventColor;
            el.appendChild(dot);
        }

        grid.appendChild(el);
    }
}

// --- DAY INTERACTION (Long Press) ---
function setupDayLongPress(el, dateKey) {
    let pressTimer;
    const PRESS_DURATION=600;

    const start=(e)=> {
        // Start timer
        el.style.transform='scale(0.9)';
        el.style.transition='transform 0.2s';

        pressTimer=setTimeout(()=> {
                openDayModal(dateKey);
                // Reset
                el.style.transform='scale(1)';
            }

            , PRESS_DURATION);
    }

    ;

    const cancel=(e)=> {
        clearTimeout(pressTimer);
        el.style.transform='scale(1)';
    }

    ;

    el.addEventListener('mousedown', start);
    el.addEventListener('mouseup', cancel);
    el.addEventListener('mouseleave', cancel);

    el.addEventListener('touchstart', start, {
        passive: true
    });
el.addEventListener('touchend', cancel);
}

// Open Modal
function openDayModal(dateKey) {
    // dateKey: YYYY-MM-DD
    let existingNote='';

    if (settings.customEvents && settings.customEvents[dateKey]) {
        const data=settings.customEvents[dateKey];
        existingNote=(typeof data==='object') ? data.note: data;
    }

    let modal=document.getElementById('modal-day-detail');

    if ( !modal) {
        modal=document.createElement('div');
        modal.id='modal-day-detail';
        modal.className='modal hidden';
        modal.innerHTML=` <div class="modal-backdrop"></div><div class="modal-content-sheet center-sheet" style="padding: 20px; border-radius: 20px; max-width: 400px; width: 90%;"><h3 id="day-modal-title" style="margin-bottom: 15px; color: var(--primary-color);">Günün Notu</h3><textarea id="day-modal-note" rows="4" class="modern-input" placeholder="Not ekle..."></textarea><div style="display:flex; justify-content:flex-end; gap:10px; margin-top:15px;"><button id="day-modal-delete" class="btn-ghost" style="color:salmon;">Sil</button><button id="day-modal-close" class="btn-ghost">Vazgeç</button><button id="day-modal-save" class="btn-primary">Kaydet</button></div></div>`;
        document.body.appendChild(modal);

        // Bind close
        const closeBtn=modal.querySelector('#day-modal-close');

        closeBtn.onclick=()=> {
            modal.classList.remove('active');
            setTimeout(()=> modal.classList.add('hidden'), 300);
            document.body.classList.remove('modal-open');
        }

        ;

        const backdrop=modal.querySelector('.modal-backdrop');
        backdrop.onclick=closeBtn.onclick;
    }

    const title=modal.querySelector('#day-modal-title');
    const noteInput=modal.querySelector('#day-modal-note');
    const saveBtn=modal.querySelector('#day-modal-save');
    const delBtn=modal.querySelector('#day-modal-delete');

    title.textContent=`

    Notu`;
    noteInput.value=existingNote;

    modal.classList.remove('hidden');
    requestAnimationFrame(()=> modal.classList.add('active'));
    document.body.classList.add('modal-open');

    saveBtn.onclick=()=> {
        const val=noteInput.value.trim();

        if (val) {
            if ( !settings.customEvents) settings.customEvents= {}

            ;

            settings.customEvents[dateKey]= {
                note: val
            }

            ;
            showToast("Not kaydedildi");
        }

        else {

            // If empty, delete
            if (settings.customEvents && settings.customEvents[dateKey]) {
                delete settings.customEvents[dateKey];
                showToast("Not silindi");
            }
        }

        saveSettings();
        renderCalendar(); // Refresh dots
        if (typeof renderFullCalendar==='function') renderFullCalendar();
        if (typeof renderHomeUpcomingEvents==='function') renderHomeUpcomingEvents();
        // Close
        modal.querySelector('#day-modal-close').click();
    }

    ;

    delBtn.onclick=()=> {
        if (settings.customEvents && settings.customEvents[dateKey]) {
            delete settings.customEvents[dateKey];
            saveSettings();
            renderCalendar();
            if (typeof renderFullCalendar==='function') renderFullCalendar();
            if (typeof renderHomeUpcomingEvents==='function') renderHomeUpcomingEvents();
            showToast("Not silindi");
        }

        const closeBtn=modal.querySelector('#day-modal-close');
        if (closeBtn) closeBtn.click();
    }

    ;
}

// --- NAVIGATION LISTENERS ---
if (prevBtn) prevBtn.addEventListener('click', ()=> {
        calDate.setMonth(calDate.getMonth() - 1);
        renderCalendar();
    });

if (nextBtn) nextBtn.addEventListener('click', ()=> {
        calDate.setMonth(calDate.getMonth() + 1);
        renderCalendar();
    });

// --- FULL CALENDAR MODAL LOGIC (New) ---
const fullModal=document.getElementById('modal-full-calendar');
const fullGrid=document.getElementById('full-calendar-grid');
const fullMonthLabel=document.getElementById('full-cal-month-year');
const fullPrev=document.getElementById('full-cal-prev');
const fullNext=document.getElementById('full-cal-next');
const fullEventList=document.getElementById('full-cal-event-list');
const btnCloseFull=document.getElementById('close-full-cal');

// Re-use logic but separate date state so full cal can browse independently
let fullCalDate=new Date();

function renderFullCalendar() {
    if ( !fullGrid || !fullMonthLabel) return;
    fullGrid.innerHTML='';

    const year=fullCalDate.getFullYear();
    const month=fullCalDate.getMonth();
    const monthNames=["Ocak",
    "\u015Eubat",
    "Mart",
    "Nisan",
    "May\u0131s",
    "Haziran",
    "Temmuz",
    "A\u011Fustos",
    "Eyl\u00FCl",
    "Ekim",
    "Kas\u0131m",
    "Aral\u0131k"];

    fullMonthLabel.textContent=`

    

    `;

    const firstDay=new Date(year, month, 1).getDay();
    const startOffset=(firstDay===0) ? 6 : firstDay - 1;
    const daysInMonth=new Date(year, month + 1, 0).getDate();
    const today=new Date();

    // Special Days List (Static for 2026/Recurring)
    // Special Days List (Static for 2026/Recurring)
    const specialDays=[ {
        d: 1, m: 0, msg: "Yılbaşı 🎄"
    }

    ,
    // Jan 1

        {
        d: 31, m: 0, msg: "Yusuf'un Doğum Günü 🎂", color: '#3498db'
    }

    ,
    // Jan 31

        {
        d: 14, m: 1, msg: "Sevgililer Günü 🤍", color: 'var(--text-light)'
    }

    ,
    // Feb 14

        {
        d: 23, m: 3, msg: "23 Nisan 🇹🇷"
    }

    ,
    // Apr 23

        {
        d: 1, m: 4, msg: "Emek ve Dayanışma Günü"
    }

    ,
    // May 1

        {
        d: 19, m: 4, msg: "19 Mayıs 🇹🇷"
    }

    ,
    // May 19

        {
        d: 22, m: 5, msg: "Tanışma Günümüz ✨", color: '#e17055'
    }

    ,
    // Jun 22

        {
        d: 15, m: 6, msg: "15 Temmuz 🇹🇷"
    }

    ,
    // Jul 15

        {
        d: 3, m: 6, msg: "Sevgili Olduğumuz Gün ❤️", color: '#ff7675'
    }

    ,
    // Jul 3

        {
        d: 30, m: 7, msg: "30 Ağustos 🇹🇷"
    }

    ,
    // Aug 30

        {
        d: 29, m: 9, msg: "29 Ekim 🇹🇷"
    }

    ,
    // Oct 29

        {
        d: 5, m: 11, msg: "Şevval'in Doğum Günü 🎂", color: '#fd79a8'
    }

    // Dec 5
    ];

    // Empty Slots
    for (let i=0; i < startOffset; i++) {
        const el=document.createElement('div');
        el.className='cal-day empty';
        fullGrid.appendChild(el);
    }

    // Days
    for (let d=1; d <=daysInMonth; d++) {
        const el=document.createElement('div');
        el.className='cal-day clickable-day';

        const numSpan=document.createElement('span');
        numSpan.textContent=d;
        el.appendChild(numSpan);

        const dayDate=new Date(year, month, d);

        const dateKey=`

        -

        -

        `;
        el.dataset.date=dateKey;

        // Bind Click (was Long Press)
        el.onclick=()=> {
            openDayModal(dateKey);
        }

        ;

        if (dayDate.toDateString()===today.toDateString()) el.classList.add('today');

        // Check Events
        let hasEvent=false;
        let eventColor='';

        // 1. Defined Special Days
        const special=specialDays.find(s=> s.d===d && s.m===month);

        if (special) {
            hasEvent=true;
            eventColor=special.color || 'var(--primary-color)';
        }

        // 2. System Dates
        const nisanDate=settings.dates?.engagement ? new Date(settings.dates.engagement) : null;
        const nikahDate=settings.dates?.wedding ? new Date(settings.dates.wedding) : null;

        if (nisanDate && dayDate.toDateString()===nisanDate.toDateString()) {
            hasEvent=true;
            eventColor='var(--primary-color)';
        }

        if (nikahDate && dayDate.toDateString()===nikahDate.toDateString()) {
            hasEvent=true;
            eventColor='var(--primary-color)';
        }

        // 3. Custom Notes
        if ( !settings.customEvents) settings.customEvents= {}

        ;

        if (settings.customEvents[dateKey]) {
            hasEvent=true;
            // Distinction: If multiple events, ideally show multiple dots or split.
            // For simplicity, custom note overrides color or we check priority.
            // User wants special days marked.
            // If it's Valentine's AND I have a note, maybe Valentine color wins? or Note color?
            // Let's stick to Note Color (Purple) if Note exists, else Special Day Color.
            if (settings.customEvents[dateKey]) eventColor='#a29bfe';
        }

        if (hasEvent) {
            const dot=document.createElement('div');
            dot.className='event-dot';
            dot.style.backgroundColor=eventColor;
            el.appendChild(dot);
        }

        fullGrid.appendChild(el);
    }

    renderUpcomingEventsList(specialDays);
}

function renderUpcomingEventsList(specialDays) {
    if ( !fullEventList) return;
    fullEventList.innerHTML='';

    const year=fullCalDate.getFullYear();
    const month=fullCalDate.getMonth();

    let events=[];

    // 1. Static Special Days
    specialDays.forEach(s=> {
            if (s.m===month) {
                events.push({
                    d: s.d, msg: s.msg, color: s.color || 'var(--primary-color)'
                });
        }
    });

// 2. System
const nisanDate=settings.dates?.engagement ? new Date(settings.dates.engagement) : null;
const nikahDate=settings.dates?.wedding ? new Date(settings.dates.wedding) : null;

if (nisanDate && nisanDate.getFullYear()===year && nisanDate.getMonth()===month) {
    events.push({
        d: nisanDate.getDate(), msg: "Nişan 💍", color: "var(--primary-color)"
    });
}

if (nikahDate && nikahDate.getFullYear()===year && nikahDate.getMonth()===month) {
    events.push({
        d: nikahDate.getDate(), msg: "Nikah 💍", color: "var(--primary-color)"
    });
}

// 3. Custom
if (settings.customEvents) {
    for (const [key, val] of Object.entries(settings.customEvents)) {
        const [y,
        m,
        d]=key.split('-').map(Number);

        if (y===year && m===(month + 1)) {
            const noteText=(typeof val==='object') ? (val.note || ''): val;

            if (noteText) {
                events.push({
                    d: d,
                    msg: noteText,
                    color: "#a29bfe",
                    dateKey: key,
                    isCustom: true
                });
        }
    }
}
}

events.sort((a, b)=> a.d - b.d);

// Deduplicate? (e.g. Valentine's Note + Holiday) - Keep all for list

if (events.length===0) {
    fullEventList.innerHTML=` <div class="empty-events-premium"><div class="empty-icon"><i class="fas fa-calendar-day"></i></div><p>Bu ay özel bir gün yok</p></div>`;
    return;
}

events.forEach(ev=> {
        const row=document.createElement('div');
        row.className='event-list-item' + (ev.isCustom ? ' clickable-event' : '');

        row.innerHTML=` <div class="date-circle" style="color:${ev.color === '#a29bfe' ? '#6c5ce7' : 'var(--primary-color)'}; opacity:0.9;" >

        </div> <div class="note-text" >

        </div> 

        `;

        if (ev.isCustom) {
            row.onclick=()=> openDayModal(ev.dateKey);
        }

        fullEventList.appendChild(row);
    });
}

function openFullModal() {
    if ( !fullModal) return;
    // Sync date
    fullCalDate=new Date();
    renderFullCalendar();
    document.body.classList.add('modal-open');
    fullModal.classList.remove('hidden');
    requestAnimationFrame(()=> fullModal.classList.add('active'));
}

function closeFullModal() {
    if (fullModal) fullModal.classList.add('hidden');
    document.body.classList.remove('modal-open'); // Warning: might conflict if DayModal is also active?
    // But DayModal opens ON TOP of FullModal ideally. 
    // If we close FullModal, we assume DayModal is closed.
}

if (btnCloseFull) btnCloseFull.onclick=closeFullModal;

if (fullModal) {
    const backdrop=fullModal.querySelector('.modal-backdrop');
    if (backdrop) backdrop.onclick=closeFullModal;
}

// Bind Click on Small Calendar Card
const smallCalCard=document.querySelector('.calendar-card');

if (smallCalCard) {
    smallCalCard.addEventListener('click', (e)=> {
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
if (fullPrev) fullPrev.onclick=()=> {
    if (fullCalView==='year') {
        fullCalDate.setFullYear(fullCalDate.getFullYear() - 1);
    }

    else {
        fullCalDate.setMonth(fullCalDate.getMonth() - 1);
    }

    renderFullCalendar();
}

;

if (fullNext) fullNext.onclick=()=> {
    if (fullCalView==='year') {
        fullCalDate.setFullYear(fullCalDate.getFullYear() + 1);
    }

    else {
        fullCalDate.setMonth(fullCalDate.getMonth() + 1);
    }

    renderFullCalendar();
}

;

// --- Full Cal Swipe & Zoom Logic ---
let fullCalView='month'; // 'month' or 'year'

// Render Year View
function renderYearGridView() {
    if ( !fullGrid || !fullMonthLabel) return;
    fullGrid.innerHTML='';

    const year=fullCalDate.getFullYear();

    fullMonthLabel.textContent=`

    `;

    // Hide day headers and event list in year mode?
    const daysHeader=fullModal.querySelector('.calendar-days-header');
    if (daysHeader) daysHeader.style.display='none';
    if (fullEventList) fullEventList.parentElement.style.display='none';

    // Year Grid Style
    fullGrid.style.display='grid';
    fullGrid.style.gridTemplateColumns='repeat(3, 1fr)';
    fullGrid.style.rowGap='1rem';
    fullGrid.style.padding='1rem 0';

    const monthNames=["Ocak",
    "\u015Eubat",
    "Mart",
    "Nisan",
    "May\u0131s",
    "Haziran",
    "Temmuz",
    "A\u011Fustos",
    "Eyl\u00FCl",
    "Ekim",
    "Kas\u0131m",
    "Aral\u0131k"];

    monthNames.forEach((mName, idx)=> {
            const mEl=document.createElement('div');
            mEl.className='year-month-item';
            mEl.textContent=mName;
            mEl.style.padding='1rem';
            mEl.style.textAlign='center';
            mEl.style.background='var(--surface-color)';
            mEl.style.borderRadius='12px';
            mEl.style.fontWeight='500';
            mEl.style.cursor='pointer';

            if (idx===new Date().getMonth() && year===new Date().getFullYear()) {
                mEl.style.color='var(--primary-color)';
                mEl.style.fontWeight='700';
            }

            mEl.onclick=()=> {
                fullCalDate.setMonth(idx);
                fullCalView='month';
                renderFullCalendar();
            }

            ;

            fullGrid.appendChild(mEl);
        });
}

// Wrap renderFullCalendar to dispatch
const originalRenderFull=renderFullCalendar;

// Add click listener to header to switch to year view
if (fullMonthLabel) {
    fullMonthLabel.style.cursor='pointer';
    fullMonthLabel.title="Yıl görünümüne geç";

    fullMonthLabel.onclick=()=> {
        if (fullCalView==='month') {
            fullCalView='year';
            renderFullCalendar();
        }

        else {
            // If already year, maybe go back to month? 
            // Usually people click to zoom in/out.
            fullCalView='month';
            renderFullCalendar();
        }
    }

    ;
}

renderFullCalendar=function () {
    if (fullCalView==='year') {
        renderYearGridView();
    }

    else {
        // Restore styles for month view
        const daysHeader=fullModal.querySelector('.calendar-days-header');
        if (daysHeader) daysHeader.style.display='grid';
        if (fullEventList) fullEventList.parentElement.style.display='block';
        fullGrid.style.gridTemplateColumns='repeat(7, 1fr)';
        fullGrid.style.rowGap='8px';
        fullGrid.style.padding='0';

        originalRenderFull();
    }
}

;

// Gestures
let fcStartX=0;
let fcStartY=0; // For pinch calc maybe?
let initialPinchDist=0;
let isPinching=false;

const getDist=(touches)=> {
    return Math.hypot(touches[0].pageX - touches[1].pageX,
        touches[0].pageY - touches[1].pageY);
}

;

const sheetBody=fullModal.querySelector('.sheet-body');

if (sheetBody) {
    sheetBody.addEventListener('touchstart', (e)=> {
            if (e.touches.length===1) {
                fcStartX=e.touches[0].clientX;
                isPinching=false;
            }

            else if (e.touches.length===2) {
                isPinching=true;
                initialPinchDist=getDist(e.touches);
            }
        }

        , {
        passive: true
    });

sheetBody.addEventListener('touchmove', (e)=> {
        if (isPinching && e.touches.length===2) {
            e.preventDefault(); // Prevent scroll while pinching
        }
    }

    , {
    passive: false
}); // Need false to prevent default

sheetBody.addEventListener('touchend', (e)=> {
        if (isPinching && e.touches.length < 2) {
            // End Pinch
            // Just wait for logic or check changedTouches? 
            // Easier to check 'touchmove' but simple pinch logic usually done on end or throttle move.
            // Let's rely on stored distance vs final distance?
            // Actually standard pinch API involves 'touchmove'.
            isPinching=false;
            return;
        }

        if ( !isPinching && e.changedTouches.length===1) {
            // Swipe Logic
            const endX=e.changedTouches[0].clientX;
            const diff=fcStartX - endX;

            if (Math.abs(diff) > 60) {
                if (diff > 0) fullNext.click();
                else fullPrev.click();
            }
        }
    });

// Pinch Logic on Move
sheetBody.addEventListener('touchmove', (e)=> {
        if (e.touches.length===2) {
            const dist=getDist(e.touches);

            // Threshold
            if (Math.abs(dist - initialPinchDist) > 50) {
                if (dist < initialPinchDist) {

                    // Pinch In -> Zoom Out -> Year View
                    if (fullCalView !=='year') {
                        fullCalView='year';
                        renderFullCalendar();
                        isPinching=false; // Trigger once
                    }
                }

                else {

                    // Pinch Out -> Zoom In -> Month View
                    if (fullCalView==='year') {
                        fullCalView='month';
                        renderFullCalendar();
                        isPinching=false;
                    }
                }
            }
        }
    }

    , {
    passive: false
});
}

renderCalendar();
updateCarousel();
}

// End of setupCarouselAndCalendar

function renderHomeUpcomingEvents() {
    const listContainer=document.getElementById('home-upcoming-list');
    if ( !listContainer) return;

    const today=new Date();
    today.setHours(0, 0, 0, 0);

    let allEvents=[];

    // 1. Static Special Days (Global set or redefined)
    const specials=[ {
        d: 1, m: 0, msg: "Yılbaşı 🎄"
    }

    ,
    {
    d: 14, m: 1, msg: "Sevgililer Günü 🤍"
}

,
{
d: 23, m: 3, msg: "23 Nisan 🇹🇷"
}

,
{
d: 1, m: 4, msg: "Emek ve Dayanışma Günü"
}

,
{
d: 19, m: 4, msg: "19 Mayıs 🇹🇷"
}

,
{
d: 15, m: 6, msg: "15 Temmuz 🇹🇷"
}

,
{
d: 30, m: 7, msg: "30 Ağustos 🇹🇷"
}

,
{
d: 29, m: 9, msg: "29 Ekim 🇹🇷"
}

];

const currentYear=today.getFullYear();

specials.forEach(s=> {
        let evDate=new Date(currentYear, s.m, s.d);
        if (evDate < today) evDate=new Date(currentYear + 1, s.m, s.d);

        allEvents.push({
            date: evDate, msg: s.msg, color: 'var(--primary-color)'
        });
});

// 2. System Dates (Nişan/Nikah)
if (settings.dates?.engagement) {
    const d=new Date(settings.dates.engagement);

    if (d >=today) allEvents.push({
        date: d, msg: "Nişan 💍", color: 'var(--primary-color)'
    });
}

if (settings.dates?.wedding) {
    const d=new Date(settings.dates.wedding);

    if (d >=today) allEvents.push({
        date: d, msg: "Nikah 💍", color: 'var(--primary-color)'
    });
}

// 3. Custom Notes
if (settings.customEvents) {
    for (const [key, val] of Object.entries(settings.customEvents)) {
        const d=new Date(key);

        if (d >=today) {
            const noteText=(typeof val==='object') ? (val.note || ''): val;

            if (noteText) {
                allEvents.push({
                    date: d, msg: noteText, color: '#a29bfe'
                });
        }
    }
}
}

// Sort & Filter
allEvents.sort((a, b)=> a.date - b.date);
const upcoming=allEvents.slice(0, 3); // Top 3

if (upcoming.length===0) {
    listContainer.innerHTML='<div style="font-size: 0.8rem; color: var(--text-muted); opacity: 0.7;">Yaklaşan tarih bulunamadı.</div>';
    return;
}

listContainer.innerHTML=upcoming.map(ev=> {
        const day=ev.date.getDate();
        const month=ev.date.getMonth() + 1;

        return ` <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.03); padding: 6px 10px; border-radius: 8px;" > <div style="display: flex; align-items: center; gap: 8px;" > <div style="width: 24px; height: 24px; background: white; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; color: ${ev.color === '#a29bfe' ? '#6c5ce7' : 'var(--primary-color)'}; box-shadow: 0 2px 4px rgba(0,0,0,0.05);" >

        /

        </div> <span style="font-size: 0.82rem; color: var(--text-dark); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;" >

        </span> </div> <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500;" >

        gün</span> </div> `;
    }).join('');
}




// --- INITIAL LOAD ---
renderHomeUpcomingEvents();
if (typeof refreshSpecialMessage==='function') refreshSpecialMessage();
initDarkMode();
setupCarouselAndCalendar();
}

// End of setupEventListeners


// --- Product Detail View Logic (New) ---
function openProductDetailModal(item) {
    // Double check we have the latest data for this item from the global array
    const latestItem=items.find(i=> i.id===item.id) || item;

    const modal=document.getElementById('modal-product-detail');
    if ( !modal) return;

    // Elements
    const title=document.getElementById('detail-title');
    const catBadge=document.getElementById('detail-category');
    const priceEl=document.getElementById('detail-price');
    const noteEl=document.getElementById('detail-note');
    const statusText=document.getElementById('detail-status-text');
    const btnEdit=document.getElementById('btn-edit-detail');
    const btnClose=modal.querySelector('.close-detail-modal');

    // Gallery Elements
    const galleryContainer=document.getElementById('detail-gallery');
    const galleryTrack=document.getElementById('detail-gallery-track');
    const galleryDots=document.getElementById('detail-gallery-dots');

    // Link Elements
    const linksSection=document.getElementById('detail-links-section');
    const linksList=document.getElementById('detail-links-list');
    const singleLinkBtn=document.getElementById('detail-link'); // Legacy

    // 1. Basic Info
    if (title) title.textContent=latestItem.name;
    if (catBadge) catBadge.textContent=latestItem.category;

    const totalP=(latestItem.price || 0) * (latestItem.quantity || 1);
    if (priceEl) priceEl.textContent=totalP>0 ? currencyFormatter.format(totalP): '';

    if (noteEl) {
        noteEl.textContent=latestItem.note || 'Henüz bir not eklenmemiş.';
        noteEl.style.color=latestItem.note ? 'var(--text-color)': 'var(--text-light)';
        noteEl.style.fontStyle=latestItem.note ? 'normal': 'italic';
    }

    if (statusText) {
        statusText.textContent=latestItem.isBought ? 'Tamamlandı ✅': 'Satın Alınacak ⏳';
        statusText.style.color=latestItem.isBought ? 'var(--success-color)': 'var(--primary-color)';
    }

    // 2. Gallery Logic
    let images=[];
    if (latestItem.images && Array.isArray(latestItem.images)) images=latestItem.images.filter(src=> ! !src);
    else if (latestItem.image) images=[latestItem.image];

    if (images.length > 0 && galleryContainer && galleryTrack) {
        // Show Gallery and hide nothing
        galleryContainer.classList.remove('hidden');
        galleryContainer.style.display='block'; // Force visibility

        galleryTrack.innerHTML='';
        if (galleryDots) galleryDots.innerHTML='';
        galleryTrack.style.transform='translateX(0)';

        images.forEach((imgSrc, idx)=> {
                const slide=document.createElement('div');
                slide.className='gallery-item';
                const img=document.createElement('img');
                img.src=imgSrc;
                img.style.width='100%';
                img.style.height='100%';
                img.style.objectFit='contain';

                img.onclick=()=> {
                    if (window.viewImage) window.viewImage(imgSrc);
                }

                ;
                slide.appendChild(img);
                galleryTrack.appendChild(slide);

                if (galleryDots) {
                    const dot=document.createElement('div');
                    dot.className='gallery-dot' + (idx===0 ? ' active' : '');
                    galleryDots.appendChild(dot);
                }
            });

        if (images.length > 1 && typeof initDetailCarousel==='function') {
            initDetailCarousel(galleryTrack, galleryDots, images.length);
        }
    }

    else {
        if (galleryContainer) {
            galleryContainer.classList.add('hidden');
            galleryContainer.style.display='none';
        }
    }

    // 3. Links Logic
    let links=[];
    if (latestItem.links && Array.isArray(latestItem.links)) links=latestItem.links.filter(l=> ! !l);
    else if (latestItem.link) links=[latestItem.link];

    if (links.length > 0 && linksSection && linksList) {
        if (singleLinkBtn) singleLinkBtn.classList.add('hidden'); // Hide legacy
        linksSection.classList.remove('hidden');
        linksSection.style.display='block';
        linksList.innerHTML='';

        links.forEach(link=> {
                const a=document.createElement('a');
                a.href=link;
                a.target='_blank';
                a.className='detail-link-item';

                a.innerHTML=`<i class="fas fa-link" ></i> 

                `;
                linksList.appendChild(a);
            });
    }

    else {
        if (linksSection) {
            linksSection.classList.add('hidden');
            linksSection.style.display='none';
        }

        if (singleLinkBtn) singleLinkBtn.classList.add('hidden');
    }

    // Edit Action
    if (btnEdit) {
        btnEdit.onclick=()=> {
            modal.classList.remove('active');

            setTimeout(()=> {
                    modal.classList.add('hidden');
                    if (window.editItemModal) window.editItemModal(latestItem);
                }

                , 200);
        }

        ;
    }

    // Close Action
    if (btnClose) {
        btnClose.onclick=()=> {
            closeDetailModal();
        }

        ;
    }

    // Click outside
    modal.onclick=(e)=> {
        if (e.target===modal || e.target.classList.contains('modal-backdrop')) {
            closeDetailModal();
        }
    }

    ;

    function closeDetailModal() {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');

        setTimeout(()=> {
                modal.classList.add('hidden');
            }

            , 300);
    }

    // Show
    modal.classList.remove('hidden');
    requestAnimationFrame(()=> modal.classList.add('active'));
    document.body.classList.add('modal-open');
}

// Helper: Detail Carousel (High Performance V3)
function initDetailCarousel(track, dotsContainer, count) {
    let current=0;
    let startX=0;
    let startY=0;
    let isDragging=false;
    let isHorizontal=false;
    const dots=dotsContainer.children;
    const container=track.parentElement;

    function update(transition=true) {
        track.style.transition=transition ? 'transform 0.4s cubic-bezier(0.2, 1, 0.3, 1)': 'none';

        track.style.transform=`translateX(-

            %)`;

        Array.from(dots).forEach((d, i)=> {
                if (i===current) d.classList.add('active');
                else d.classList.remove('active');
            });
    }

    const handleStart=(e)=> {
        startX=e.touches[0].clientX;
        startY=e.touches[0].clientY;
        isDragging=true;
        isHorizontal=false;
        track.style.transition='none';
    }

    ;

    const handleMove=(e)=> {
        if ( !isDragging) return;
        const x=e.touches[0].clientX;
        const y=e.touches[0].clientY;
        const dx=x - startX;
        const dy=y - startY;

        if ( !isHorizontal && Math.abs(dx) > Math.abs(dy)) {
            if (Math.abs(dx) > 10) isHorizontal=true;
        }

        if (isHorizontal) {
            if (e.cancelable) e.preventDefault();
            const offset=-(current * container.offsetWidth)+dx;

            track.style.transform=`translateX(

                px)`;
        }
    }

    ;

    const handleEnd=(e)=> {
        if ( !isDragging) return;
        isDragging=false;
        if ( !isHorizontal) return;

        const diff=startX - e.changedTouches[0].clientX;

        if (Math.abs(diff) > 50) {
            if (diff > 0 && current < count - 1) current++;
            else if (diff < 0 && current > 0) current--;
        }

        update();
    }

    ;

    // Use direct properties to ensure only one handler exists
    container.ontouchstart=handleStart;
    container.ontouchmove=handleMove;
    container.ontouchend=handleEnd;

    update(false);
}

function formatDateToDisplay(dateStr) {
    if ( !dateStr || !dateStr.includes('-')) return dateStr;
    const [year,
    month,
    day]=dateStr.split('-');

    return `

    .

    .

    `;
}

// --- Custom Date Picker Logic ---
let activeDateInputId=null;
let calendarViewDate=new Date(); // Date being viewed in picker
let isYearPickerActive=false;

const monthNames=["Ocak",
"Şubat",
"Mart",
"Nisan",
"Mayıs",
"Haziran",
"Temmuz",
"Ağustos",
"Eylül",
"Ekim",
"Kasım",
"Aralık"];

// --- Calendar Swipe Logic ---
let calTouchStartX=0;

function handleCalSwipe(e) {
    if (isYearPickerActive) return;
    const touchEndX=e.changedTouches[0].screenX;
    const diff=touchEndX - calTouchStartX;

    if (Math.abs(diff) > 50) {
        if (diff > 0) calendarViewDate.setMonth(calendarViewDate.getMonth() - 1);
        else calendarViewDate.setMonth(calendarViewDate.getMonth() + 1);
        renderCustomCalendar();
    }
}

function renderCustomCalendar() {
    if (isYearPickerActive) {
        renderYearPicker();
        return;
    }

    const grid=document.getElementById('calendar-days-grid');
    const title=document.getElementById('calendar-month-year');
    const daysView=document.getElementById('calendar-days-view');
    const yearsView=document.getElementById('calendar-years-view');

    if ( !grid || !title || !daysView || !yearsView) return;

    daysView.classList.remove('hidden');
    yearsView.classList.add('hidden');

    grid.innerHTML='';
    const year=calendarViewDate.getFullYear();
    const month=calendarViewDate.getMonth();

    title.textContent=`

    

    `;

    // Get first day of month (0 = Sunday, we want 0 = Monday for Pt)
    let firstDay=new Date(year, month, 1).getDay();
    firstDay=firstDay===0 ? 6 : firstDay - 1; // Adjust to Pt-Pa

    const daysInMonth=new Date(year, month + 1, 0).getDate();

    // Empty slots
    for (let i=0; i < firstDay; i++) {
        const empty=document.createElement('div');
        empty.className='calendar-day empty';
        grid.appendChild(empty);
    }

    // Days
    const selectedDateStr=document.getElementById(activeDateInputId)?.dataset.rawDate || '';
    const today=new Date();

    for (let d=1; d <=daysInMonth; d++) {
        const dayEl=document.createElement('div');
        dayEl.className='calendar-day';
        dayEl.textContent=d;

        const dateStr=`

        -

        -

        `;

        if (dateStr===selectedDateStr) dayEl.classList.add('active');

        if (year===today.getFullYear() && month===today.getMonth() && d===today.getDate()) {
            dayEl.classList.add('today');
        }

        dayEl.onclick=()=> {
            const input=document.getElementById(activeDateInputId);

            if (input) {
                input.value=`

                .

                .

                `;
                input.dataset.rawDate=dateStr;
            }

            closeCustomCalendar();
        }

        ;

        grid.appendChild(dayEl);
    }
}

function renderYearPicker() {
    const grid=document.getElementById('calendar-years-grid');
    const title=document.getElementById('calendar-month-year');
    const daysView=document.getElementById('calendar-days-view');
    const yearsView=document.getElementById('calendar-years-view');

    if ( !grid || !title || !daysView || !yearsView) return;

    daysView.classList.add('hidden');
    yearsView.classList.remove('hidden');

    grid.innerHTML='';
    const currentYear=new Date().getFullYear();
    title.textContent="Yıl Seçin";

    // Show range from currentYear - 5 to currentYear + 10
    for (let y=currentYear - 5; y <=currentYear + 10; y++) {
        const yearEl=document.createElement('div');
        yearEl.className='calendar-year';
        if (y===calendarViewDate.getFullYear()) yearEl.classList.add('active');
        yearEl.textContent=y;

        yearEl.onclick=()=> {
            calendarViewDate.setFullYear(y);
            isYearPickerActive=false;
            renderCustomCalendar();
        }

        ;

        grid.appendChild(yearEl);
    }
}

function openCustomCalendar(inputId) {
    activeDateInputId=inputId;
    const input=document.getElementById(inputId);
    const existingDate=input?.dataset.rawDate ? new Date(input.dataset.rawDate): new Date();

    if ( !isNaN(existingDate.getTime())) {
        calendarViewDate=new Date(existingDate.getFullYear(), existingDate.getMonth(), 1);
    }

    const modal=document.getElementById('modal-custom-calendar');
    modal.classList.remove('hidden');
    requestAnimationFrame(()=> modal.classList.add('active'));
    isYearPickerActive=false; // Reset to days view
    renderCustomCalendar();

    // Attach Swipes (Once)
    const calBody=modal.querySelector('.calendar-body-custom');

    if (calBody && !calBody.dataset.swipeBound) {
        calBody.addEventListener('touchstart', (e)=> {
                calTouchStartX=e.changedTouches[0].screenX;
            }

            , {
            passive: true
        });

    calBody.addEventListener('touchend', handleCalSwipe, {
        passive: true
    });
calBody.dataset.swipeBound="true";
}
}

function closeCustomCalendar() {
    const modal=document.getElementById('modal-custom-calendar');
    modal.classList.remove('active');
    setTimeout(()=> modal.classList.add('hidden'), 200);
}

// Nav Listeners
document.getElementById('cal-prev')?.addEventListener('click', ()=> {
        calendarViewDate.setMonth(calendarViewDate.getMonth() - 1);
        renderCustomCalendar();
    });

document.getElementById('cal-next')?.addEventListener('click', ()=> {
        if (isYearPickerActive) return;
        calendarViewDate.setMonth(calendarViewDate.getMonth() + 1);
        renderCustomCalendar();
    });

document.getElementById('calendar-month-year')?.addEventListener('click', ()=> {
        isYearPickerActive= !isYearPickerActive;
        renderCustomCalendar();
    });

document.getElementById('close-custom-calendar')?.addEventListener('click', closeCustomCalendar);
document.getElementById('close-custom-calendar-btn')?.addEventListener('click', closeCustomCalendar);

// Input Listeners
document.addEventListener('click', (e)=> {
        const dateInput=e.target.closest('#input-date-nisan, #input-date-nikah');

        if (dateInput) {
            openCustomCalendar(dateInput.id);
        }
    });


// --- Edit Budget Event Listener ---

document.addEventListener('click', (e)=> {
        // Weekly Goal Edit
        const btnGoal=e.target.closest('#btn-edit-weekly-goal');

        if (btnGoal) {
            const modal=document.getElementById('modal-weekly-goal');
            const textarea=document.getElementById('weekly-goal-input');

            if (modal && textarea) {
                textarea.value=settings.weeklyGoal || '';
                modal.classList.remove('hidden');
                requestAnimationFrame(()=> modal.classList.add('active'));
                document.body.classList.add('modal-open');
                textarea.focus();
            }

            return;
        }

        // Countdown Edit
        const btnCountdown=e.target.closest('.unified-countdown-card:not(.calendar-mode):not(.upcoming-mode)');

        if (btnCountdown) {
            const modal=document.getElementById('modal-dates-editor');
            const inputNisan=document.getElementById('input-date-nisan');
            const inputNikah=document.getElementById('input-date-nikah');

            if (modal && inputNisan && inputNikah) {
                const dateNisan=settings.dates.engagement || '';
                const dateNikah=settings.dates.wedding || '';

                inputNisan.value=formatDateToDisplay(dateNisan);
                inputNisan.dataset.rawDate=dateNisan;

                inputNikah.value=formatDateToDisplay(dateNikah);
                inputNikah.dataset.rawDate=dateNikah;

                modal.classList.remove('hidden');
                requestAnimationFrame(()=> modal.classList.add('active'));
                document.body.classList.add('modal-open');
            }

            return;
        }
    });

// Save Weekly Goal
const btnSaveWeeklyGoal=document.getElementById('btn-save-weekly-goal');

if (btnSaveWeeklyGoal) {
    btnSaveWeeklyGoal.onclick=()=> {
        const modal=document.getElementById('modal-weekly-goal');
        const textarea=document.getElementById('weekly-goal-input');

        if (modal && textarea) {
            settings.weeklyGoal=textarea.value.trim() || 'Bu hafta için bir güzellik belirle...';
            saveSettings();
            renderWeeklyGoal();

            // Close Modal
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
            setTimeout(()=> modal.classList.add('hidden'), 200);
        }
    }

    ;
}

// Save Dates
const btnSaveDates=document.getElementById('btn-save-dates');

if (btnSaveDates) {
    btnSaveDates.onclick=()=> {
        const modal=document.getElementById('modal-dates-editor');
        const inputNisan=document.getElementById('input-date-nisan');
        const inputNikah=document.getElementById('input-date-nikah');

        if (modal && inputNisan && inputNikah) {
            settings.dates.engagement=inputNisan.dataset.rawDate || inputNisan.value;
            settings.dates.wedding=inputNikah.dataset.rawDate || inputNikah.value;

            saveSettings();

            // Close Modal
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
            setTimeout(()=> modal.classList.add('hidden'), 200);
        }
    }

    ;
}


// Expose for potential external use
window.openProductDetailModal=openProductDetailModal;

// ========================================
// Budget Modal Event Listeners (Moved to Main Closure)
// ========================================
const budgetModal=document.getElementById('modal-budget');
const btnEditBudget=document.getElementById('btn-edit-budget');
const btnSaveBudgetNew=document.getElementById('btn-save-budget'); // Renamed to avoid conflict with existing btnSaveBudget
const btnResetBudget=document.getElementById('btn-reset-budget');
const btnBudgetAdd=document.getElementById('btn-budget-add');
const btnBudgetSub=document.getElementById('btn-budget-sub');
const budgetInput=document.getElementById('budget-input');
const budgetCurrentDisplay=document.getElementById('budget-current-display');

// Open budget modal on edit button click
if (btnEditBudget) {
    btnEditBudget.addEventListener('click', ()=> {
            if (window.openBudgetModal) {
                window.openBudgetModal();
            }
        });
}

// Close modal on backdrop or close button click
if (budgetModal) {
    const closeButtons=budgetModal.querySelectorAll('.close-modal-sheet, .modal-backdrop');

    closeButtons.forEach(btn=> {
            btn.addEventListener('click', ()=> {
                    budgetModal.classList.remove('active');
                    setTimeout(()=> budgetModal.classList.add('hidden'), 200);
                    document.body.classList.remove('modal-open');
                });
        });
}

// Add to budget
if (btnBudgetAdd) {
    btnBudgetAdd.addEventListener('click', ()=> {
            const val=budgetInput.value.replace(',', '.').trim();
            const amount=parseFloat(val) || 0;

            if (amount <=0) {
                showNotification('Lütfen geçerli bir tutar girin.', {
                    type: 'warning', icon: '⚠️'
                });
            return;
        }

        // Update budget (wallet) and also adjust monthly limit if it's the primary way user manages it
        settings.budget=(parseFloat(settings.budget) || 0) + amount;

        // If they are adding to a 0 limit, let's treat this as their new limit too
        if ((parseFloat(settings.monthlyBudget) || 0)===0) {
            settings.monthlyBudget=settings.budget;
        }

        else {
            // Otherwise just increase the limit as well? 
            // Normally "Add" means "I have more money now", so limit increases.
            settings.monthlyBudget=(parseFloat(settings.monthlyBudget) || 0) + amount;
        }

        settings.budgetLastUpdated=new Date().toISOString();

        saveSettings();
        if (typeof renderStats==='function') renderStats();

        // Success feedback
        showNotification(`

            bütçeye eklendi !`, {
            title: 'Bütçe Güncellendi',
            icon: '✅',
            type: 'success'
        });

    budgetInput.value='';

    const formatter=new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 0, maximumFractionDigits: 0
    });
if (budgetCurrentDisplay) budgetCurrentDisplay.textContent='₺' + formatter.format(settings.budget);
});
}

// Subtract from budget
if (btnBudgetSub) {
    btnBudgetSub.addEventListener('click', ()=> {
            const val=budgetInput.value.replace(',', '.').trim();
            const amount=parseFloat(val) || 0;

            if (amount <=0) {
                showNotification('Lütfen geçerli bir tutar girin.', {
                    type: 'warning', icon: '⚠️'
                });
            return;
        }

        // Update global settings
        settings.budget=(parseFloat(settings.budget) || 0) - amount;
        // Also reduce limit? Probably yes, to keep them in sync if using as a limit tool.
        settings.monthlyBudget=(parseFloat(settings.monthlyBudget) || 0) - amount;
        if (settings.monthlyBudget < 0) settings.monthlyBudget=0;

        settings.budgetLastUpdated=new Date().toISOString();

        saveSettings();
        if (typeof renderStats==='function') renderStats();

        showNotification(`

            bütçeden düşüldü.`, {
            title: 'Bütçe Güncellendi',
            icon: 'ℹ️',
            type: 'success'
        });

    budgetInput.value='';

    const formatter=new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 0, maximumFractionDigits: 0
    });
if (budgetCurrentDisplay) budgetCurrentDisplay.textContent='₺' + formatter.format(settings.budget);
});
}

// Save budget (Set or Update)
if (btnSaveBudgetNew) {
    btnSaveBudgetNew.addEventListener('click', ()=> {
            const valStr=budgetInput.value.trim().replace(',', '.');

            // If user typed a value, OVERWRITE the budget
            if (valStr !=='') {
                const newBudgetVal=parseFloat(valStr) || 0;
                settings.budget=newBudgetVal;
                settings.monthlyBudget=newBudgetVal;
                settings.budgetLastUpdated=new Date().toISOString();
            }

            // If empty, we JUST keep the current settings.budget (which might have been updated by 'Ekle')

            // Persist
            if ( !settings.lastMonthReset) {
                const now=new Date();

                settings.lastMonthReset=`

                -

                `;
            }

            saveSettings();
            if (typeof renderStats==='function') renderStats();

            // Success feedback
            const formatter=new Intl.NumberFormat('tr-TR', {
                minimumFractionDigits: 0, maximumFractionDigits: 0
            });

        showNotification(`Bütçeniz 

            TL olarak hazırlandı.`,
            {
            title: 'Bütçe Kaydedildi',
            icon: '💰',
            type: 'success'
        });

    // Close modal
    budgetModal.classList.remove('active');

    setTimeout(()=> {
            budgetModal.classList.add('hidden');
            budgetInput.value='';
        }

        , 200);
    document.body.classList.remove('modal-open');
});
}

// Reset budget
if (btnResetBudget) {
    btnResetBudget.addEventListener('click', ()=> {

            showConfirm('Bütçenizi sıfırlamak istediğinize emin misiniz?\n\nBu işlem mevcut bakiye ve aylık limitinizi silecektir.',
                {
                title: 'Bütçeyi Sıfırla',
                icon: '🗑️',
                confirmText: 'Sıfırla',
                cancelText: 'İptal',
                confirmColor: '#e74c3c',
                cancelColor: '#95a5a6'

            }).then(confirmed=> {
                if (confirmed) {
                    // Update global settings
                    settings.budget=0;
                    settings.monthlyBudget=0;
                    settings.budgetLastUpdated=new Date().toISOString();

                    saveSettings();

                    // Update display
                    const formatter=new Intl.NumberFormat('tr-TR', {
                        minimumFractionDigits: 0, maximumFractionDigits: 0
                    });
                if (budgetCurrentDisplay) budgetCurrentDisplay.textContent='₺' + formatter.format(0);
                if (typeof renderStats==='function') renderStats();

                budgetInput.value='';

                // Show success message
                showNotification('Bütçe sıfırlandı!\n\nYeni bir aylık bütçe belirlemek için kaydet butonunu kullanabilirsiniz.',
                    {
                    title: 'Bütçe Sıfırlandı',
                    icon: '✅',
                    type: 'success'
                });
        }
    });
});
}

// Expose openBudgetModal globally
window.openBudgetModal=function () {
    if ( !budgetModal) return;

    // Update display from global settings
    const formatter=new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 0, maximumFractionDigits: 0
    });

if (budgetCurrentDisplay) {
    budgetCurrentDisplay.textContent='₺'+formatter.format(settings.budget || 0);
}

budgetModal.classList.remove('hidden');
requestAnimationFrame(()=> budgetModal.classList.add('active'));
document.body.classList.add('modal-open');

// Removed automatic focus to prevent keyboard from popping up on mobile
}

;

});

/* BACKGROUND SELECTION SYSTEM */
function initBackgrounds() {
    const bgOptions=document.querySelectorAll('.bg-option');
    const savedBg=localStorage.getItem('bgStyle') || 'simple';

    function setBackground(style) {
        // Clear all background classes
        document.body.classList.remove('bg-floral', 'bg-picnic');

        // Apply new background class if not simple
        if (style !=='simple') {
            document.body.classList.add(`bg-

                `);
        }

        // Save
        localStorage.setItem('bgStyle', style);

        // Update UI
        // Update UI
        bgOptions.forEach(opt=> {
                if (opt.getAttribute('data-bg')===style) {
                    opt.classList.add('active');
                }

                else {
                    opt.classList.remove('active');
                }
            });
    }

    // Init
    setBackground(savedBg);

    // Event Delegation for BG Picker
    document.addEventListener('click', (e)=> {
            const option=e.target.closest('.bg-option');

            if (option) {
                const style=option.getAttribute('data-bg');
                if (style) setBackground(style);
            }
        });

    // Expose
    window.setAppBackground=setBackground;
}

// Auto-run on load (append to end or call conditionally)
// Since we can't easily insert into DOMContentLoaded without parsing, 
// we rely on the fact that this script is loaded at the end of body 
// OR we add a self-invoking check if DOM is ready.
if (document.readyState==='loading') {
    document.addEventListener('DOMContentLoaded', initBackgrounds);
}

else {
    initBackgrounds();
}


// --- Lightbox & Image Zoom Logic ---
document.addEventListener('DOMContentLoaded', ()=> {

        window.viewImage=function (src) {
            const modal=document.getElementById('modal-lightbox');
            const img=document.getElementById('lightbox-image');
            if ( !modal || !img) return;

            img.src=src;

            // Reset Zoom
            img.classList.remove('is-zoomed');
            img.style.maxWidth='100%';
            img.style.maxHeight='100%';
            img.style.width='';
            img.style.height='';
            img.style.transform='scale(1)';
            img.style.cursor='zoom-in';

            // Use flex center for fit mode
            const container=img.parentElement;
            container.style.justifyContent='center';
            container.style.alignItems='center';

            modal.classList.remove('hidden');
            requestAnimationFrame(()=> modal.classList.add('active'));
            document.body.classList.add('modal-open');
        }

        ;

        // Lightbox Controls
        const btnCloseLightbox=document.getElementById('btn-close-lightbox');
        const lightboxImg=document.getElementById('lightbox-image');
        const lightboxModal=document.getElementById('modal-lightbox');

        if (btnCloseLightbox) {
            btnCloseLightbox.addEventListener('click', closeLightbox);
        }

        // Zoom Interaction: Pinch-to-Zoom & Pan (Optimized with Constraints)
        if (lightboxImg) {
            let currentScale=1;
            let initialDist=0;
            let initialScale=1;

            let isPanning=false;
            let startX=0;
            let startY=0;
            let translateX=0;
            let translateY=0;
            let initialTranslateX=0;
            let initialTranslateY=0;

            const getDistance=(touches)=> {
                if (touches.length < 2) return 0;
                const dx=touches[0].clientX - touches[1].clientX;
                const dy=touches[0].clientY - touches[1].clientY;
                return Math.hypot(dx, dy);
            }

            ;

            const updateTransform=()=> {
                lightboxImg.style.transform=`translate(

                    px, 

                    px) scale()`;
            }

            ;

            // Helper to Clamp Translate values based on scale
            const clampTranslate=(x, y, scale)=> {
                const rect=lightboxImg.getBoundingClientRect();
                // Use original Width/Height for calculation if possible, or infer?
                // lightboxImg.offsetWidth is reliable.
                const w=lightboxImg.offsetWidth * scale;
                const h=lightboxImg.offsetHeight * scale;
                const vw=window.innerWidth;
                const vh=window.innerHeight;

                // Max offset allowed
                const maxOffsetX=Math.max(0, (w - vw) / 2);
                const maxOffsetY=Math.max(0, (h - vh) / 2);

                let newX=x;
                let newY=y;

                // Clamp X
                if (newX > maxOffsetX) newX=maxOffsetX;
                if (newX < -maxOffsetX) newX=-maxOffsetX;

                // Clamp Y
                if (newY > maxOffsetY) newY=maxOffsetY;
                if (newY < -maxOffsetY) newY=-maxOffsetY;

                return {
                    x: newX, y: newY
                }

                ;
            }

            ;

            const onTouchStart=(e)=> {
                if (e.touches.length===2) {
                    // Pinch Start
                    e.preventDefault();
                    initialDist=getDistance(e.touches);
                    initialScale=currentScale;
                }

                else if (e.touches.length===1 && currentScale > 1) {
                    // Pan Start
                    isPanning=true;
                    startX=e.touches[0].clientX;
                    startY=e.touches[0].clientY;
                    initialTranslateX=translateX;
                    initialTranslateY=translateY;
                }
            }

            ;

            const onTouchMove=(e)=> {
                if (e.touches.length===2) {
                    // Pinch Move
                    e.preventDefault();
                    const dist=getDistance(e.touches);

                    if (dist > 0 && initialDist > 0) {
                        const scaleDiff=dist / initialDist;
                        let newScale=initialScale * scaleDiff;
                        if (newScale < 1) newScale=1;
                        if (newScale > 5) newScale=5;

                        currentScale=newScale;

                        // Re-clamp translate while zooming to avoid "drift"
                        // If we zoom out, boundaries shrink.
                        const clamped=clampTranslate(translateX, translateY, currentScale);
                        translateX=clamped.x;
                        translateY=clamped.y;

                        updateTransform();
                    }
                }

                else if (e.touches.length===1 && isPanning) {
                    // Pan Move
                    e.preventDefault();
                    const dx=e.touches[0].clientX - startX;
                    const dy=e.touches[0].clientY - startY;

                    let rawX=initialTranslateX + dx;
                    let rawY=initialTranslateY + dy;

                    // Clamp immediately for smooth wall effect
                    const clamped=clampTranslate(rawX, rawY, currentScale);
                    translateX=clamped.x;
                    translateY=clamped.y;

                    updateTransform();
                }
            }

            ;

            const onTouchEnd=(e)=> {
                if (e.touches.length < 2) {
                    // Pinch ended
                }

                if (e.touches.length===0) {
                    isPanning=false;

                    // Elastic snap back if needed?
                    // Since we clamp during move, we just need to handle scale < 1 reset
                    if (currentScale < 1.05) {
                        currentScale=1;
                        translateX=0;
                        translateY=0;
                        lightboxImg.style.transition='transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
                        updateTransform();
                        setTimeout(()=> lightboxImg.style.transition='', 300);
                    }

                    else {
                        // Ensure within bounds one last time (e.g. if pinch zoom ended weirdly)
                        const clamped=clampTranslate(translateX, translateY, currentScale);

                        if (clamped.x !==translateX || clamped.y !==translateY) {
                            translateX=clamped.x;
                            translateY=clamped.y;
                            lightboxImg.style.transition='transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
                            updateTransform();
                            setTimeout(()=> lightboxImg.style.transition='', 200);
                        }
                    }
                }
            }

            ;

            // Double Tap
            let lastTap=0;

            lightboxImg.addEventListener('touchend', (e)=> {
                    if (isPanning) return; // Don't trigger if we were panning?
                    // Actually touchend logic handles isPanning=false before this if propagation is weird.
                    // But we are in same event loop order.
                    // Let's rely on time.

                    const currentTime=new Date().getTime();
                    const tapLength=currentTime - lastTap;

                    if (tapLength < 300 && tapLength > 0 && e.changedTouches.length===1 && currentScale===1) {
                        e.preventDefault();
                        currentScale=2.5;
                        translateX=0;
                        translateY=0;
                        lightboxImg.style.transition='transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
                        updateTransform();
                        setTimeout(()=> lightboxImg.style.transition='', 300);
                    }

                    else if (tapLength < 300 && tapLength > 0 && e.changedTouches.length===1 && currentScale > 1) {
                        e.preventDefault();
                        currentScale=1;
                        translateX=0;
                        translateY=0;
                        lightboxImg.style.transition='transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
                        updateTransform();
                        setTimeout(()=> lightboxImg.style.transition='', 300);
                    }

                    lastTap=currentTime;
                });

            lightboxImg.addEventListener('touchstart', onTouchStart, {
                passive: false
            });

        lightboxImg.addEventListener('touchmove', onTouchMove, {
            passive: false
        });
    lightboxImg.addEventListener('touchend', onTouchEnd);
    lightboxImg.addEventListener('touchcancel', onTouchEnd);
}

function closeLightbox() {
    if (lightboxModal) {
        lightboxModal.classList.remove('active');
        setTimeout(()=> lightboxModal.classList.add('hidden'), 200);

        // Check if any other modal is active (e.g. product detail) before removing lock
        const otherActive=document.querySelector('.modal.active:not(#modal-lightbox)');
        if ( !otherActive) document.body.classList.remove('modal-open');
    }
}

// Close on backdrop click
if (lightboxModal) {
    lightboxModal.addEventListener('click', (e)=> {
            if (e.target !==lightboxImg) {
                closeLightbox();
            }
        });
}

// ========================================
// Firebase Cloud Sync System (Enhanced)
// ========================================
const firebaseConfig= {
    // Placeholder - USER: You can enter your own Firebase config here for higher security
    // For now, I will use a logic that tries to init if possible.
    apiKey: "AIzaSyAs-DEMO-ONLY",
    authDomain: "ceyiz-defteri-sync.firebaseapp.com",
    projectId: "ceyiz-defteri-sync",
    storageBucket: "ceyiz-defteri-sync.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123"
}

;

let db=null;
let syncActive=false;
let unsubscribes=[];

async function initCloudSync() {
    const cloudInput=document.getElementById('setting-cloud-code');
    const syncStatus=document.getElementById('sync-status');
    const btnConnect=document.getElementById('btn-sync-connect');

    const code=(settings.syncCode || "").trim().toUpperCase();
    if (cloudInput) cloudInput.value=code;

    if ( !code) return;

    try {
        if ( !firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        db=firebase.firestore();
        syncActive=true;

        if (syncStatus) {
            syncStatus.textContent=`Durum: Bağlı (Kod: ) ✅`;
            syncStatus.style.color="#27ae60";
        }

        if (btnConnect) btnConnect.innerHTML='<i class="fas fa-sync fa-spin"></i> Senkronize Ediliyor...';

        setupCloudListeners(code);
    }

    catch (err) {
        console.error("Firebase Init Error:", err);
        if (syncStatus) syncStatus.textContent="Durum: Bağlantı Hatası! ❌";
    }
}

function setupCloudListeners(familyCode) {
    // Clear old listeners
    unsubscribes.forEach(unsub=> unsub());
    unsubscribes=[];

    const docRef=db.collection("families").doc(familyCode);

    // 1. Listen for items
    unsubscribes.push(docRef.collection("data").doc("items").onSnapshot(doc=> {
                if (doc.exists) {
                    const remoteData=doc.data().list;

                    if (JSON.stringify(remoteData) !==JSON.stringify(items)) {
                        items=remoteData;
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
                        renderApp();
                    }
                }
            }));

    // 2. Listen for settings
    unsubscribes.push(docRef.collection("data").doc("settings").onSnapshot(doc=> {
                if (doc.exists) {
                    const remoteSettings=doc.data().config;

                    // Avoid infinite loop: only update if changed
                    if (JSON.stringify(remoteSettings.syncCode)===JSON.stringify(settings.syncCode)) {
                        if (JSON.stringify(remoteSettings) !==JSON.stringify(settings)) {
                            settings= {
                                ...settings, ...remoteSettings
                            }

                            ;
                            localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
                            applySettings();
                            renderStats();
                        }
                    }
                }
            }));

    // 3. Listen for categories
    unsubscribes.push(docRef.collection("data").doc("categories").onSnapshot(doc=> {
                if (doc.exists) {
                    const remoteCats=doc.data().map;

                    if (JSON.stringify(remoteCats) !==JSON.stringify(userCategories)) {
                        userCategories=remoteCats;
                        localStorage.setItem(STORAGE_CATS_KEY, JSON.stringify(userCategories));
                        updateAllCategoryDropdowns();
                    }
                }
            }));
}

window.syncToCloud=async function (type, data) {
    if ( !syncActive || !db || !settings.syncCode) return;
    const familyCode=settings.syncCode.trim().toUpperCase();

    try {
        const docRef=db.collection("families").doc(familyCode).collection("data").doc(type);

        if (type==='items') await docRef.set({
            list: data, lastUpdated: new Date().toISOString()
        });

    if (type==='settings') await docRef.set({
        config: data, lastUpdated: new Date().toISOString()
    });

if (type==='categories') await docRef.set({
    map: data, lastUpdated: new Date().toISOString()
});
}

catch (err) {
    console.warn("Cloud Sync Failed:", err);
}
}

;

// Connect Button Listener
const btnSyncConnect=document.getElementById('btn-sync-connect');

if (btnSyncConnect) {
    btnSyncConnect.addEventListener('click', async ()=> {
            const codeInput=document.getElementById('setting-cloud-code');
            const code=codeInput.value.trim().toUpperCase();

            if ( !code || code.length < 4) {
                showNotification("Lütfen en az 4 haneli bir kod giriniz.", {
                    type: 'error'
                });
            return;
        }

        settings.syncCode=code;
        saveSettings();

        showNotification("Bulut bağlantısı kuruluyor...", {
            icon: '☁️'
        });
    await initCloudSync();

    // Initial Push to Cloud
    if (syncActive) {
        window.syncToCloud('items', items);
        window.syncToCloud('settings', settings);
        window.syncToCloud('categories', userCategories);

        showNotification("Bulut senkronizasyonu aktif! ✅", {
            type: 'success'
        });
}
});
}

// Auto-init fallback
initCloudSync();

}); // End Main App Init