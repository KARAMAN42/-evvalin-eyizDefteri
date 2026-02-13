// Şevval'in Çeyiz Defteri - TAM ONARILMIŞ SÜRÜM
// Tarih: 2026-02-10
// Durum: Rendering, Navigasyon ve Splash Fix İçerir

console.log("🚀 APP.JS BAŞLATILIYOR...");

// Global Değişkenler (Erişilebilir olması için dışarıda tanımladım ama içi DOMContentLoaded'da dolacak)
window.appData = {};

document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ DOM YÜKLENDİ - Başlatma işlemleri başlıyor...");

    // 0. SAYFA YÜKLENİNCE EN ÜSTE KAYDIR (Kullanıcı İsteği - Güçlendirilmiş)
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    // Hemen dene
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;

    // Biraz bekleyip tekrar dene (Tarayıcı render sonrası için)
    setTimeout(() => {
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        console.log("⬆️ Zorla yukarı kaydırıldı (Timeout)");
    }, 100);

    // =========================================================================
    // 1. ACİL SPLASH KAPATMA (EN ÖNEMLİ)
    // =========================================================================
    const splash = document.getElementById('splash-screen');
    if (splash) {
        console.log("🌊 Splash ekranı bulundu.");

        const removeSplash = () => {
            console.log("👋 Splash kaldırılıyor...");
            splash.style.pointerEvents = 'none'; // Tıklamaları engellememesi için hemen pasif yap
            splash.style.transition = 'opacity 0.5s ease';
            splash.style.opacity = '0';

            setTimeout(() => {
                splash.style.display = 'none';
                // DOM'dan silmek bazen kaydırmayı bozabilir, o yüzden display:none yeterli olabilir
                // ama 'görünmez duvar' riskine karşı z-index'i de düşürelim
                splash.style.zIndex = '-9999';
                console.log("✅ Splash gizlendi.");
            }, 500);
        };

        // Splash Screen Kapatma: Sadece swipe ile
        // Tıklama kaldırıldı (Kullanıcı isteği)

        // SWIPE UP (Yukarı Kaydırma) İle Kapatma
        let touchStartY = 0;
        let touchEndY = 0;

        splash.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        splash.addEventListener('touchend', (e) => {
            touchEndY = e.changedTouches[0].screenY;
            handleSwipe();
        }, { passive: true });

        function handleSwipe() {
            // Yeterince yukarı kaydırıldı mı? (min 50px)
            if (touchStartY - touchEndY > 50) {
                console.log("👆 Yukarı kaydırma algılandı, splash kapatılıyor.");
                removeSplash();
            }
        }

        // GÜÇLÜ TIKLAMA ENGELLEME - Capture fazında yakala
        splash.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            console.log("🚫 Splash click engellendi (capture phase)");
            return false;
        }, true); // true = capture phase (daha erken yakalar)

        // Mousedown/mouseup da engelle (mobilde touchend -> click dönüşümünü engeller)
        splash.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, true);

        splash.addEventListener('mouseup', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, true);

        // Pointer events da engelle
        splash.addEventListener('pointerdown', (e) => {
            // Touch event'leri geçmesine izin ver ama mouse'u engelle
            if (e.pointerType === 'mouse') {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);

        // Masaüstü için tıklama kalsın mı? Kullanıcı 'sadece' dedi ama
        // PC'de swipe yapamaz. O yüzden PC için bir fallback buton veya click bırakmak mantıklı.
        // Şimdilik sadece mobil swipe odaklı yapıyorum ama PC'de test ediliyorsa tıklama gerekebilir.
        // Güvenlik önlemi: Çift tıklama veya ikon tıklaması ekleyebiliriz?
        // Kullanıcı "sadece yukarı kaydırınca" dediği için şimdilik strictly uyguluyorum.
        // İpucu oku gösterelim mi? Zaten animasyon var.

        // PC için Mouse Wheel desteği (Swipe alternatifi)
        splash.addEventListener('wheel', (e) => {
            if (e.deltaY > 0) {
                // Aşağı scroll (Genelde içerik aşağı iner, yani yukarı kaydırırsın)
                removeSplash();
            }
        });
    } else {
        console.warn("⚠️ Splash ekranı bulunamadı (belki zaten kaldırıldı).");
    }

    // =========================================================================
    // 2. VERİ YÖNETİMİ VE DURUM
    // =========================================================================
    let currentTab = 'home';
    let items = [];
    let userCategories = { ceyiz: [], damat: [] };

    // Varsayılan Kategoriler
    const defaultCategories = {
        ceyiz: ['Mutfak', 'Yatak Odası', 'Banyo', 'Salon', 'Elektronik', 'Tekstil', 'Dekorasyon', 'Diğer'],
        damat: ['Giyim', 'Bakım', 'Aksesuar', 'Ayakkabı', 'İç Giyim', 'Bohça Süsü', 'Diğer']
    };

    let settings = {
        userName: 'Şevval',
        partnerName: 'Yusuf',
        dates: {
            engagement: '2025-06-15',
            wedding: '2026-08-20'
        },
        theme: {
            mode: 'light',
            background: 'simple'
        },
        budget: null, // null = henüz bütçe girilmemiş, sumOfItems kullan
        lastBudgetResetMonth: new Date().toISOString().slice(0, 7), // Örn: "2026-02"
        history: {} // { "2026-01": { budget: 5000, spent: 4500 }, ... }
    };

    const STORAGE_KEY = 'ceyiz_data_v2';

    // Yardımcı: Yerel Tarih (YYYY-MM) - Timezone sorununu çözer
    const getLocalYYYYMM = (date = new Date()) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };

    // Yardımcı: Cari Ay (YYYY-MM)
    const getCurrentMonth = () => getLocalYYYYMM(new Date());

    // Bütçe Aylık Sıfırlama Kontrolü
    function checkMonthlyBudgetReset() {
        const currentMonth = getCurrentMonth();
        if (settings.lastBudgetResetMonth !== currentMonth) {
            console.log(`📅 Ay değişti (${settings.lastBudgetResetMonth} -> ${currentMonth}), bütçe sıfırlanıyor.`);

            // ESKİ AYI ARŞİVLE
            const lastMonth = settings.lastBudgetResetMonth;

            // O aya ait harcamayı hesapla
            let lastMonthSpent = 0;
            items.forEach(i => {
                if (i.isBought && i.purchaseMonth === lastMonth) {
                    lastMonthSpent += (i.price || 0) * (i.quantity || 1);
                }
            });

            if (!settings.history) settings.history = {};
            settings.history[lastMonth] = {
                budget: settings.budget || 0,
                spent: lastMonthSpent
            };

            settings.budget = 0;
            settings.lastBudgetResetMonth = currentMonth;
            saveData();
        }
    }

    function loadData() {
        try {
            // Priority: Normal Key -> Safe Copy -> Backup File
            let data = localStorage.getItem(STORAGE_KEY);

            if (!data) {
                console.log("⚠️ Birincil veri yok, güvenli kopya kontrol ediliyor...");
                data = localStorage.getItem(STORAGE_KEY + '_safe_copy');
            }

            // Backup legacy key check
            if (!data) {
                console.log("⚠️ Eski anahtar (ceyiz_data) kontrol ediliyor...");
                data = localStorage.getItem('ceyiz_data');
            }

            if (data) {
                const parsed = JSON.parse(data);
                items = parsed.items || [];
                userCategories = parsed.userCategories || { ceyiz: [], damat: [] };
                settings = { ...settings, ...(parsed.settings || {}) };

                checkMonthlyBudgetReset();
                console.log(`📂 Veri başarıyla yüklendi: ${items.length} ürün.`);
            } else {
                console.log("📂 Hiçbir kayıtlı veri bulunamadı, başlangıç değerleri kullanılıyor.");
            }
        } catch (e) {
            console.error("❌ Veri yükleme hatası:", e);
        }
    }

    function saveData(options = {}) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                items,
                userCategories,
                settings
            }));

            // Güvenli Kopya (Her kayıtta alıyoruz)
            localStorage.setItem(STORAGE_KEY + '_safe_copy', JSON.stringify({
                items,
                userCategories,
                settings
            }));

            console.log("💾 Veri kaydedildi (Asıl + Güvenli Kopya).");
            updateStats();

            // Trigger Cloud Sync if active
            if (window.syncToCloud && !options.suppressSync) {
                window.syncToCloud();
            }
        } catch (e) {
            console.error("❌ Veri kaydetme hatası:", e);
        }
    }

    // Parametreleri düzeltmek için (Sayısal değerler string gelmesin)
    function sanitizeItem(item) {
        return {
            ...item,
            quantity: parseInt(item.quantity) || 1,
            price: parseFloat(item.price) || 0
        };
    }

    // =========================================================================
    // 3. RENDER (GÖRÜNTÜLEME) MOTORU
    // =========================================================================

    // İkon Yardımcısı
    function getCategoryIcon(cat) {
        const map = {
            'Mutfak': 'fa-utensils',
            'Yatak Odası': 'fa-bed',
            'Banyo': 'fa-bath',
            'Salon': 'fa-couch',
            'Elektronik': 'fa-plug',
            'Tekstil': 'fa-rug',
            'Giyim': 'fa-tshirt',
            'Bakım': 'fa-pump-soap',
            'Aksesuar': 'fa-gem',
            'Ayakkabı': 'fa-shoe-prints'
        };
        return map[cat] || 'fa-tag';
    }

    // Ana Liste Render Fonksiyonu
    function renderList(type) {
        console.log(`🎨 Liste oluşturuluyor: ${type}`);
        const listContainer = document.getElementById(`${type}-list`);

        if (!listContainer) {
            console.error(`❌ HATA: #${type}-list konteyneri bulunamadı!`);
            return;
        }

        listContainer.innerHTML = '';
        const listItems = items.filter(i => i.type === type);

        if (listItems.length === 0) {
            // Boş durum mesajı (Zaten HTML'de var, class'ı kaldırıp gösterelim mi? 
            // Hayır, HTML'deki statik empty-state'i kullanalım)
            const emptyState = document.querySelector(`#${type}-section .empty-state`);
            if (emptyState) emptyState.classList.remove('hidden');
        } else {
            const emptyState = document.querySelector(`#${type}-section .empty-state`);
            if (emptyState) emptyState.classList.add('hidden');

            // Listeyi kategoriye göre sırala (Opsiyonel, şimdilik ekleme sırası)
            // listItems.sort((a, b) => b.id - a.id); // Yeniler en üstte

            listItems.forEach(item => {
                const el = document.createElement('div');
                el.className = `item-card ${item.isBought ? 'bought' : ''}`;
                el.dataset.id = item.id;

                // HTML Template
                el.innerHTML = `
                    <div class="drag-handle"><i class="fas fa-grip-vertical"></i></div>
                    <div class="item-content">
                        <label class="checkbox-wrapper">
                            <input type="checkbox" ${item.isBought ? 'checked' : ''} onchange="window.toggleItemStatus('${item.id}', this.checked)">
                            <div class="custom-checkbox"><i class="fas fa-check"></i></div>
                        </label>
                        ${item.photos && item.photos.length > 0 ? `
                        <div class="item-thumbnail" onclick="event.stopPropagation(); window.openImageViewer(window.appData.getItems().find(i => i.id === '${item.id}').photos, 0)">
                            <img src="${item.photos[0]}" alt="img" loading="lazy">
                        </div>` : ''}
                        <div class="item-info" onclick="window.showItemDetails('${item.id}')">
                            <h3>${item.name}</h3>
                            <div class="item-details">
                                <span class="item-tag"><i class="fas ${getCategoryIcon(item.category)}"></i> ${item.category}</span>
                                ${item.quantity > 1 ? `<span class="item-tag qty">x${item.quantity}</span>` : ''}
                                ${item.price ? `<span class="item-price-tag">₺${item.price.toLocaleString()}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn-icon delete" onclick="window.deleteItem('${item.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                listContainer.appendChild(el);
            });
        }
    }

    // İstatistik Güncelleme (GELİŞMİŞ)
    function updateStats() {
        // 1. Hesaplamalar
        let totalSpent = 0; // Tüm zamanlar
        let thisMonthSpent = 0; // Sadece bu ay
        let sumOfItems = 0; // Eklenen tüm ürünlerin toplam fiyatı
        let totalItems = items.length;
        let boughtItems = 0;

        const currentMonth = getCurrentMonth();

        // Kategori Analizi için
        const catAnalysis = {};

        items.forEach(i => {
            const cost = (i.price || 0) * (i.quantity || 1);
            sumOfItems += cost;
            if (i.isBought) {
                totalSpent += cost;
                boughtItems++;

                // Bu aya ait mi?
                if (i.purchaseMonth === currentMonth) {
                    thisMonthSpent += cost;
                }
            }

            // Kategori Toplamı
            const cat = i.category || 'Diğer';
            if (!catAnalysis[cat]) catAnalysis[cat] = 0;
            catAnalysis[cat] += cost;
        });

        // Bütçe Mantığı
        // Eğer ayarlarda manuel bütçe varsa onu kullan, yoksa ürünlerin toplamını kullan
        // null veya undefined ise henüz bütçe girilmemiştir.
        const targetBudget = (settings.budget !== null && settings.budget !== undefined) ? settings.budget : sumOfItems;

        // 2. Ana Kartlar (Hero)
        const els = {
            totalMoney: document.getElementById('stat-total-money'),
            spentMoney: document.getElementById('stat-spent-money'), // Bu Ay Harcanan
            remainingMoney: document.getElementById('stat-remaining-money'),
            budgetGauge: document.getElementById('budget-gauge-fill'),
            currentBudgetDisplay: document.getElementById('budget-current-display') // Modal içindeki
        };

        if (els.totalMoney) els.totalMoney.textContent = targetBudget.toLocaleString('tr-TR');
        if (els.spentMoney) els.spentMoney.textContent = thisMonthSpent.toLocaleString('tr-TR');

        // Kalan: Bütçe - Harcanan (Bu Ay)
        const remaining = targetBudget - thisMonthSpent;
        if (els.remainingMoney) els.remainingMoney.textContent = remaining.toLocaleString('tr-TR');

        // Gauge (Doluluk Oranı - Bu Ay)
        if (els.budgetGauge) {
            let pct = 0;
            if (targetBudget > 0) {
                pct = Math.min(100, (thisMonthSpent / targetBudget) * 100);
            }
            els.budgetGauge.style.width = `${pct}%`;

            // Renk değişimi: %100'ü geçerse kırmızı
            if (totalSpent > targetBudget && targetBudget > 0) {
                els.budgetGauge.style.backgroundColor = '#e74c3c';
            } else {
                els.budgetGauge.style.backgroundColor = 'var(--primary-color)';
            }
        }

        if (els.currentBudgetDisplay) {
            els.currentBudgetDisplay.textContent = `${targetBudget.toLocaleString('tr-TR')} TL`;
        }

        // 3. Genel Durum (Circular Progress)
        const totalPct = totalItems > 0 ? Math.round((boughtItems / totalItems) * 100) : 0;
        const elTotalPct = document.getElementById('total-pct-badge');
        const elTotalCount = document.getElementById('total-items-count');
        const elTotalBought = document.getElementById('total-bought-count');

        if (elTotalPct) elTotalPct.textContent = `%${totalPct}`;
        if (elTotalCount) elTotalCount.textContent = totalItems;
        if (elTotalBought) elTotalBought.textContent = boughtItems;

        // SVG Circle
        const circle = document.getElementById('total-progress-ring');
        if (circle) {
            const radius = circle.r.baseVal.value;
            const circumference = radius * 2 * Math.PI;
            circle.style.strokeDasharray = `${circumference} ${circumference}`;
            const offset = circumference - (totalPct / 100) * circumference;
            circle.style.strokeDashoffset = offset;
        }

        // 4. Liste Detayları (Çeyiz / Bohça)
        const ceyizItems = items.filter(i => i.type === 'ceyiz');
        const ceyizCount = ceyizItems.length;
        const ceyizBought = ceyizItems.filter(i => i.isBought).length;

        const damatItems = items.filter(i => i.type === 'damat');
        const damatCount = damatItems.length;
        const damatBought = damatItems.filter(i => i.isBought).length;

        const barCeyiz = document.getElementById('stat-ceyiz-bar');
        const ratioCeyiz = document.getElementById('stat-ceyiz-ratio');
        if (barCeyiz) barCeyiz.style.width = `${ceyizCount > 0 ? (ceyizBought / ceyizCount) * 100 : 0}%`;
        if (ratioCeyiz) ratioCeyiz.textContent = `${ceyizBought}/${ceyizCount}`;

        const barDamat = document.getElementById('stat-damat-bar');
        const ratioDamat = document.getElementById('stat-damat-ratio');
        if (barDamat) barDamat.style.width = `${damatCount > 0 ? (damatBought / damatCount) * 100 : 0}%`;
        if (ratioDamat) ratioDamat.textContent = `${damatBought}/${damatCount}`;

        // 4b. Home Screen Action Cards / Summary Updates
        const homeTotalBoughtText = document.getElementById('home-total-bought-text');
        const homeTotalPct = document.getElementById('home-total-percent');
        const homeCeyizRatio = document.getElementById('home-ceyiz-ratio');
        const homeCeyizBar = document.getElementById('home-ceyiz-bar');
        const homeDamatRatio = document.getElementById('home-damat-ratio');
        const homeDamatBar = document.getElementById('home-damat-bar');

        if (homeTotalBoughtText) homeTotalBoughtText.textContent = `${boughtItems}/${totalItems} ürün alındı`;
        if (homeTotalPct) homeTotalPct.textContent = `%${totalPct}`;
        if (homeCeyizRatio) homeCeyizRatio.textContent = `${ceyizBought}/${ceyizCount}`;
        if (homeCeyizBar) homeCeyizBar.style.width = `${ceyizCount > 0 ? (ceyizBought / ceyizCount) * 100 : 0}%`;
        if (homeDamatRatio) homeDamatRatio.textContent = `${damatBought}/${damatCount}`;
        if (homeDamatBar) homeDamatBar.style.width = `${damatCount > 0 ? (damatBought / damatCount) * 100 : 0}%`;

        // 5. Kategori Dağılımı (Progress Bars)
        const catContainer = document.getElementById('category-breakdown-container');
        if (catContainer) {
            catContainer.innerHTML = ''; // Temizle
            const sortedCats = Object.entries(catAnalysis).sort(([, a], [, b]) => b - a); // En çok harcanan en üstte

            if (sortedCats.length === 0) {
                catContainer.innerHTML = '<div class="empty-chart-msg">Henüz veri yok</div>';
            } else {
                // En yüksek harcamayı %100 referans al
                const maxVal = sortedCats[0][1];

                sortedCats.forEach(([cat, val]) => {
                    const barPct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                    const row = document.createElement('div');
                    row.className = 'cat-stat-row';
                    row.style.marginBottom = '12px';
                    row.innerHTML = `
                    <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:4px;">
                        <span style="font-weight:500;">${cat}</span>
                        <span>₺${val.toLocaleString('tr-TR')}</span>
                    </div>
                    <div style="height:6px; background:rgba(0,0,0,0.05); border-radius:3px; overflow:hidden;">
                        <div style="width:${barPct}%; height:100%; background:var(--secondary-color); border-radius:3px;"></div>
                    </div>
                `;
                    catContainer.appendChild(row);
                });
            }
        }

        // 6. Son İşlemler (Recent Activity)
        const recentContainer = document.getElementById('recent-activity-list');
        if (recentContainer) {
            recentContainer.innerHTML = '';
            // Tarihe göre sırala (Yeni -> Eski)
            // Eğer date yoksa id (timestamp) kullan
            const sortedItems = [...items].sort((a, b) => {
                const dateA = a.date ? new Date(a.date) : new Date(a.id || 0);
                const dateB = b.date ? new Date(b.date) : new Date(b.id || 0);
                return dateB - dateA;
            }).slice(0, 5); // İlk 5

            if (sortedItems.length === 0) {
                recentContainer.innerHTML = '<div class="empty-state-sm">Henüz işlem yok</div>';
            } else {
                sortedItems.forEach(i => {
                    const itemEl = document.createElement('div');
                    itemEl.className = 'recent-item';
                    itemEl.style.cssText = 'display:flex; align-items:center; justify-content:space-between; padding:10px; border-bottom:1px solid var(--border-color);';

                    const icon = getCategoryIcon(i.category);
                    const dateStr = i.date ? new Date(i.date).toLocaleDateString('tr-TR') : '-';
                    const hasPhoto = i.photos && i.photos.length > 0;

                    const avatarHtml = hasPhoto
                        ? `<img src="${i.photos[0]}" alt="" style="width:32px; height:32px; border-radius:8px; object-fit:cover; flex-shrink:0; box-shadow: 0 1px 4px rgba(0,0,0,0.15);">`
                        : `<div style="width:32px; height:32px; background:rgba(var(--primary-rgb),0.1); border-radius:50%; display:flex; align-items:center; justify-content:center; color:var(--primary-color); flex-shrink:0;">
                            <i class="fas ${icon}"></i>
                          </div>`;

                    itemEl.innerHTML = `
                    <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                        ${avatarHtml}
                        <div style="min-width:0;">
                            <div style="font-weight:500; font-size:0.95rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${i.name}</div>
                            <div style="font-size:0.75rem; color:var(--text-light);">${dateStr}</div>
                        </div>
                    </div>
                    <div style="text-align:right; flex-shrink:0;">
                        <div style="font-weight:600; color:${i.isBought ? '#27ae60' : 'var(--text-color)'};">
                            ${i.price > 0 ? '₺' + i.price.toLocaleString('tr-TR') : '-'}
                        </div>
                        ${i.isBought ? '<i class="fas fa-check-circle" style="color:#27ae60; font-size:0.8rem;"></i>' : ''}
                    </div>
                `;
                    recentContainer.appendChild(itemEl);
                });
            }
        }
    }

    // Bütçe Dinleyicileri
    function setupBudgetListeners() {
        console.log("💰 Bütçe dinleyicileri kuruluyor...");
        const btnEdit = document.getElementById('btn-edit-budget');
        const modal = document.getElementById('modal-budget-editor');
        const input = document.getElementById('budget-input');
        const btnSave = document.getElementById('btn-save-budget');

        // "Düzenle" ikonuna tıklayınca
        if (btnEdit && modal) {
            btnEdit.addEventListener('click', () => {
                if (input) input.value = settings.budget || '';
                if (window.openModal) window.openModal('modal-budget-editor');
            });
        }

        // "Hesap Makinesi" Butonları
        const btnAdd = document.getElementById('btn-budget-add');
        const btnSub = document.getElementById('btn-budget-sub');

        if (btnAdd && input) {
            btnAdd.addEventListener('click', () => {
                const current = parseFloat(settings.budget) || 0;
                const val = parseFloat(input.value) || 0;
                settings.budget = current + val;
                updateStats(); // Modal içindeki display güncellenir
                input.value = ''; // Inputu temizle
                if (window.showToast) window.showToast('Tutar eklendi');
            });
        }

        if (btnSub && input) {
            btnSub.addEventListener('click', () => {
                const current = parseFloat(settings.budget) || 0;
                const val = parseFloat(input.value) || 0;
                settings.budget = Math.max(0, current - val); // Negatif olmasın
                updateStats();
                input.value = '';
                if (window.showToast) window.showToast('Tutar çıkarıldı');
            });
        }

        // Kaydet Butonu
        if (btnSave && modal) {
            // Clone to remove old listeners if any
            const newBtn = btnSave.cloneNode(true);
            btnSave.parentNode.replaceChild(newBtn, btnSave);

            newBtn.addEventListener('click', () => {
                // Eğer input doluysa ve + / - basmadıysa direkt set et
                if (input && input.value !== '') {
                    settings.budget = parseFloat(input.value) || 0;
                }
                saveData();
                updateStats();
                if (window.closeModalHelper) window.closeModalHelper(modal);
                if (window.showToast) window.showToast('Bütçe güncellendi 💰');
            });
        }

        // Bütçe Sıfırla Butonu
        const btnReset = document.getElementById('btn-reset-budget');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                window.showConfirm(
                    'Bütçeyi Sıfırla',
                    'Bu ayki bütçeyi sıfırlamak istediğinize emin misiniz? Bu işlem geri alınamaz.',
                    () => {
                        window.resetBudget();
                    }
                );
            });
        }
    }

    // --- Spending History Logic ---
    function formatMonthYear(monthStr) {
        // monthStr: "2026-02" -> "Şubat 2026"
        const [year, month] = monthStr.split('-');
        const monthNames = [
            "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
            "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
        ];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    }

    window.renderSpendingHistory = function () {
        const container = document.getElementById('history-list-container');
        if (!container) return;

        container.innerHTML = '';

        // 1. Mevcut (Aktif) Ay Verilerini Al
        const currentMonth = getCurrentMonth();
        const thisMonthBudget = settings.budget || 0;
        const thisMonthSpent = items.filter(i => i.isBought && i.purchaseMonth === currentMonth)
            .reduce((sum, i) => sum + (i.price || 0), 0);

        // 2. Arşivlenmiş Verileri Al
        const historyData = settings.history || {};

        // YENİ: Itemlardan gelen ayları da keşfet (Fallback)
        const itemMonths = items
            .filter(i => i.isBought && i.purchaseMonth)
            .map(i => i.purchaseMonth);

        const allMonths = new Set([...Object.keys(historyData), ...itemMonths]);
        const archivedMonths = Array.from(allMonths).sort().reverse();

        // 3. Birleştir (Mevcut ayı en başa koy)
        let displayList = [];

        // Mevcut ayı ekle
        displayList.push({
            id: currentMonth,
            label: formatMonthYear(currentMonth) + " (Bu Ay - Aktif)",
            budget: thisMonthBudget,
            spent: thisMonthSpent,
            isActive: true
        });

        // Arşivdekileri ekle
        archivedMonths.forEach(m => {
            if (m === currentMonth) return; // Çakışma olmasın

            let monthBudget = 0;
            let monthSpent = 0;

            if (historyData[m]) {
                monthBudget = historyData[m].budget || 0;
                monthSpent = historyData[m].spent || 0;
            } else {
                // History'de yoksa anlık hesapla
                monthSpent = items
                    .filter(i => i.isBought && i.purchaseMonth === m)
                    .reduce((sum, i) => sum + (i.price || 0), 0);
                monthBudget = 0;
            }

            displayList.push({
                id: m,
                label: formatMonthYear(m),
                budget: monthBudget,
                spent: monthSpent,
                isActive: false
            });
        });

        // NOT: Hiç veri yoksa (Sıfır kurulum ise) kullanıcı butonla manuel eklemiş gibi seed atalım
        // YENİ: Otomatik seed mantığı kaldırıldı. Boşsa boş kalsın.
        // if (displayList.length === 1 && ...) { seedHistoryData(false); }

        if (displayList.length === 1 && displayList[0].spent === 0 && displayList[0].budget === 0 && !Object.keys(historyData).length) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem 1.5rem; color: var(--text-light); border: 2px dashed var(--border-color); border-radius: 20px; margin: 1rem 0;">
                    <div style="font-size: 3.5rem; margin-bottom: 1.5rem; opacity: 0.2;">
                        <i class="fas fa-calendar-alt"></i>
                    </div>
                    <p style="font-size: 1rem; font-weight: 500; margin: 0;">Henüz arşivlenmiş bir harcama geçmişi bulunmuyor.</p>
                    <p style="font-size: 0.85rem; margin-top: 8px; opacity: 0.7;">Ay sonunda bütçeniz otomatik olarak buraya arşivlenecektir.</p>
                </div>
            `;
            return;
        }


        displayList.forEach(data => {
            const pct = data.budget > 0 ? Math.min(100, (data.spent / data.budget) * 100) : 0;
            const isOverMode = data.spent > data.budget && data.budget > 0;

            const radius = 28;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (pct / 100) * circumference;

            const itemEl = document.createElement('div');
            itemEl.className = 'history-item-card modern';
            itemEl.style.cssText = `
                display: grid;
                grid-template-columns: 1fr 80px;
                background: var(--card-bg);
                border-radius: 20px;
                padding: 1.25rem;
                margin-bottom: 1rem;
                box-shadow: 0 4px 20px rgba(0,0,0,0.06);
                border: 1px solid ${data.isActive ? 'var(--primary-color)' : 'var(--border-color)'};
                align-items: center;
                position: relative;
            `;

            if (data.isActive) {
                const badge = document.createElement('div');
                badge.style.cssText = `
                    position: absolute; top: -10px; right: 20px; background: var(--primary-color); 
                    color: white; padding: 2px 10px; border-radius: 10px; font-size: 0.7rem; font-weight: 700;
                `;
                badge.textContent = 'AKTİF AY';
                itemEl.appendChild(badge);
            }

            itemEl.innerHTML += `
                <div class="history-info">
                    <h5 style="margin: 0 0 4px 0; font-size: 1.05rem; font-weight: 700;">${data.label}</h5>
                    <div style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 8px;">
                        <span>Kayıtlı bütçe: ₺${data.budget.toLocaleString('tr-TR')}</span>
                    </div>
                    <div style="font-size: 0.95rem; font-weight: 600; color: ${isOverMode ? '#e74c3c' : 'var(--primary-color)'};">
                        Topl. Harcama: ₺${data.spent.toLocaleString('tr-TR')}
                    </div>
                </div>
                <div class="history-progress" style="position: relative; display: flex; justify-content: center; align-items: center;">
                    <svg width="64" height="64" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="${radius}" stroke="var(--border-color)" stroke-width="5" fill="none" />
                        <circle cx="32" cy="32" r="${radius}" stroke="${isOverMode ? '#e74c3c' : 'var(--primary-color)'}" stroke-width="5" fill="none" 
                            stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round" style="transition: stroke-dashoffset 1s ease;" />
                    </svg>
                    <span style="position: absolute; font-size: 0.75rem; font-weight: 700; color: var(--text-main);">%${Math.round(pct)}</span>
                </div>
            `;
            container.appendChild(itemEl);
        });
    };

    // TEST VERİSİ EKLEME (SEED) - DİNAMİK TARİHLİ
    /* Demo Data function removed. */

    function setupHistoryListeners() {
        const btn = document.getElementById('btn-show-history');
        if (btn) {
            btn.addEventListener('click', () => {
                window.renderSpendingHistory();
                window.openModal('modal-spending-history');
            });
        }
    }

    // --- Custom Confirm Modal Logic ---
    window.showConfirm = function (title, message, onConfirm) {
        const modal = document.getElementById('modal-confirm');
        const titleEl = document.getElementById('confirm-title');
        const msgEl = document.getElementById('confirm-message');
        const btnOk = document.getElementById('btn-confirm-ok');
        const btnCancel = document.getElementById('btn-confirm-cancel');

        if (!modal || !titleEl || !msgEl || !btnOk || !btnCancel) return;

        titleEl.textContent = title;
        msgEl.textContent = message;

        const closeConfirm = () => {
            window.closeModalHelper(modal);
        };

        // Re-bind listeners
        const newBtnOk = btnOk.cloneNode(true);
        btnOk.parentNode.replaceChild(newBtnOk, btnOk);

        const newBtnCancel = btnCancel.cloneNode(true);
        btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);

        newBtnOk.addEventListener('click', () => {
            closeConfirm();
            if (onConfirm) onConfirm();
        });

        newBtnCancel.addEventListener('click', closeConfirm);

        window.openModal('modal-confirm');
    };

    // Global Reset Fonksiyonu
    window.resetBudget = function () {
        console.log("🔄 Bütçe sıfırlama işlemi başladı...");
        const currentMonth = getCurrentMonth();
        settings.budget = 0; // 0 yaparak bütçe limitini sıfırla

        // Bu ay alınan ürünlerin purchaseMonth bilgisini temizle (Harcama sıfırlansın)
        items.forEach(i => {
            if (i.purchaseMonth === currentMonth) {
                i.purchaseMonth = null;
            }
        });

        saveData();
        updateStats();
        renderApp();
        const input = document.getElementById('budget-input');
        if (input) input.value = '';
        if (window.showToast) window.showToast('Bütçe ve bu ayki harcamalar sıfırlandı 🔄');
    };

    // Ana Render Fonksiyonu
    function renderApp() {
        renderList('ceyiz');
        renderList('damat');
        updateStats();

        // Countdowns
        updateCountdowns();
    }

    // =========================================================================
    // 4. NAVİGASYON (TAB SİSTEMİ)
    // =========================================================================
    window.switchTab = function (tabName) {
        window.scrollTo(0, 0); // Her sekme geçişinde en üste at
        console.log(`🔄 Tab Değişiyor: ${tabName}`);

        // 1. Footer Navigasyonunu Güncelle
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.remove('active');
            if (el.dataset.target === tabName) el.classList.add('active');
        });

        // 2. Sayfaları (Sectionları) Gizle/Göster
        document.querySelectorAll('.swipe-section').forEach(sec => {
            sec.style.display = 'none'; // Önce hepsini gizle
        });

        const targetSection = document.getElementById(`${tabName}-section`);
        if (targetSection) {
            targetSection.style.display = 'block';
            console.log(`✅ ${tabName}-section gösterildi.`);
        } else {
            console.error(`❌ ${tabName}-section bulunamadı! ID'leri kontrol et.`);
        }

        currentTab = tabName;

        // Listeyi yeniden render et (veri değişmiş olabilir)
        if (tabName === 'ceyiz' || tabName === 'damat') {
            renderList(tabName);
        }

        // FAB (Floating Action Button) Görünürlük Kontrolü
        const fab = document.querySelector('.fab');
        if (fab) {
            if (tabName === 'home' || tabName === 'stats') {
                fab.style.display = 'none';
            } else {
                fab.style.display = 'flex';
            }
        }
    };


    // =========================================================================
    // 5. GLOBAL AKSİYONLAR (Window'a Bağlama)
    // =========================================================================

    // Ürün Durumu Değiştirme
    window.toggleItemStatus = function (id, isChecked) {
        const item = items.find(i => i.id === id);
        if (item) {
            item.isBought = isChecked;
            item.purchaseMonth = isChecked ? getCurrentMonth() : null;
            saveData();
            renderList(item.type);
            updateStats();
        }
    };

    // Ürün Silme
    // Ürün Silme & Geri Alma (Undo)
    let lastDeletedItem = null;
    let undoTimeout = null;

    window.deleteItem = function (id) {
        const index = items.findIndex(i => i.id === id);
        if (index === -1) return;

        // Yedeği Al
        lastDeletedItem = { item: items[index], index: index };

        // Sil
        items.splice(index, 1);
        saveData();
        renderApp();
        console.log("🗑️ Ürün silindi.");

        // Undo Toast Göster
        showUndoToast("Ürün silindi.", () => {
            if (lastDeletedItem) {
                items.splice(lastDeletedItem.index, 0, lastDeletedItem.item);
                saveData();
                renderApp();
                lastDeletedItem = null;
                if (window.showToast) window.showToast("♻️ Ürün geri getirildi!");
            }
        });
    };

    function showUndoToast(message, onUndo) {
        // Varsa eski toast'u kaldır
        const existing = document.getElementById('toast-undo-container');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'toast-undo-container';
        toast.className = 'toast-container'; // Existing CSS class
        // Override styles for positioning if needed, or rely on CSS
        toast.style.position = 'fixed';
        toast.style.bottom = '90px'; // Fab üstünde
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.zIndex = '10000';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.animation = 'fadeInUp 0.3s ease forwards';

        toast.innerHTML = `
            <span>${message}</span>
            <button id="btn-undo-action" style="
                background: rgba(255,255,255,0.25); 
                border: 1px solid rgba(255,255,255,0.4);
                color: white; 
                padding: 4px 12px; 
                border-radius: 20px; 
                margin-left: 12px; 
                cursor: pointer;
                font-weight: 600;
                font-size: 0.9rem;
                display: flex;
                align-items: center;
                gap: 5px;
            ">
                <i class="fas fa-undo"></i> Geri Al
            </button>
            <button id="btn-dismiss-undo" style="
                background: transparent;
                border: none;
                color: rgba(255,255,255,0.8);
                margin-left: 8px;
                font-size: 1.2rem;
                cursor: pointer;
            ">&times;</button>
        `;

        document.body.appendChild(toast);

        // Auto Dismiss
        if (undoTimeout) clearTimeout(undoTimeout);
        undoTimeout = setTimeout(() => {
            if (toast && toast.parentNode) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(-50%) translateY(20px)';
                toast.style.transition = 'all 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000); // 5 saniye bekle

        // Listeners
        document.getElementById('btn-undo-action').addEventListener('click', () => {
            onUndo();
            toast.remove();
            clearTimeout(undoTimeout);
        });

        document.getElementById('btn-dismiss-undo').addEventListener('click', () => {
            toast.remove();
            clearTimeout(undoTimeout);
        });
    }

    // Ürün Detay Değişkeni (Global ID takibi için)
    let currentDetailId = null;
    let currentItemPhotos = []; // Mevcut düzenlenen ürünün fotoğrafları

    // Ürün Detaylarını Göster
    window.showItemDetails = function (id) {
        const item = items.find(i => i.id === id);
        if (!item) return;

        currentDetailId = id; // Global takip set et

        const modal = document.getElementById('modal-item-details');
        if (!modal) return;

        // Bilgileri Doldur
        document.getElementById('detail-name').textContent = item.name;
        document.getElementById('detail-category-name').textContent = item.category;
        const iconElem = document.getElementById('detail-category-icon');
        if (iconElem) iconElem.className = `fas ${getCategoryIcon(item.category)}`;

        document.getElementById('detail-quantity').textContent = item.quantity || 1;
        document.getElementById('detail-price').textContent = item.price ? `₺${item.price.toLocaleString()}` : '₺0';

        const notesElem = document.getElementById('detail-notes');
        if (notesElem) {
            notesElem.textContent = item.note || 'Henüz bir not eklenmemiş...';
            notesElem.style.opacity = item.note ? '1' : '0.5';

            // Editör modundaysa sıfırla
            window.cancelQuickNoteEdit && window.cancelQuickNoteEdit();
        }

        // Fotoğrafları Doldur
        const detailPhotosList = document.getElementById('detail-photos-list'); // Eğer bu ID index.html'de yoksa eklemelisin
        if (detailPhotosList) {
            detailPhotosList.innerHTML = '';
            if (item.photos && item.photos.length > 0) {
                detailPhotosList.classList.remove('hidden');
                item.photos.forEach((photo, pIdx) => {
                    const img = document.createElement('img');
                    img.src = photo;
                    img.className = 'detail-photo-thumbnail';
                    img.addEventListener('click', () => {
                        window.openImageViewer(item.photos, pIdx);
                    });
                    detailPhotosList.appendChild(img);
                });
            } else {
                detailPhotosList.classList.add('hidden');
            }
        }

        // Modalı Aç
        console.log("🔍 Detay modalı açılıyor (ID:", id, "):", item.name);
        window.openModal('modal-item-details');
    };

    // Detay Modalından Düzenlemeye Geç (Global Fonksiyon)
    window.handleDetailEdit = function (e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!currentDetailId) {
            console.error("❌ Düzenlenecek ürün ID'si bulunamadı!");
            return;
        }

        const item = items.find(i => i.id === currentDetailId);
        if (!item) {
            console.error("❌ Ürün bulunamadı!");
            return;
        }

        console.log("📝 Detay modalından düzenleme paneline geçiliyor. ID:", currentDetailId);

        const detailModal = document.getElementById('modal-item-details');
        window.closeModalHelper(detailModal);

        // Kısa bir gecikme ile editörü aç
        setTimeout(() => {
            if (typeof window.openQuickAddModal === 'function') {
                window.openQuickAddModal(item.type, currentDetailId);
            } else {
                console.error("❌ window.openQuickAddModal bulunamadı!");
            }
        }, 150);
    };

    // --- QUICK NOTE EDIT FUNCTIONS ---
    window.startQuickNoteEdit = function () {
        if (!currentDetailId) return;
        const item = items.find(i => i.id === currentDetailId);
        if (!item) return;

        const noteText = document.getElementById('detail-notes');
        const editor = document.getElementById('quick-note-editor');
        const input = document.getElementById('quick-note-input');

        if (noteText && editor && input) {
            noteText.style.display = 'none';
            editor.style.display = 'flex';
            editor.classList.remove('hidden');
            input.value = item.note || '';
            input.focus();

            // Container stilini güncelle (tıklanabilir hissini geçici olarak kaldır)
            document.getElementById('detail-notes-container').style.cursor = 'default';
        }
    };

    window.cancelQuickNoteEdit = function () {
        const noteText = document.getElementById('detail-notes');
        const editor = document.getElementById('quick-note-editor');

        if (noteText && editor) {
            noteText.style.display = 'block';
            editor.style.display = 'none';
            editor.classList.add('hidden');
            document.getElementById('detail-notes-container').style.cursor = 'pointer';
        }
    };

    window.saveQuickNote = function () {
        if (!currentDetailId) return;
        const itemIdx = items.findIndex(i => i.id === currentDetailId);
        if (itemIdx === -1) return;

        const input = document.getElementById('quick-note-input');
        const newNote = input ? input.value.trim() : '';

        // Veriyi güncelle
        items[itemIdx].note = newNote;

        // Kaydet ve Arayüzü Güncelle
        saveData();

        // Detay görünümünü güncelle
        const noteText = document.getElementById('detail-notes');
        if (noteText) {
            noteText.textContent = newNote || 'Henüz bir not eklenmemiş...';
            noteText.style.opacity = newNote ? '1' : '0.5';
        }

        // Editörü kapat
        window.cancelQuickNoteEdit();

        // Ana listeyi de sessizce güncelle (eğer render gerekiyorsa)
        renderApp();

        console.log("📝 Not hızlıca güncellendi:", newNote);
        showToast("Not kaydedildi", 2000);
    };

    // Modal Açma / Kapama Helpers
    window.openModal = function (id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('hidden');
            setTimeout(() => modal.classList.add('active'), 10);
            document.body.style.overflow = 'hidden';

            // Eğer kategori modalıysa
            if (id === 'modal-categories') {
                // renderCategories() // Eklenecekse
            }
        }
    };

    window.closeModalHelper = function (modal) {
        if (!modal) return;
        modal.classList.remove('active');
        setTimeout(() => modal.classList.add('hidden'), 300);
        document.body.style.overflow = '';
    };

    // YENİ: Global kapatma fonksiyonu (HTML onclick için)
    window.closeModal = function (id) {
        const modal = document.getElementById(id);
        if (modal) window.closeModalHelper(modal);
    };


    // =========================================================================
    // 6. EVENT LISTENERS (OLAY DİNLEYİCİLERİ)
    // =========================================================================

    // A. Navigasyon Tıklamaları (Delegation - En Güvenlisi)
    document.body.addEventListener('click', (e) => {
        // 1. Bottom Nav Linkleri
        const navLink = e.target.closest('.nav-item');
        if (navLink) {
            e.preventDefault(); // href="#" engelle
            const target = navLink.dataset.target;
            if (target) switchTab(target);
        }

        // 2. Home Action Kartları (Ortadaki Büyük Butonlar)
        const actionCard = e.target.closest('.home-action-card');
        if (actionCard) {
            const target = actionCard.dataset.nav; // HTML'de data-nav var
            if (target) switchTab(target);
        }

        // 3. Modal Kapatma Düğmeleri ve Arka Plan (Boşluk)
        if (e.target.closest('.close-modal') || e.target.closest('.close-modal-sheet') || e.target.classList.contains('modal-backdrop') || e.target.classList.contains('modal')) {
            const modal = e.target.closest('.modal');
            // Eğer içerik dışındaki boşluğa (modal container) tıklandıysa kapat
            if (modal) window.closeModalHelper(modal);
        }
    });

    // B. FAB (Ekleme Butonu)
    const fab = document.getElementById('fab-add');
    if (fab) {
        console.log("✅ FAB Butonu bulundu, dinleyici ekleniyor.");
        fab.addEventListener('click', () => {
            console.log("➕ FAB Tıklandı!");
            // Hangi tabdaysak ona ekle, home'daysa sor veya varsayılan çeyiz
            let type = currentTab;
            if (type === 'home' || type === 'stats') {
                type = 'ceyiz'; // Varsayılan
                console.log("ℹ️ Ana sayfada tıklandı, varsayılan 'ceyiz' seçildi.");
            }

            // Modalı aç
            try {
                if (typeof window.openQuickAddModal === 'function') {
                    window.openQuickAddModal(type);
                } else {
                    // Fallback: Fonksiyon scope sorunu varsa direkt çağır
                    openQuickAddModal(type);
                }
            } catch (err) {
                console.error("❌ FAB Hatası:", err);
                alert("Ekleme ekranı açılırken hata oluştu: " + err.message);
            }
        });
    } else {
        console.error("❌ FAB Butonu (#fab-add) bulunamadı!");
    }

    // C. Ürün Ekleme / Düzenleme Modalı İşlemleri
    // Global erişim için window'a ata
    window.openQuickAddModal = function (preselectedType, itemId = null) {
        const modal = document.getElementById('modal-item-editor');
        if (!modal) {
            console.error("❌ Modal bulunamadı: modal-item-editor");
            return;
        }

        const type = preselectedType || 'ceyiz';

        // Formu temizle veya doldur
        const idInp = document.getElementById('editor-id');
        const nameInp = document.getElementById('editor-name');
        const catSelect = document.getElementById('editor-category');
        const qtyInp = document.getElementById('editor-qty');
        const priceInp = document.getElementById('editor-price');
        const noteInp = document.getElementById('editor-note');
        const title = document.getElementById('editor-title');
        const boughtCheck = document.getElementById('editor-bought');

        // Kategori Seçeneklerini Doldur
        if (catSelect) {
            catSelect.innerHTML = '<option value="" disabled selected>Kategori Seçiniz</option>';
            const cats = defaultCategories[type].concat(userCategories[type] || []);
            cats.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c;
                catSelect.appendChild(opt);
            });
            // "Yeni Kategori Ekle" seçeneği
            const newOpt = document.createElement('option');
            newOpt.value = "new-cat-option";
            newOpt.textContent = "➕ Yeni Kategori...";
            newOpt.style.fontWeight = "bold";
            newOpt.style.color = "var(--primary-color)";
            catSelect.appendChild(newOpt);
        }

        if (itemId) {
            // DÜZENLEME MODU
            const item = items.find(i => i.id === itemId);
            if (item) {
                if (idInp) idInp.value = item.id;
                if (nameInp) nameInp.value = item.name;
                if (catSelect) catSelect.value = item.category;
                if (qtyInp) qtyInp.value = item.quantity;
                if (priceInp) priceInp.value = item.price;
                if (noteInp) noteInp.value = item.note || '';
                if (title) title.textContent = "Ürünü Düzenle ✏️";
                if (boughtCheck) boughtCheck.checked = item.isBought;
                modal.dataset.mode = 'edit';

                // Fotoğrafları yükle
                currentItemPhotos = [...(item.photos || [])];
                renderPhotoGrid();
            }
        } else {
            // YENİ EKLEME MODU
            if (idInp) idInp.value = '';
            if (nameInp) nameInp.value = '';
            if (catSelect) catSelect.value = '';
            if (qtyInp) qtyInp.value = '1';
            if (priceInp) priceInp.value = '';
            if (noteInp) noteInp.value = '';
            if (title) title.textContent = "Yeni Ürün Ekle ✨";
            if (boughtCheck) boughtCheck.checked = false;
            modal.dataset.mode = 'add';

            // Fotoğrafları sıfırla
            currentItemPhotos = [];
            renderPhotoGrid();
        }

        // Type bilgisini sakla
        modal.dataset.type = type;

        window.openModal('modal-item-editor');
    }

    // --- FOTOĞRAF GÖRÜNTÜLEYİCİ & PINCH-TO-ZOOM ---
    let zoomState = {
        scale: 1,
        lastScale: 1,
        posX: 0,
        posY: 0,
        lastPosX: 0,
        lastPosY: 0,
        initialDist: 0,
        isDragging: false,
        lastTouchTime: 0
    };

    let viewerPhotos = [];
    let viewerIndex = 0;

    let viewerTrackX = 0;
    let currentViewerPhotos = [];
    let currentViewerIndex = 0;
    let isViewerDragging = false;
    let viewerStartTouchX = 0;
    let viewerStartTouchY = 0;

    window.openImageViewer = function (photos, startIndex = 0) {
        currentViewerPhotos = Array.isArray(photos) ? photos : [photos];
        currentViewerIndex = startIndex;

        const track = document.getElementById('viewer-track');
        if (!track) return;

        // Clear and rebuild slides
        track.innerHTML = '';
        currentViewerPhotos.forEach((src, idx) => {
            const slide = document.createElement('div');
            slide.className = 'viewer-slide';
            slide.innerHTML = `
                <div class="viewer-image-wrapper" id="zoom-wrapper-${idx}" data-index="${idx}">
                    <img src="${src}" alt="Fotoğraf ${idx + 1}" draggable="false">
                </div>
            `;
            track.appendChild(slide);
        });

        updateViewerUI(true); // true means immediate jump
        window.openModal('modal-image-viewer');
    };

    function updateViewerUI(immediate = false) {
        const track = document.getElementById('viewer-track');
        const dynamicBg = document.getElementById('viewer-dynamic-bg');
        const indicators = document.getElementById('viewer-indicators');

        if (!track) return;

        // Position Track
        const offset = -currentViewerIndex * 100;
        track.style.transition = immediate ? 'none' : 'transform 0.4s cubic-bezier(0.1, 0, 0.3, 1)';
        track.style.transform = `translateX(${offset}%)`;

        // Update Dynamic BG
        if (dynamicBg && currentViewerPhotos[currentViewerIndex]) {
            dynamicBg.style.backgroundImage = `url(${currentViewerPhotos[currentViewerIndex]})`;
        }

        // Render Indicators
        if (indicators) {
            indicators.innerHTML = '';
            if (currentViewerPhotos.length > 1) {
                currentViewerPhotos.forEach((_, i) => {
                    const dot = document.createElement('div');
                    dot.className = `indicator-dot ${i === currentViewerIndex ? 'active' : ''}`;
                    indicators.appendChild(dot);
                });
            }
        }
    }

    function setupViewerListeners() {
        const modal = document.getElementById('modal-image-viewer');
        const track = document.getElementById('viewer-track');
        if (!modal || !track) return;

        let startX = 0;
        let startY = 0;
        let isPanning = false;
        let isSwiping = false;

        // Per-slide zoom states (store by index)
        const zoomStates = {};

        function getZoomState(idx) {
            if (!zoomStates[idx]) {
                zoomStates[idx] = {
                    scale: 1, posX: 0, posY: 0,
                    lastPosX: 0, lastPosY: 0, lastScale: 1,
                    isDragging: false, lastTap: 0,
                    pinchMidX: 0, pinchMidY: 0
                };
            }
            return zoomStates[idx];
        }

        // Pan sınırlarını hesapla ve uygula
        function clampPan(state, idx) {
            const wrapper = document.getElementById(`zoom-wrapper-${idx}`);
            if (!wrapper || state.scale <= 1) {
                state.posX = 0;
                state.posY = 0;
                return;
            }

            const slide = wrapper.closest('.viewer-slide');
            if (!slide) return;

            const slideW = slide.clientWidth;
            const slideH = slide.clientHeight;

            // Görüntünün gerçek boyutlarını hesapla (object-fit: contain mantığıyla)
            const img = wrapper.querySelector('img');
            if (!img) return;

            const imgNatW = img.naturalWidth || slideW;
            const imgNatH = img.naturalHeight || slideH;
            const imgAspect = imgNatW / imgNatH;
            const slideAspect = slideW / slideH;

            let renderedW, renderedH;
            if (imgAspect > slideAspect) {
                renderedW = slideW;
                renderedH = slideW / imgAspect;
            } else {
                renderedH = slideH;
                renderedW = slideH * imgAspect;
            }

            // Zoom uygulandığında genişleme miktarı
            const scaledW = renderedW * state.scale;
            const scaledH = renderedH * state.scale;

            // Ekrana sığmayan kısım kadar kaydırılabilir
            const maxPanX = Math.max(0, (scaledW - slideW) / 2);
            const maxPanY = Math.max(0, (scaledH - slideH) / 2);

            state.posX = Math.min(maxPanX, Math.max(-maxPanX, state.posX));
            state.posY = Math.min(maxPanY, Math.max(-maxPanY, state.posY));
        }

        function applyZoomTransform(idx) {
            const wrapper = document.getElementById(`zoom-wrapper-${idx}`);
            if (!wrapper) return;
            const state = getZoomState(idx);
            wrapper.style.transition = state.isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.1, 0, 0.3, 1)';
            wrapper.style.transform = `translate(${state.posX}px, ${state.posY}px) scale(${state.scale})`;
        }

        modal.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                isPanning = false;
                isSwiping = false;
                const state = getZoomState(currentViewerIndex);
                state.initialDist = Math.hypot(
                    e.touches[0].pageX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                );
                state.lastScale = state.scale;
                state.lastPosX = state.posX;
                state.lastPosY = state.posY;

                // Pinch odak noktası (iki parmağın ortası)
                state.pinchMidX = (e.touches[0].pageX + e.touches[1].pageX) / 2;
                state.pinchMidY = (e.touches[0].pageY + e.touches[1].pageY) / 2;

            } else if (e.touches.length === 1) {
                startX = e.touches[0].pageX;
                startY = e.touches[0].pageY;
                const state = getZoomState(currentViewerIndex);
                state.lastTouchX = startX - state.posX;
                state.lastTouchY = startY - state.posY;
                state.isDragging = true;

                // Double Tap Check — zoom toggle
                const now = Date.now();
                if (now - (state.lastTap || 0) < 300) {
                    if (state.scale > 1) {
                        // Sıfırla
                        state.scale = 1;
                        state.posX = 0;
                        state.posY = 0;
                    } else {
                        // Dokunulan noktaya zoom yap
                        state.scale = 2.5;
                        const wrapper = document.getElementById(`zoom-wrapper-${currentViewerIndex}`);
                        if (wrapper) {
                            const rect = wrapper.getBoundingClientRect();
                            const cx = rect.left + rect.width / 2;
                            const cy = rect.top + rect.height / 2;
                            // Dokunulan nokta merkeze gelsin
                            state.posX = (cx - startX) * (state.scale - 1);
                            state.posY = (cy - startY) * (state.scale - 1);
                        }
                        clampPan(state, currentViewerIndex);
                    }
                    applyZoomTransform(currentViewerIndex);
                    state.lastTap = 0;
                    state.isDragging = false; // çift tıklama sonrası sürükleme olmasın
                } else {
                    state.lastTap = now;
                }
            }
        }, { passive: false });

        modal.addEventListener('touchmove', (e) => {
            const state = getZoomState(currentViewerIndex);

            if (e.touches.length === 2) {
                e.preventDefault();
                const newDist = Math.hypot(
                    e.touches[0].pageX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                );
                const newScale = Math.min(Math.max(1, (newDist / state.initialDist) * state.lastScale), 4);

                // Yeni pinch ortası
                const newMidX = (e.touches[0].pageX + e.touches[1].pageX) / 2;
                const newMidY = (e.touches[0].pageY + e.touches[1].pageY) / 2;

                // Focal point bazlı pozisyon hesabı:
                // Pinch ortasının wrapper'daki konumu aynı kalmalı
                const scaleRatio = newScale / state.lastScale;
                state.posX = newMidX - state.pinchMidX + state.lastPosX * scaleRatio;
                state.posY = newMidY - state.pinchMidY + state.lastPosY * scaleRatio;
                state.scale = newScale;

                clampPan(state, currentViewerIndex);
                applyZoomTransform(currentViewerIndex);

            } else if (e.touches.length === 1 && state.isDragging) {
                const moveX = e.touches[0].pageX;
                const moveY = e.touches[0].pageY;
                const dx = moveX - startX;
                const dy = moveY - startY;

                if (state.scale > 1) {
                    // Zoom yapılmış halde sürükleme (pan)
                    e.preventDefault();
                    isPanning = true;
                    state.posX = moveX - state.lastTouchX;
                    state.posY = moveY - state.lastTouchY;
                    clampPan(state, currentViewerIndex);
                    applyZoomTransform(currentViewerIndex);
                } else {
                    // Slaytlar arası kaydırma (swipe)
                    if (Math.abs(dx) > Math.abs(dy) * 1.5) {
                        e.preventDefault();
                        isSwiping = true;
                        track.classList.add('is-dragging');
                        const baseOffset = -currentViewerIndex * track.offsetWidth;
                        track.style.transform = `translateX(${baseOffset + dx}px)`;
                    }
                }
            }
        }, { passive: false });

        modal.addEventListener('touchend', (e) => {
            const state = getZoomState(currentViewerIndex);
            state.isDragging = false;
            track.classList.remove('is-dragging');

            if (isSwiping) {
                const dx = e.changedTouches[0].pageX - startX;
                const threshold = track.offsetWidth / 5;

                if (Math.abs(dx) > threshold) {
                    if (dx > 0 && currentViewerIndex > 0) currentViewerIndex--;
                    else if (dx < 0 && currentViewerIndex < currentViewerPhotos.length - 1) currentViewerIndex++;
                }
                updateViewerUI();
                isSwiping = false;
            }

            // Zoom 1'in altına düşmüşse veya çok yakınsa sıfırla (snap)
            if (state.scale <= 1.05) {
                state.scale = 1;
                state.posX = 0;
                state.posY = 0;
                state.lastScale = 1;
                applyZoomTransform(currentViewerIndex);
            } else {
                // Zoom korunsun, sadece sınırları kontrol et
                clampPan(state, currentViewerIndex);
                applyZoomTransform(currentViewerIndex);
            }
            isPanning = false;
        });

        // Close triggers — zoom sıfırlama
        modal.querySelectorAll('.viewer-close-trigger').forEach(btn => {
            btn.addEventListener('click', () => {
                // Tüm zoom state'lerini sıfırla
                Object.keys(zoomStates).forEach(k => {
                    zoomStates[k].scale = 1;
                    zoomStates[k].posX = 0;
                    zoomStates[k].posY = 0;
                    zoomStates[k].lastScale = 1;
                    const w = document.getElementById(`zoom-wrapper-${k}`);
                    if (w) w.style.transform = '';
                });
                window.closeModalHelper(modal);
            });
        });

        // Modal backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('viewer-container')) {
                // Zoom state sıfırla
                const state = getZoomState(currentViewerIndex);
                if (state.scale > 1) {
                    // Zoom varsa sadece zoom'u sıfırla, modal kapama
                    state.scale = 1;
                    state.posX = 0;
                    state.posY = 0;
                    state.lastScale = 1;
                    applyZoomTransform(currentViewerIndex);
                    return; // Modalı kapatma, sadece zoom sıfırla
                }
                window.closeModalHelper(modal);
            }
        });
    }

    // ========================================
    // FOTOĞRAF YÜKLEME SİSTEMİ (v2 - Rewrite)
    // ========================================

    async function handlePhotoUpload(files) {
        if (!files || files.length === 0) {
            console.warn('⚠️ handlePhotoUpload: Dosya yok');
            return;
        }

        console.log(`📸 ${files.length} dosya alındı, işleniyor...`);

        const overlay = document.getElementById('editor-processing-overlay');
        if (overlay) overlay.classList.remove('hidden');

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Tip kontrolü - bazı mobil tarayıcılar boş tip döner
            if (file.type && !file.type.startsWith('image/')) {
                console.warn(`⚠️ Resim değil, atlandı: ${file.name} (${file.type})`);
                continue;
            }

            try {
                console.log(`📸 [${i + 1}/${files.length}] İşleniyor: ${file.name || 'camera'} (${(file.size / 1024).toFixed(0)} KB)`);
                const dataUrl = await fileToDataUrl(file);
                if (dataUrl) {
                    currentItemPhotos.push(dataUrl);
                    console.log(`✅ [${i + 1}/${files.length}] Başarılı eklendi`);
                } else {
                    console.error(`❌ [${i + 1}/${files.length}] Data URL oluşturulamadı`);
                }
            } catch (err) {
                console.error(`❌ Fotoğraf hatası [${i + 1}]:`, err);
            }
        }

        renderPhotoGrid();
        if (overlay) overlay.classList.add('hidden');
        console.log(`📸 Toplam fotoğraf sayısı: ${currentItemPhotos.length}`);
    }

    function fileToDataUrl(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();

            reader.onload = function (e) {
                const originalDataUrl = e.target.result;

                // Küçük resimler için direkt kullan (< 300KB)
                if (file.size < 300 * 1024) {
                    console.log('  → Küçük dosya, sıkıştırma atlandı');
                    resolve(originalDataUrl);
                    return;
                }

                // Büyük resimler için sıkıştır
                const img = new Image();
                img.onload = function () {
                    try {
                        const canvas = document.createElement('canvas');
                        const MAX_DIM = 1200;
                        let w = img.naturalWidth;
                        let h = img.naturalHeight;

                        // Boyutlandır
                        if (w > MAX_DIM || h > MAX_DIM) {
                            if (w > h) {
                                h = Math.round(h * (MAX_DIM / w));
                                w = MAX_DIM;
                            } else {
                                w = Math.round(w * (MAX_DIM / h));
                                h = MAX_DIM;
                            }
                        }

                        canvas.width = w;
                        canvas.height = h;

                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, w, h);

                        const compressed = canvas.toDataURL('image/jpeg', 0.75);
                        console.log(`  → Sıkıştırıldı: ${(compressed.length / 1024).toFixed(0)} KB`);
                        resolve(compressed);
                    } catch (canvasErr) {
                        console.warn('  → Canvas sıkıştırma başarısız, orijinal kullanılıyor', canvasErr);
                        resolve(originalDataUrl);
                    }
                };

                img.onerror = function () {
                    console.warn('  → Resim yüklenemedi, orijinal data URL kullanılıyor');
                    resolve(originalDataUrl);
                };

                img.src = originalDataUrl;
            };

            reader.onerror = function () {
                console.error('  → FileReader hatası');
                resolve(null);
            };

            reader.readAsDataURL(file);
        });
    }

    function renderPhotoGrid() {
        const grid = document.getElementById('editor-photo-grid');
        if (!grid) return;

        grid.innerHTML = '';

        if (currentItemPhotos.length === 0) return;

        currentItemPhotos.forEach((photo, index) => {
            const item = document.createElement('div');
            item.className = 'photo-item';
            item.innerHTML = `
                <img src="${photo}" alt="Fotoğraf ${index + 1}" class="preview-trigger">
                <button type="button" class="remove-photo" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            grid.appendChild(item);
        });

        // Büyütme tıklamaları
        grid.querySelectorAll('.preview-trigger').forEach((img, index) => {
            img.addEventListener('click', () => {
                if (typeof window.openImageViewer === 'function') {
                    window.openImageViewer(currentItemPhotos, index);
                }
            });
        });

        // Silme butonları
        grid.querySelectorAll('.remove-photo').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const idx = parseInt(btn.dataset.index);
                currentItemPhotos.splice(idx, 1);
                renderPhotoGrid();
            });
        });
    }

    function setupPhotoListeners() {
        const photoInput = document.getElementById('editor-photo-input');
        const cameraInput = document.getElementById('editor-camera-input');
        const btnPick = document.getElementById('btn-pick-photo');
        const btnTake = document.getElementById('btn-take-photo');

        // Galeriden seç butonu
        if (btnPick && photoInput) {
            btnPick.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('📁 Galeri açılıyor...');
                photoInput.click();
            });
        }

        // Fotoğraf çek butonu
        if (btnTake && cameraInput) {
            btnTake.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('📷 Kamera açılıyor...');
                cameraInput.click();
            });
        }

        // Galeri input change
        if (photoInput) {
            photoInput.addEventListener('change', function () {
                console.log('📁 Galeri seçimi:', this.files?.length, 'dosya');
                if (this.files && this.files.length > 0) {
                    handlePhotoUpload(this.files);
                }
                this.value = '';  // Reset for next selection
            });
        }

        // Kamera input change
        if (cameraInput) {
            cameraInput.addEventListener('change', function () {
                console.log('📷 Kamera çekimi:', this.files?.length, 'dosya');
                if (this.files && this.files.length > 0) {
                    handlePhotoUpload(this.files);
                }
                this.value = '';  // Reset for next capture
            });
        }

        console.log('✅ Fotoğraf listener\'ları kuruldu', {
            photoInput: !!photoInput,
            cameraInput: !!cameraInput,
            btnPick: !!btnPick,
            btnTake: !!btnTake
        });
    }

    // Editör Kategori Değişimi (Yeni Kategori Kontrolü)
    const editorCatSelect = document.getElementById('editor-category');
    const editorNewCatContainer = document.getElementById('editor-new-cat-container');
    if (editorCatSelect && editorNewCatContainer) {
        editorCatSelect.addEventListener('change', (e) => {
            if (e.target.value === 'new-cat-option') {
                editorNewCatContainer.classList.remove('hidden');
                document.getElementById('editor-new-cat-input')?.focus();
            } else {
                editorNewCatContainer.classList.add('hidden');
            }
        });
    }

    // Kaydet Butonu (Editör Modalı)
    const btnSaveEditor = document.getElementById('btn-save-editor');
    if (btnSaveEditor) {
        btnSaveEditor.addEventListener('click', () => {
            const modal = document.getElementById('modal-item-editor');
            const mode = modal.dataset.mode;
            const type = modal.dataset.type || 'ceyiz';

            const idInp = document.getElementById('editor-id');
            const nameInp = document.getElementById('editor-name');
            const catSelect = document.getElementById('editor-category');
            const newCatInp = document.getElementById('editor-new-cat-input');
            const qtyInp = document.getElementById('editor-qty');
            const priceInp = document.getElementById('editor-price');
            const noteInp = document.getElementById('editor-note');
            const boughtCheck = document.getElementById('editor-bought');

            const name = nameInp?.value.trim();
            let cat = catSelect?.value;
            const newCat = newCatInp?.value.trim();
            const qty = parseInt(qtyInp?.value) || 1;
            const price = parseFloat(priceInp?.value) || 0;
            const note = noteInp?.value.trim();
            const isBought = boughtCheck?.checked;

            if (cat === 'new-cat-option') {
                cat = newCat; // Yeni girilen kategori ismini al
                if (cat) {
                    // Yeni kategoriyi listeye ekle ve kaydet
                    if (!userCategories[type].includes(cat)) {
                        userCategories[type].push(cat);
                        saveData();
                    }
                }
            }

            if (!name || !cat) {
                alert("Lütfen isim ve kategori giriniz.");
                return;
            }

            if (mode === 'edit' && idInp?.value) {
                // GÜNCELLEME
                const index = items.findIndex(i => i.id === idInp.value);
                if (index > -1) {
                    const wasBought = items[index].isBought;
                    const newPurchaseMonth = isBought ? (wasBought ? items[index].purchaseMonth || getCurrentMonth() : getCurrentMonth()) : null;

                    items[index] = {
                        ...items[index],
                        name: name,
                        category: cat,
                        quantity: qty,
                        price: price,
                        note: note,
                        isBought: isBought,
                        purchaseMonth: newPurchaseMonth,
                        photos: [...currentItemPhotos] // Fotoğrafları kaydet
                    };
                    console.log("✅ Ürün güncellendi.");
                }
            } else {
                // YENİ EKLEME
                const newItem = {
                    id: Date.now().toString(),
                    type: type,
                    name: name,
                    category: cat,
                    quantity: qty,
                    price: price,
                    note: note,
                    isBought: isBought,
                    purchaseMonth: isBought ? getCurrentMonth() : null,
                    photos: [...currentItemPhotos], // Fotoğrafları kaydet
                    dateAdded: new Date().toISOString()
                };
                items.push(newItem);
                console.log("🎉 Ürün eklendi.");
            }

            saveData();

            // Listeyi ve tüm uygulamayı yenile
            if (typeof renderApp === 'function') {
                renderApp();
            } else if (window.renderList) {
                window.renderList(type);
            }

            window.closeModalHelper(modal);
        });
    }


    // =========================================================================
    // 7. COUNTDOWN (SAYAÇLAR)
    // =========================================================================
    function updateCountdowns() {
        const now = new Date();
        const dates = settings.dates;

        if (dates.engagement) {
            const nisan = new Date(dates.engagement);
            const diff = nisan - now;
            updateTimer('home-nisan-timer', diff);
        }

        if (dates.wedding) {
            const nikah = new Date(dates.wedding);
            const diff = nikah - now;
            updateTimer('home-nikah-timer', diff);
        }
    }

    function updateTimer(id, ms) {
        const el = document.getElementById(id);
        if (!el) return;

        if (ms < 0) {
            el.textContent = "Tamamlandı! ❤️";
            return;
        }

        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        el.textContent = `${days} gün ${hours} saat`;
    }

    // Sayaçları her saniye güncelle
    setInterval(updateCountdowns, 60000); // Dakikada bir yeterli performans için


    // =========================================================================
    // 8. ARAMA ÖZELLİĞİ (SEARCH)
    // =========================================================================
    function setupSearch() {
        ['ceyiz', 'damat'].forEach(type => {
            const searchInput = document.getElementById(`search-${type}`);
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const query = e.target.value.toLowerCase().trim();
                    filterList(type, query);
                });
            }
        });
    }

    function filterList(type, query) {
        const listContainer = document.getElementById(`${type}-list`);
        if (!listContainer) return;

        const cards = listContainer.querySelectorAll('.item-card');
        let visibleCount = 0;

        cards.forEach(card => {
            // Basit text content araması (Ad, kategori vb. içinde)
            const text = card.textContent.toLowerCase();
            if (text.includes(query)) {
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        // "Sonuç Yok" mesajı
        // (Eğer özel bir 'no-result' divimiz yoksa, empty-state ile karıştırmayalım)
    }


    // =========================================================================
    // 9. AYARLAR (SETTINGS) YÖNETİMİ
    // =========================================================================
    function loadSettingsUI() {
        // İsimler
        const nameInput = document.getElementById('setting-user-name');
        if (nameInput) nameInput.value = settings.userName || '';

        const partnerInput = document.getElementById('setting-partner-name');
        if (partnerInput) partnerInput.value = settings.partnerName || '';

        // Tarihler
        const engageInput = document.getElementById('input-date-nisan'); // ID index.html'den kontrol edildi
        if (engageInput && settings.dates.engagement) engageInput.value = settings.dates.engagement;

        const weddingInput = document.getElementById('input-date-nikah');
        if (weddingInput && settings.dates.wedding) weddingInput.value = settings.dates.wedding;

        // Tema Toggle
        const darkToggle = document.getElementById('darkModeToggle');
        if (darkToggle) darkToggle.checked = document.body.classList.contains('dark-mode');
    }

    function saveSettingsFromUI() {
        const nameInput = document.getElementById('setting-user-name');
        if (nameInput) settings.userName = nameInput.value;

        const partnerInput = document.getElementById('setting-partner-name');
        if (partnerInput) settings.partnerName = partnerInput.value;

        // Tarihlerin inputlardan alınması (DatePicker entegrasyonu yoksa manuel text)
        // Basitlik için şimdilik text input varsayıyoruz veya date picker value
        const engageInput = document.getElementById('input-date-nisan');
        if (engageInput) settings.dates.engagement = engageInput.value;

        const weddingInput = document.getElementById('input-date-nikah');
        if (weddingInput) settings.dates.wedding = weddingInput.value;

        saveData();
        updateCountdowns(); // Tarihler değiştiyse sayaçları güncelle

        // Splash isimlerini güncelle (Varsa)
        const sName = document.getElementById('splash-name-bride');
        if (sName) sName.textContent = settings.userName;
        const sGroom = document.getElementById('splash-name-groom');
        if (sGroom) sGroom.textContent = settings.partnerName;

        // alert("Ayarlar kaydedildi! ✅"); // Kullanıcı isteği üzerine kaldırıldı

        // Modalı Kapat
        const modal = document.getElementById('modal-settings');
        if (modal && window.closeModalHelper) {
            window.closeModalHelper(modal);
        }
    }

    // Ayarlar Kaydet Butonu
    const btnSaveSettings = document.getElementById('btn-save-all-settings');
    if (btnSaveSettings) {
        btnSaveSettings.addEventListener('click', saveSettingsFromUI);
        console.log("⚙️ Ayarlar kaydet butonu dinleniyor.");
    }

    // Ayarlar Modalını Açma Butonu (Headerdaki)
    const btnOpenSettings = document.getElementById('btn-settings');
    if (btnOpenSettings) {
        btnOpenSettings.addEventListener('click', () => {
            loadSettingsUI();
            window.openModal('modal-settings');
        });
    }

    // =========================================================================
    // MODAL DIŞI TIKLAMA İLE KAPATMA (Global Backdrop Listener)
    // =========================================================================
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-backdrop')) {
            const modal = e.target.closest('.modal');
            if (modal) {
                console.log("🌑 Backdrop tıklandı, modal kapatılıyor:", modal.id);
                // Varsa global helper'ı kullan
                if (window.closeModalHelper) {
                    window.closeModalHelper(modal);
                } else {
                    // Fallback: Manuel kapat
                    modal.classList.remove('active');
                    setTimeout(() => modal.classList.add('hidden'), 300);
                }
            }
        }
    });

    // =========================================================================
    // 10. GELİŞMİŞ DÜZENLEME (EDIT) MODALI - openQuickAddModal kullanılır
    // =========================================================================

    // Save Fonksiyonunu Güncelle (Edit Desteği İçin)
    // Önceki listener'ı kaldırmak zor olduğu için, btnSaveQA click handler'ını 
    // daha akıllı hale getirmemiz lazım.
    // Ancak addEventListener stacklenir. 
    // Bu yüzden en temiz yöntem: Yeni bir fonksiyon yazıp, butonun onclick attribute'una bağlamak
    // veya önceki listener'ın içindeki mantığı "editId" kontrol edecek şekilde yazdım zaten?
    // Kontrol edelim: Yukarida (Satır 400 civarı) sadece "items.push(newItem)" yapıyor.
    // Orayı DÜZELTMEMİZ lazım.

    // DÜZELTME: Kaydet butonu mantığını buraya alıyorum ve eskisini devre dışı bırakıyorum (removeEventListener yapamayız çünkü anonim fonksiyonsu)
    // Çözüm: Butonu klonlayıp eskisini silmek (event listenerları temizler)

    const btnSaveQA = document.getElementById('btn-save-qa');
    if (btnSaveQA) {
        const newBtn = btnSaveQA.cloneNode(true);
        btnSaveQA.parentNode.replaceChild(newBtn, btnSaveQA);

        newBtn.addEventListener('click', () => {
            const modal = document.getElementById('modal-quick-add-category');
            const name = document.getElementById('qa-new-product-name')?.value;
            const cat = document.getElementById('qa-new-category-select')?.value;
            const qty = document.getElementById('qa-new-qty')?.value;
            const price = document.getElementById('qa-new-price')?.value;
            const note = document.getElementById('qa-new-note')?.value;

            const type = modal.dataset.type || 'ceyiz';
            const editId = modal.dataset.editId; // String olarak gelir

            if (!name || !cat) {
                alert("Lütfen isim ve kategori giriniz.");
                return;
            }

            if (editId) {
                // GÜNCELLEME
                const itemIndex = items.findIndex(i => i.id == editId); // Loose equality
                if (itemIndex > -1) {
                    items[itemIndex] = {
                        ...items[itemIndex],
                        name: name,
                        category: cat,
                        quantity: parseInt(qty) || 1,
                        price: parseFloat(price) || 0,
                        note: note
                    };
                    alert("Ürün güncellendi! ✅");
                }
            } else {
                // YENİ EKLEME
                const newItem = {
                    id: Date.now(),
                    name: name,
                    category: cat,
                    type: type,
                    isBought: false,
                    quantity: parseInt(qty) || 1,
                    price: parseFloat(price) || 0,
                    note: note,
                    date: new Date().toISOString()
                };
                items.push(newItem);
                // alert("Eklendi!");
            }

            saveData();
            renderApp();

            // Temizlik
            delete modal.dataset.editId;
            const title = document.getElementById('qa-title');
            if (title) title.textContent = "Hızlı Ekle ✨";

            window.closeModalHelper(modal);
        });
        console.log("✅ Kaydet butonu güncellendi (Edit + Add destekli)");
    }


    // =========================================================================
    // 11. TEMA VE GÖRÜNÜM (DARK MODE)
    // =========================================================================

    // TEK updateThemeIcon fonksiyonu - ID: btn-dark-mode-toggle
    function updateThemeIcon(isDark) {
        const btn = document.getElementById('btn-dark-mode-toggle');
        if (btn) {
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }

    function initTheme() {
        const savedMode = (settings.theme && settings.theme.mode) ? settings.theme.mode : 'light';
        const isDark = savedMode === 'dark';
        console.log("🎨 initTheme: savedMode=" + savedMode + ", isDark=" + isDark);

        if (isDark) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }

        // Background Theme
        const bgTheme = (settings.theme && settings.theme.background) || 'simple';
        document.body.setAttribute('data-bg', bgTheme);
        document.body.classList.remove('bg-simple', 'bg-floral', 'bg-picnic');
        document.body.classList.add('bg-' + bgTheme);

        // Toggle güncelle
        const toggle = document.getElementById('darkModeToggle');
        if (toggle) toggle.checked = isDark;

        // Header ikon güncelle
        updateThemeIcon(isDark);

        // Arka plan seçicileri güncelle
        document.querySelectorAll('.bg-option').forEach(function (opt) {
            opt.classList.remove('active');
            if (opt.dataset.bg === bgTheme) opt.classList.add('active');
        });
    }

    function setDarkMode(enable) {
        console.log("⚡ setDarkMode:", enable);

        if (enable) {
            document.body.classList.add('dark-mode');
            settings.theme.mode = 'dark';
        } else {
            document.body.classList.remove('dark-mode');
            settings.theme.mode = 'light';
        }

        console.log("Body classList:", document.body.className);

        // Switch güncelle
        var toggle = document.getElementById('darkModeToggle');
        if (toggle) toggle.checked = enable;

        // Header ikon güncelle
        updateThemeIcon(enable);

        saveData();
    }

    function setupThemeListeners() {
        console.log("🎨 setupThemeListeners başlıyor...");

        // A. Ayarlar Switch
        var toggle = document.getElementById('darkModeToggle');
        if (toggle) {
            toggle.addEventListener('change', function (e) {
                console.log("🔘 Switch değişti:", e.target.checked);
                setDarkMode(e.target.checked);
            });
            console.log("✅ darkModeToggle listener eklendi");
        }

        // B. Header Butonu (btn-dark-mode-toggle)
        var btnHeaderTheme = document.getElementById('btn-dark-mode-toggle');
        console.log("Header buton aranıyor:", btnHeaderTheme);
        if (btnHeaderTheme) {
            // Clone ile eski listener'ları temizle
            var newBtn = btnHeaderTheme.cloneNode(true);
            btnHeaderTheme.parentNode.replaceChild(newBtn, btnHeaderTheme);

            newBtn.addEventListener('click', function () {
                var isDark = document.body.classList.contains('dark-mode');
                console.log("🌓 Header buton tıklandı! Şimdi:", isDark ? 'DARK' : 'LIGHT', "-> Geçilecek:", isDark ? 'LIGHT' : 'DARK');
                setDarkMode(!isDark);
            });
            console.log("✅ Header dark mode buton listener eklendi");
        } else {
            console.error("❌ btn-dark-mode-toggle BULUNAMADI!");
        }

        // C. Arka Plan Seçimi
        var bgOptions = document.querySelectorAll('.bg-option');
        bgOptions.forEach(function (opt) {
            opt.addEventListener('click', function () {
                var bgName = opt.dataset.bg;
                if (bgName) {
                    settings.theme.background = bgName;
                    document.body.setAttribute('data-bg', bgName);
                    document.body.classList.remove('bg-simple', 'bg-floral', 'bg-picnic');
                    document.body.classList.add('bg-' + bgName);
                    bgOptions.forEach(function (o) { o.classList.remove('active'); });
                    opt.classList.add('active');
                    saveData();
                }
            });
        });

        console.log("✅ setupThemeListeners tamamlandı");
    }

    function setupSettingsListeners() {
        console.log("⚙️ Ayarlar dinleyicileri kuruluyor...");

        const btnSaveSettings = document.getElementById('btn-save-all-settings');
        const modalSettings = document.getElementById('modal-settings');

        // Inputs
        const inputUserName = document.getElementById('setting-user-name');
        const inputPartnerName = document.getElementById('setting-partner-name');
        const inputNisanDate = document.getElementById('setting-nisan-date');
        const inputNikahDate = document.getElementById('setting-nikah-date');

        // --- Custom Date Picker Logic ---
        let pickerCurrentDate = new Date();
        let pickerCallback = null;
        let selectedPickerDate = null;

        window.openDatePicker = function (initialDateStr, callback) {
            console.log("📅 DatePicker açılıyor:", initialDateStr);
            pickerCallback = callback;

            if (initialDateStr) {
                pickerCurrentDate = new Date(initialDateStr);
                selectedPickerDate = initialDateStr;
            } else {
                pickerCurrentDate = new Date();
                selectedPickerDate = null;
            }

            pickerYearsOpen = false;
            // Reset year picker DOM state
            const yc = document.getElementById('picker-years-container');
            const dh = document.querySelector('#modal-date-picker .picker-days-header');
            const dg = document.getElementById('picker-grid');
            const my = document.getElementById('picker-month-year');
            if (yc) yc.style.display = 'none';
            if (dh) dh.style.display = '';
            if (dg) dg.style.display = '';
            if (my) my.classList.remove('years-open');
            const pb = document.getElementById('picker-prev');
            const nb = document.getElementById('picker-next');
            if (pb) pb.style.visibility = '';
            if (nb) nb.style.visibility = '';
            renderPicker();
            const modal = document.getElementById('modal-date-picker');
            if (modal) {
                modal.classList.remove('hidden');
                setTimeout(() => modal.classList.add('active'), 10);
            }
        };

        window.closeDatePicker = function () {
            const modal = document.getElementById('modal-date-picker');
            if (modal) {
                modal.classList.remove('active');
                setTimeout(() => modal.classList.add('hidden'), 300);
            }
        };

        function renderPicker() {
            const grid = document.getElementById('picker-grid');
            const monthYear = document.getElementById('picker-month-year');
            if (!grid || !monthYear) return;

            grid.innerHTML = '';
            const year = pickerCurrentDate.getFullYear();
            const month = pickerCurrentDate.getMonth();

            const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
            monthYear.innerHTML = `${monthNames[month]} ${year} <i class="fas fa-chevron-down year-chevron"></i>`;

            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const startOffset = firstDay === 0 ? 6 : firstDay - 1;

            for (let i = 0; i < startOffset; i++) {
                const empty = document.createElement('div');
                empty.className = 'picker-day empty';
                grid.appendChild(empty);
            }

            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            for (let day = 1; day <= daysInMonth; day++) {
                const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const cell = document.createElement('div');
                cell.className = 'picker-day';
                cell.textContent = day;

                if (dStr === todayStr) cell.classList.add('today');
                if (dStr === selectedPickerDate) cell.classList.add('selected');

                cell.addEventListener('click', () => {
                    selectedPickerDate = dStr;
                    renderPicker();
                });

                grid.appendChild(cell);
            }
        }

        // Picker Nav
        const btnPrev = document.getElementById('picker-prev');
        const btnNext = document.getElementById('picker-next');
        const btnConfirm = document.getElementById('btn-confirm-date');

        if (btnPrev) btnPrev.addEventListener('click', () => {
            pickerCurrentDate.setMonth(pickerCurrentDate.getMonth() - 1);
            renderPicker();
        });
        if (btnNext) btnNext.addEventListener('click', () => {
            pickerCurrentDate.setMonth(pickerCurrentDate.getMonth() + 1);
            renderPicker();
        });
        if (btnConfirm) btnConfirm.addEventListener('click', () => {
            if (selectedPickerDate && pickerCallback) {
                pickerCallback(selectedPickerDate);
                window.closeDatePicker();
            } else if (window.showToast) {
                window.showToast('Lütfen bir tarih seçin');
            }
        });

        // === YEAR PICKER TOGGLE ===
        let pickerYearsOpen = false;

        function toggleYearsPicker() {
            const monthYearEl = document.getElementById('picker-month-year');
            const daysHeader = document.querySelector('#modal-date-picker .picker-days-header');
            const daysGrid = document.getElementById('picker-grid');
            const yearsContainer = document.getElementById('picker-years-container');
            const prevBtn = document.getElementById('picker-prev');
            const nextBtn = document.getElementById('picker-next');
            if (!yearsContainer) return;

            pickerYearsOpen = !pickerYearsOpen;

            if (pickerYearsOpen) {
                // Show years grid, hide days
                if (daysHeader) daysHeader.style.display = 'none';
                if (daysGrid) daysGrid.style.display = 'none';
                yearsContainer.style.display = 'grid';
                if (prevBtn) prevBtn.style.visibility = 'hidden';
                if (nextBtn) nextBtn.style.visibility = 'hidden';
                if (monthYearEl) monthYearEl.classList.add('years-open');
                renderYearsPicker();
            } else {
                // Show days, hide years
                if (daysHeader) daysHeader.style.display = '';
                if (daysGrid) daysGrid.style.display = '';
                yearsContainer.style.display = 'none';
                if (prevBtn) prevBtn.style.visibility = '';
                if (nextBtn) nextBtn.style.visibility = '';
                if (monthYearEl) monthYearEl.classList.remove('years-open');
                renderPicker();
            }
        }

        function renderYearsPicker() {
            const container = document.getElementById('picker-years-container');
            if (!container) return;

            container.innerHTML = '';
            const currentYear = new Date().getFullYear();
            const selectedYear = pickerCurrentDate.getFullYear();
            const startYear = currentYear - 5;
            const endYear = currentYear + 10;

            for (let y = startYear; y <= endYear; y++) {
                const cell = document.createElement('div');
                cell.className = 'picker-year-cell';
                cell.textContent = y;

                if (y === currentYear) cell.classList.add('current-year');
                if (y === selectedYear) cell.classList.add('selected-year');

                cell.addEventListener('click', () => {
                    pickerCurrentDate.setFullYear(y);
                    pickerYearsOpen = true; // Will be toggled to false
                    toggleYearsPicker();
                });

                container.appendChild(cell);
            }

            // Scroll to selected year
            setTimeout(() => {
                const selectedCell = container.querySelector('.selected-year');
                if (selectedCell) {
                    selectedCell.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }
            }, 50);
        }

        // Wire up month-year click
        const pickerMonthYear = document.getElementById('picker-month-year');
        if (pickerMonthYear) {
            pickerMonthYear.addEventListener('click', toggleYearsPicker);
        }

        // Helper: ISO to DD.MM.YYYY
        function formatToDisplay(isoDate) {
            if (!isoDate) return '';
            const parts = isoDate.split('-');
            return `${parts[2]}.${parts[1]}.${parts[0]}`;
        }

        // --- Wire up Inputs ---
        if (inputNisanDate) {
            inputNisanDate.addEventListener('click', () => {
                window.openDatePicker(settings.dates?.engagement, (date) => {
                    settings.dates = settings.dates || {};
                    settings.dates.engagement = date;
                    inputNisanDate.value = formatToDisplay(date);
                });
            });
        }

        if (inputNikahDate) {
            inputNikahDate.addEventListener('click', () => {
                window.openDatePicker(settings.dates?.wedding, (date) => {
                    settings.dates = settings.dates || {};
                    settings.dates.wedding = date;
                    inputNikahDate.value = formatToDisplay(date);
                });
            });
        }

        window.populateSettingsUI = function () {
            if (inputUserName) inputUserName.value = settings.userName || '';
            if (inputPartnerName) inputPartnerName.value = settings.partnerName || '';

            if (settings.dates) {
                if (inputNisanDate) inputNisanDate.value = formatToDisplay(settings.dates.engagement);
                if (inputNikahDate) inputNikahDate.value = formatToDisplay(settings.dates.wedding);
            }
        };

        // Hook into openModal to populate
        const originalOpen = window.openModal;
        window.openModal = function (modalId) {
            if (modalId === 'modal-settings') {
                window.populateSettingsUI();
                // Scroll to top
                const body = document.querySelector('#modal-settings .sheet-body');
                if (body) body.scrollTop = 0;
            }

            const m = document.getElementById(modalId);
            if (m) {
                m.classList.remove('hidden');
                // Force a reflow and add active class for scaling
                setTimeout(() => m.classList.add('active'), 10);
            }

            if (originalOpen) {
                // We handle the class toggling above, but calling original for its logic
                originalOpen(modalId);
            }
        };

        // 2. Save Settings
        if (btnSaveSettings) {
            const newBtn = btnSaveSettings.cloneNode(true);
            btnSaveSettings.parentNode.replaceChild(newBtn, btnSaveSettings);

            newBtn.addEventListener('click', () => {
                settings.userName = inputUserName ? inputUserName.value.trim() : settings.userName;
                settings.partnerName = inputPartnerName ? inputPartnerName.value.trim() : settings.partnerName;

                // Dates are updated via callback in picker instantly on input.value, 
                // but we rely on settings object updated in click listeners above.

                saveData();
                renderApp();
                setupFullCalendar();

                if (window.closeModalHelper && modalSettings) {
                    window.closeModalHelper(modalSettings);
                } else if (modalSettings) {
                    modalSettings.classList.add('hidden');
                }

                if (window.showToast) window.showToast('Ayarlar ve tarihler kaydedildi ✅');
            });
        }

        // --- 3. Countdown Widget Click Listener ---
        setTimeout(() => {
            const countdownCard = document.querySelector('.unified-countdown-card');
            if (countdownCard && !countdownCard.classList.contains('calendar-mode') && !countdownCard.classList.contains('upcoming-mode')) {
                countdownCard.style.cursor = 'pointer';
                countdownCard.addEventListener('click', () => {
                    if (window.openModal) {
                        window.openModal('modal-settings');
                    }
                    setTimeout(() => {
                        const dateSection = document.getElementById('settings-dates-section');
                        if (dateSection) {
                            dateSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            dateSection.style.transition = 'background 0.5s';
                            dateSection.style.backgroundColor = 'rgba(var(--primary-rgb), 0.1)';
                            setTimeout(() => dateSection.style.backgroundColor = 'transparent', 1000);
                        }
                    }, 300);
                });
            }
        }, 1000);
    }

    // =========================================================================
    // 11. VERİ YEDEKLEME VE BULUT SENKRONİZASYONU (YENİ)
    // =========================================================================

    // A. Manuel JSON Yedekleme (Dışa Aktar)
    function exportBackup() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) {
                if (window.showToast) window.showToast('⚠️ Yedeklenecek veri bulunamadı.');
                return;
            }

            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const date = new Date().toISOString().slice(0, 10);

            a.href = url;
            a.download = `ceyiz_yedek_${date}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            if (window.showToast) window.showToast('✅ Yedek dosyası oluşturuldu!');
        } catch (e) {
            console.error("Backup Error:", e);
        }
    }

    // B. Manuel JSON Geri Yükleme (İçe Aktar)
    function importBackup(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const parsed = JSON.parse(content);

                // Basit doğrulama
                if (!parsed.items || !parsed.settings) {
                    throw new Error("Geçersiz yedek dosyası formatı.");
                }

                window.showConfirm(
                    'Yedeği Geri Yükle',
                    '⚠️ Mevcut verileriniz silinecek ve seçtiğiniz yedek yüklenecektir. Devam edilsin mi?',
                    () => {
                        localStorage.setItem(STORAGE_KEY, content);
                        localStorage.setItem(STORAGE_KEY + '_safe_copy', content);
                        if (window.showToast) window.showToast('♻️ Veriler geri yüklendi! Sayfa yenileniyor...');
                        setTimeout(() => location.reload(), 1500);
                    }
                );
            } catch (err) {
                console.error("Import Error:", err);
                alert("Hata: " + err.message);
            }
        };
        reader.readAsText(file);
    }

    // C. Firebase Bulut Senkronizasyonu
    let db = null;
    let syncActive = false;
    let unsubscribes = [];

    const firebaseConfig = {
        apiKey: "AIzaSyDnP_QyltRRwKjoUfJraQMqkV3_SJYigoU",
        authDomain: "ceyiz-defteri-sync.firebaseapp.com",
        projectId: "ceyiz-defteri-sync",
        storageBucket: "ceyiz-defteri-sync.firebasestorage.app",
        messagingSenderId: "490613867046",
        appId: "1:490613867046:web:8f9af6ceaa4a7af10edce7",
        measurementId: "G-20EMTT2NT4"
    };

    async function initCloudSync() {
        const syncCode = (settings.syncCode || "").trim().toUpperCase();

        // If no code, ensure UI is ready for new connection
        if (!syncCode || syncCode.length < 4) {
            const codeInput = document.getElementById('setting-cloud-code');
            const btnConnect = document.getElementById('btn-sync-connect');
            if (codeInput) {
                codeInput.disabled = false;
                codeInput.value = "";
            }
            if (btnConnect) {
                btnConnect.disabled = false;
                btnConnect.innerHTML = "Bağlan";
                btnConnect.style.background = "";
                btnConnect.style.borderColor = "";
            }
            return;
        }

        try {
            if (typeof firebase === 'undefined') {
                console.warn("☁️ Firebase SDK henüz yüklenmemiş.");
                if (window.showToast) window.showToast('⚠️ Firebase yüklenemedi. İnternet bağlantınızı kontrol edin.');
                return;
            }

            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }

            db = firebase.firestore();
            syncActive = true;
            console.log("☁️ Bulut bağlantısı kuruldu (Kod: " + syncCode + ")");

            // UI Update
            const btnConnect = document.getElementById('btn-sync-connect');
            const btnDisconnect = document.getElementById('btn-sync-disconnect');
            const codeInput = document.getElementById('setting-cloud-code');

            if (btnConnect) btnConnect.style.display = 'none';
            if (btnDisconnect) btnDisconnect.style.display = 'block';
            if (codeInput) {
                codeInput.value = syncCode;
                codeInput.disabled = true;
            }

            // --- SYNC PRIORITY LOGIC ---
            // İlk bağlantıda: Bulutta veri varsa yereli ez (Client is Mirror)
            // Bulut boşsa: Yereli gönder (Client is Source)
            const docRef = db.collection("families").doc(syncCode);
            try {
                if (window.showToast) window.showToast('☁️ Bulut verisi kontrol ediliyor...');
                const doc = await docRef.get();
                if (doc.exists) {
                    const remote = doc.data();
                    if (remote && remote.items && remote.items.length > 0) {
                        console.log("📥 Bulutta veri bulundu, yerel veri güncelleniyor...");
                        handleRemoteData(remote);
                        if (window.showToast) window.showToast('✅ Buluttaki veriler yüklendi.');
                    } else {
                        // Bulut var ama item yoksa veya boşsa, yerel veriyi gönder (Merge riski almamak için)
                        console.log("☁️ Bulut boş görünüyor, yerel veri gönderiliyor...");
                        await window.syncToCloud();
                    }
                } else {
                    console.log("☁️ Bulutta kayıt yok, yerel veri gönderiliyor...");
                    await window.syncToCloud();
                }
            } catch (checkErr) {
                console.error("Sync Check Error:", checkErr);
                // Hata durumunda (internet vs) listener'ı yine de başlatmayı dene
            }

            setupCloudListeners(syncCode);

        } catch (err) {
            console.error("Firebase Init Error:", err);
            if (window.showToast) window.showToast('❌ Bağlantı hatası: ' + err.message);
            syncActive = false;
        }
    }

    function setupCloudListeners(code) {
        unsubscribes.forEach(u => u());
        unsubscribes = [];

        const docRef = db.collection("families").doc(code);

        // Buluttan veri geldiğinde yerelle birleştir (Data Loss Prevention)
        unsubscribes.push(docRef.onSnapshot(doc => {
            if (doc.exists) {
                const remote = doc.data();
                if (window.showToast) window.showToast('📥 Veri alındı (Kontrol ediliyor...)');
                handleRemoteData(remote);
            }
        }));
    }

    function handleRemoteData(remote) {
        let changed = false;

        // 1. Items Merging
        if (remote.items && JSON.stringify(remote.items) !== JSON.stringify(items)) {
            // Eğer yerel boşsa direkt al, doluysa en güncel listeyi (id bazlı) koru
            if (items.length === 0) {
                items = remote.items;
            } else {
                // Merge logic: ID bazlı en yeni olanı tut (Karmaşıklaşmaması için şimdilik remote'u baskın yapıyoruz)
                items = remote.items;
            }
            changed = true;
        }

        // 2. Settings Merging
        if (remote.settings && JSON.stringify(remote.settings) !== JSON.stringify(settings)) {
            settings = { ...settings, ...remote.settings };
            changed = true;
        }

        if (changed) {
            console.log("🔄 Bulut verileri senkronize edildi.");
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, userCategories, settings }));
            renderApp();
        }
    }

    window.syncToCloud = async function () {
        console.log("☁️ syncToCloud çağrıldı. Durum:", {
            active: syncActive,
            db: !!db,
            code: settings.syncCode
        });

        if (!syncActive || !db || !settings.syncCode) {
            console.warn("☁️ Sync iptal: Gerekli koşullar sağlanmadı.");
            if (window.showToast) window.showToast('⚠️ Sync İptal: Bağlantı yok veya kod eksik.');
            return;
        }
        const code = settings.syncCode.trim().toUpperCase();

        // Debug Toast
        // if (window.showToast) window.showToast('📤 Veri buluta gönderiliyor...');

        try {
            await db.collection("families").doc(code).set({
                items,
                userCategories,
                settings,
                lastUpdated: new Date().toISOString()
            });
            console.log("☁️ Veriler buluta itildi.");
            if (window.showToast) window.showToast('☁️ Veriler güncellendi.');
        } catch (err) {
            console.warn("Cloud Push Failed:", err);
            if (window.showToast) window.showToast('❌ Gönderme hatası: ' + err.message);
        }
    };

    function setupDataSafetyListeners() {
        console.log("🛡️ Veri Güvenliği Dinleyicileri Kuruluyor...");
        // Backup Buttons
        const btnBackup = document.getElementById('btn-backup-copy');
        if (btnBackup) btnBackup.addEventListener('click', exportBackup);

        const btnImport = document.getElementById('btn-import-paste');
        const fileInput = document.getElementById('backup-file-input');
        if (btnImport && fileInput) {
            btnImport.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => importBackup(e.target.files[0]));
        }

        // Copy JSON to Clipboard (New)
        const btnCopyJson = document.getElementById('btn-copy-json');
        if (btnCopyJson) {
            btnCopyJson.addEventListener('click', () => {
                const data = localStorage.getItem(STORAGE_KEY);
                if (!data) {
                    if (window.showToast) window.showToast('⚠️ Kopyalanacak veri bulunamadı.');
                    return;
                }
                navigator.clipboard.writeText(data).then(() => {
                    if (window.showToast) window.showToast('📋 Veri kodu panoya kopyalandı!');
                }).catch(err => {
                    console.error('Copy failed:', err);
                    alert("Kopyalama başarısız oldu. Lütfen manuel seçip kopyalayın.");
                });
            });
        }

        // Paste JSON from Clipboard (New)
        const btnPasteJson = document.getElementById('btn-paste-json');
        if (btnPasteJson) {
            btnPasteJson.addEventListener('click', async () => {
                try {
                    const text = await navigator.clipboard.readText();
                    if (!text) {
                        alert("Pano boş veya erişim izni yok.");
                        return;
                    }

                    const parsed = JSON.parse(text);
                    if (!parsed.items || !parsed.settings) {
                        throw new Error("Geçersiz veri formatı.");
                    }

                    window.showConfirm(
                        'Veriyi Yapıştır',
                        '⚠️ Panodaki veriyi yapıştırmak mevcut verilerinizi silecektir. Devam edilsin mi?',
                        () => {
                            localStorage.setItem(STORAGE_KEY, text);
                            localStorage.setItem(STORAGE_KEY + '_safe_copy', text);
                            if (window.showToast) window.showToast('♻️ Veriler panodan yüklendi! Sayfa yenileniyor...');
                            setTimeout(() => location.reload(), 1500);
                        }
                    );
                } catch (err) {
                    console.error('Paste failed:', err);
                    alert("Hata: Geçersiz bir veri formatı veya pano erişim sorunu (" + err.message + ")");
                }
            });
        }

        // Sync Connection
        const btnConnect = document.getElementById('btn-sync-connect');
        if (btnConnect) {
            btnConnect.addEventListener('click', async () => {
                const codeInput = document.getElementById('setting-cloud-code');
                const code = codeInput ? codeInput.value.trim().toUpperCase() : '';

                if (code.length < 4) {
                    if (window.showToast) window.showToast("⚠️ Lütfen en az 4 haneli bir kod giriniz.");
                    return;
                }

                if (typeof firebase === 'undefined') {
                    if (window.showToast) window.showToast("⚠️ Firebase yüklenemedi. İnternet bağlantınızı kontrol edin.");
                    return;
                }

                settings.syncCode = code;
                saveData();

                if (window.showToast) window.showToast('☁️ Bulut bağlantısı kuruluyor...');

                try {
                    await initCloudSync();
                    if (syncActive) {
                        await window.syncToCloud();
                        if (window.showToast) window.showToast('✅ Bulut senkronizasyonu aktif! Kod: ' + code);

                        // Button Feedback
                        btnConnect.innerHTML = "BAĞLANDI ✅";
                        btnConnect.style.background = "#4CAF50"; // Green
                        btnConnect.style.borderColor = "#4CAF50";
                        btnConnect.disabled = true;
                    } else {
                        if (window.showToast) window.showToast("❌ Bağlantı kurulamadı.");
                    }
                } catch (e) {
                    if (window.showToast) window.showToast("❌ Bağlantı hatası: " + e.message);
                }
            });
        }

        // Sync Disconnect
        const btnDisconnect = document.getElementById('btn-sync-disconnect');
        if (btnDisconnect) {
            btnDisconnect.addEventListener('click', () => {
                window.showConfirm(
                    'Bağlantıyı Kes',
                    'Bulut bağlantısını kesmek istediğinize emin misiniz?',
                    () => {
                        disconnectFromCloud();
                    },
                    "Bağlantıyı Kes"
                );
            });
        }

        // Auto-init cloud sync if code exists
        // alert("🐛 DEBUG: setupDataSafetyListeners Bitti -> initCloudSync Çağrılıyor");
        initCloudSync();
    }

    // DISCONNECT FUNCTION
    function disconnectFromCloud() {
        console.log("🔌 Bulut bağlantısı kesiliyor...");

        // 1. Unsubscribe listeners
        unsubscribes.forEach(u => u());
        unsubscribes = [];
        syncActive = false;

        // 2. Clear Settings
        settings.syncCode = "";
        saveData();

        // 3. Reset UI
        const btnConnect = document.getElementById('btn-sync-connect');
        const btnDisconnect = document.getElementById('btn-sync-disconnect');
        const codeInput = document.getElementById('setting-cloud-code');

        if (btnConnect) {
            btnConnect.style.display = 'block';
            btnConnect.innerHTML = "Bağlan";
            btnConnect.disabled = false;
            btnConnect.style.background = ""; // Reset to default
            btnConnect.style.borderColor = "";
        }
        if (btnDisconnect) btnDisconnect.style.display = 'none';
        if (codeInput) {
            codeInput.value = "";
            codeInput.disabled = false;
        }

        if (window.showToast) window.showToast('🔌 Bağlantı kesildi.');
    }


    // =========================================================================
    // 12. SWIPE NAVİGASYON (Yatay Kaydırma ile Sayfa Değiştirme)
    // =========================================================================
    function setupSwipeNavigation() {
        const tabOrder = ['home', 'ceyiz', 'damat', 'stats']; // Sekme sırası
        let touchStartX = 0;
        let touchEndX = 0;
        let touchStartY = 0;
        let touchEndY = 0;

        const mainContainer = document.querySelector('main') || document.body;

        mainContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        mainContainer.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            handleSwipeGesture();
        }, { passive: true });

        function handleSwipeGesture() {
            const diffX = touchStartX - touchEndX;
            const diffY = Math.abs(touchStartY - touchEndY);

            // Sadece yatay kaydırma ise ve dikey hareket çok küçükse
            if (Math.abs(diffX) > 50 && diffY < 100) {
                const currentIndex = tabOrder.indexOf(currentTab);

                if (diffX > 0) {
                    // Sola kaydırma -> Sonraki sekme
                    if (currentIndex < tabOrder.length - 1) {
                        switchTab(tabOrder[currentIndex + 1]);
                        console.log('👈 Sola kaydırıldı, sonraki sekmeye geçildi');
                    }
                } else {
                    // Sağa kaydırma -> Önceki sekme
                    if (currentIndex > 0) {
                        switchTab(tabOrder[currentIndex - 1]);
                        console.log('👉 Sağa kaydırıldı, önceki sekmeye geçildi');
                    }
                }
            }
        }

        console.log('✅ Swipe navigation kuruldu');
    }

    // YARDIMCI: Standart Tatiller ve Özel Günler
    function getStandardHolidays(year) {
        return {
            [`${year}-01-01`]: { title: 'Yılbaşı 🎉', class: 'event-holiday' },
            [`${year}-02-14`]: { title: 'Sevgililer Günü 💘', class: 'event-holiday' },
            [`${year}-03-08`]: { title: 'Dünya Kadınlar Günü 💐', class: 'event-holiday' },
            [`${year}-04-23`]: { title: 'Ulusal Egemenlik ve Çocuk Bayramı 🇹🇷', class: 'event-holiday' },
            [`${year}-05-01`]: { title: 'Emek ve Dayanışma Günü 🛠️', class: 'event-holiday' },
            [`${year}-05-19`]: { title: 'Atatürk\'ü Anma, Gençlik ve Spor Bayramı 🇹🇷', class: 'event-holiday' },
            [`${year}-07-15`]: { title: 'Demokrasi ve Milli Birlik Günü 🇹🇷', class: 'event-holiday' },
            [`${year}-08-30`]: { title: 'Zafer Bayramı 🇹🇷', class: 'event-holiday' },
            [`${year}-10-29`]: { title: 'Cumhuriyet Bayramı 🇹🇷', class: 'event-holiday' },
            [`${year}-11-24`]: { title: 'Öğretmenler Günü 📚', class: 'event-holiday' },
            [`${year}-12-31`]: { title: 'Yılbaşı Gecesi 🎄', class: 'event-holiday' }
        };
    }

    // =========================================================================
    // 14. TAM EKRAN TAKVİM (Full Calendar) & NOTE SİSTEMİ
    // =========================================================================
    function setupFullCalendar() {
        const grid = document.getElementById('full-calendar-grid');
        const monthYearEl = document.getElementById('full-cal-month-year');
        const prevBtn = document.getElementById('full-cal-prev');
        const nextBtn = document.getElementById('full-cal-next');
        const selectedDateTitle = document.getElementById('selected-date-title');
        const selectedDateInfo = document.getElementById('selected-date-info');

        if (!grid || !monthYearEl) {
            console.warn("⚠️ Full calendar elements not found");
            return;
        }

        let currentDate = new Date();
        let selectedDate = null;

        // Kullanıcı Notları
        if (!settings.calendarNotes) {
            settings.calendarNotes = {};
        }

        function getAllSpecialDates(year) {
            const dates = {};
            // 1. Ayarlar (Nişan/Nikah) - Yıl bağımsız veya o yıla denk gelen?
            // Nişan/Nikah tarihleri sabit string "YYYY-MM-DD" formatında.
            // Onları doğrudan ekleyelim.
            if (settings && settings.dates) {
                if (settings.dates.engagement) {
                    dates[settings.dates.engagement] = { title: 'Nişan Günü 💍', class: 'event-nisan' };
                }
                if (settings.dates.wedding) {
                    dates[settings.dates.wedding] = { title: 'Büyük Gün (Nikah) 💒', class: 'event-nikah' };
                }
            }

            // 2. Standart Tatiller (O yıl için)
            const holidays = getStandardHolidays(year);
            Object.assign(dates, holidays);

            return dates;
        }

        function renderCalendar(date) {
            grid.innerHTML = '';
            const year = date.getFullYear();
            const month = date.getMonth();

            const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
            monthYearEl.textContent = `${monthNames[month]} ${year}`;

            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            let startOffset = firstDay === 0 ? 6 : firstDay - 1;

            for (let i = 0; i < startOffset; i++) {
                const emptyCell = document.createElement('div');
                emptyCell.classList.add('cal-day', 'empty');
                grid.appendChild(emptyCell);
            }

            const today = new Date();
            const specialDates = getAllSpecialDates(year); // O yılın tatilleri

            for (let day = 1; day <= daysInMonth; day++) {
                const dayCell = document.createElement('div');
                dayCell.classList.add('cal-day');
                dayCell.textContent = day;

                const currentDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                    dayCell.classList.add('today');
                }

                // Öncelik: Sistem olayları > Kullanıcı notları
                if (specialDates[currentDayStr]) {
                    dayCell.classList.add('has-event');
                    // Renk sınıfı
                    if (specialDates[currentDayStr].class) dayCell.classList.add(specialDates[currentDayStr].class);

                    const marker = document.createElement('div');
                    marker.className = 'event-marker';
                    if (specialDates[currentDayStr].class === 'event-holiday') {
                        marker.style.backgroundColor = '#e67e22'; // Turuncu (Tatil)
                    }
                    dayCell.appendChild(marker);
                } else if (settings.calendarNotes[currentDayStr]) {
                    dayCell.classList.add('has-user-event');
                    const marker = document.createElement('div');
                    marker.className = 'event-marker user-marker'; // Farklı renk için
                    marker.style.backgroundColor = 'var(--secondary-dark)';
                    dayCell.appendChild(marker);
                }

                if (selectedDate === currentDayStr) {
                    dayCell.classList.add('selected');
                }

                dayCell.addEventListener('click', () => {
                    document.querySelectorAll('.full-mode .cal-day.selected').forEach(el => el.classList.remove('selected'));
                    dayCell.classList.add('selected');
                    selectedDate = currentDayStr;
                    updateSelectedDateInfo(year, month, day, currentDayStr);
                });

                grid.appendChild(dayCell);
            }
            // Render list
            renderMonthEvents(date);
        }

        // AYIN ETKİNLİKLERİNİ LİSTELE
        function renderMonthEvents(date) {
            const listContainer = document.getElementById('month-events-list');
            if (!listContainer) return;

            listContainer.innerHTML = '';
            const year = date.getFullYear();
            const month = date.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            const specialDates = getAllSpecialDates(year);
            const notes = settings.calendarNotes || {};
            const monthEvents = [];

            for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                if (specialDates[dateStr]) {
                    monthEvents.push({ day: d, dateStr, title: specialDates[dateStr].title, type: 'system', class: specialDates[dateStr].class });
                }
                if (notes[dateStr]) {
                    monthEvents.push({ day: d, dateStr, title: notes[dateStr], type: 'note' });
                }
            }

            if (monthEvents.length === 0) {
                listContainer.innerHTML = '<div style="font-size:0.9rem; color:var(--cal-text-light); text-align:center; padding:20px; border:1px dashed var(--cal-border); border-radius:12px;">Bu ay için kayıtlı etkinlik yok. ✨</div>';
                return;
            }

            monthEvents.sort((a, b) => a.day - b.day);

            monthEvents.forEach(evt => {
                const dayName = new Date(evt.dateStr).toLocaleDateString('tr-TR', { weekday: 'short' });
                const item = document.createElement('div');
                item.className = 'event-card-mini';

                let icon = 'fa-calendar-day';
                if (evt.type === 'note') icon = 'fa-sticky-note';
                if (evt.class === 'event-nisan') icon = 'fa-ring';
                if (evt.class === 'event-nikah') icon = 'fa-heart';

                item.innerHTML = `
                    <div class="event-date-tag">${evt.day} ${dayName}</div>
                    <div style="flex:1;">
                        <div style="font-size:0.95rem; font-weight:600; color:var(--cal-text);">${evt.title}</div>
                        <div style="font-size:0.75rem; color:var(--cal-text-light); font-weight:600; text-transform:uppercase;">${evt.type === 'note' ? 'Kişisel Not' : 'Özel Tarih'}</div>
                    </div>
                    <i class="fas ${icon}" style="opacity:0.3; font-size:1.1rem; color:var(--cal-primary);"></i>
                `;

                item.onclick = () => {
                    const days = grid.querySelectorAll('.cal-day');
                    days.forEach(dayEl => {
                        if (parseInt(dayEl.textContent) === evt.day && !dayEl.classList.contains('empty')) {
                            dayEl.click();
                            dayEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    });
                };
                listContainer.appendChild(item);
            });
        }

        function updateSelectedDateInfo(year, month, day, dateStr) {
            const dateObj = new Date(year, month, day);
            const friendlyDate = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });

            if (selectedDateTitle) selectedDateTitle.textContent = friendlyDate;

            // Eğer detaylar gizliyse göster
            const detailsContainer = document.getElementById('calendar-date-details');
            if (detailsContainer) detailsContainer.classList.remove('hidden');

            // İçerik: Olay varsa göster, yoksa "Not Ekle" butonu
            let contentHtml = '';
            const specialDates = getAllSpecialDates(year);

            // Sistem Olayı
            if (specialDates[dateStr]) {
                contentHtml += `<div style="margin-bottom:8px;"><strong style="color:var(--primary-color)">${specialDates[dateStr].title}</strong></div>`;
            }

            // Kullanıcı Notu
            const userNote = settings.calendarNotes[dateStr];
            if (userNote) {
                contentHtml += `<div style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                    <span>📝 ${userNote}</span>
                    <button class="btn-icon-sm delete-note" data-date="${dateStr}" style="color:#e74c3c"><i class="fas fa-trash"></i></button>
                </div>`;
            }

            // Not Ekle/Düzenle Butonu
            contentHtml += `
            <div style="margin-top:8px;">
                ${userNote ? '' : '<button id="btn-add-note" class="btn-small-outline" style="width:100%"><i class="fas fa-plus"></i> Not Ekle</button>'}
            </div>`;

            if (selectedDateInfo) {
                selectedDateInfo.innerHTML = contentHtml;

                // Event Listeners for Dynamic Buttons
                const btnAdd = selectedDateInfo.querySelector('#btn-add-note');
                if (btnAdd) {
                    btnAdd.addEventListener('click', () => {
                        openNoteModal(dateStr, friendlyDate);
                    });
                }

                const btnDelete = selectedDateInfo.querySelector('.delete-note');
                if (btnDelete) {
                    btnDelete.addEventListener('click', (e) => {
                        const d = e.currentTarget.dataset.date;
                        delete settings.calendarNotes[d];
                        saveData();
                        renderCalendar(new Date(year, month, 1));
                        updateUpcomingList(); // Update home slide !!

                        setTimeout(() => {
                            const newCells = grid.querySelectorAll('.cal-day');
                            newCells.forEach(cell => {
                                if (parseInt(cell.textContent) === day && !cell.classList.contains('empty')) {
                                    cell.click();
                                }
                            });
                        }, 50);
                    });
                }
            }
        }

        prevBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar(currentDate);
        });

        nextBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar(currentDate);
        });

        const btnToday = document.getElementById('btn-today');
        if (btnToday) {
            btnToday.addEventListener('click', () => {
                currentDate = new Date();
                selectedDate = null;
                renderCalendar(currentDate);
            });
        }

        // SWIPE DESTEĞİ (AY GEÇİŞLERİ İÇİN)
        let calTouchStartX = 0;
        grid.addEventListener('touchstart', (e) => {
            calTouchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        grid.addEventListener('touchend', (e) => {
            const diff = calTouchStartX - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 70) {
                if (diff > 0) nextBtn.click();
                else prevBtn.click();
            }
        }, { passive: true });

        // İlk render (Full)
        renderCalendar(currentDate);
        updateUpcomingList(); // Init home list

        // Window Functions
        window.refreshFullCalendar = function () {
            renderCalendar(new Date());
            updateUpcomingList();
        };

        // =========================================================
        // NOT EKLEME MODALI (Custom UI)
        // =========================================================
        function openNoteModal(dateStr, friendlyDate) {
            const modal = document.getElementById('modal-add-note');
            const dateDisplay = document.getElementById('note-date-display');
            const input = document.getElementById('note-input');
            const btnSave = document.getElementById('btn-save-note-confirm');

            if (!modal || !input || !btnSave) return;

            const d = new Date(dateStr);
            const currentYear = d.getFullYear();
            const currentMonth = d.getMonth();
            const currentDay = d.getDate();

            if (dateDisplay) dateDisplay.textContent = friendlyDate;
            input.value = settings.calendarNotes[dateStr] || '';

            // Clean previous listeners
            const newBtn = btnSave.cloneNode(true);
            btnSave.parentNode.replaceChild(newBtn, btnSave);

            newBtn.addEventListener('click', () => {
                const note = input.value.trim();

                if (note) {
                    settings.calendarNotes[dateStr] = note;
                } else {
                    delete settings.calendarNotes[dateStr];
                }

                saveData();
                renderCalendar(new Date(currentYear, currentMonth, 1)); // Refresh grid
                updateUpcomingList(); // Update home slide

                // Re-select date
                setTimeout(() => {
                    const days = grid.querySelectorAll('.cal-day');
                    days.forEach(dayEl => {
                        if (parseInt(dayEl.textContent) === currentDay && !dayEl.classList.contains('empty')) {
                            dayEl.click();
                        }
                    });
                }, 50);

                if (window.closeModalHelper) {
                    window.closeModalHelper(modal);
                } else {
                    modal.classList.add('hidden');
                }
            });

            // Open Modal
            if (window.openModal) {
                window.openModal('modal-add-note');
            } else {
                modal.classList.remove('hidden');
            }

            setTimeout(() => input.focus(), 100);
        }

        // =========================================================
        // MINI KALENDER (Home Carousel İçin)
        // =========================================================
        renderMiniCalendar();
    }

    // YAKLAŞAN TARİHLER (Home Slide 3 Logic)
    function updateUpcomingList() {
        const container = document.getElementById('home-upcoming-list');
        if (!container) return;

        container.innerHTML = '';
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const currentYear = today.getFullYear();
        const nextYear = currentYear + 1; // Gelecek yılın tatillerini de alalım (yıl sonuna yakınsak)

        // 1. Sistem Olayları (Nişan/Nikah + Tatiller)
        const events = [];

        // a) Nişan/Nikah
        if (settings.dates) {
            if (settings.dates.engagement) events.push({ date: settings.dates.engagement, title: 'Nişan Günü 💍', type: 'system' });
            if (settings.dates.wedding) events.push({ date: settings.dates.wedding, title: 'Büyük Gün (Nikah) 💒', type: 'system' });
        }

        // b) Standart Tatiller (Bu yıl ve gelecek yıl)
        const holidaysCurrent = getStandardHolidays(currentYear);
        Object.keys(holidaysCurrent).forEach(date => {
            events.push({ date: date, title: holidaysCurrent[date].title, type: 'holiday' });
        });

        const holidaysNext = getStandardHolidays(nextYear);
        Object.keys(holidaysNext).forEach(date => {
            events.push({ date: date, title: holidaysNext[date].title, type: 'holiday' });
        });

        // 2. Kullanıcı Notları
        if (settings.calendarNotes) {
            Object.keys(settings.calendarNotes).forEach(date => {
                events.push({ date: date, title: settings.calendarNotes[date], type: 'user' });
            });
        }

        // 3. Filtrele ve Sırala
        const upcoming = events.filter(e => {
            return new Date(e.date) >= today;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));

        // 4. Render
        if (upcoming.length === 0) {
            container.innerHTML = '<div style="font-size:0.8rem; opacity:0.7;">Yaklaşan etkinlik yok.</div>';
            return;
        }

        // İlk 3 tanesini göster
        upcoming.slice(0, 3).forEach(evt => {
            const dateObj = new Date(evt.date);
            const dateStr = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
            const dayName = dateObj.toLocaleDateString('tr-TR', { weekday: 'short' });

            // Renkler
            let badgeBg = 'var(--primary-light)';
            let badgeColor = 'var(--primary-dark)';

            if (evt.type === 'user') {
                badgeBg = '#e8daef'; // Light purple
                badgeColor = '#8e44ad';
            } else if (evt.type === 'holiday') {
                badgeBg = '#fdebd0'; // Light orange
                badgeColor = '#d35400';
            }

            const div = document.createElement('div');
            div.className = 'upcoming-item';
            div.style.cssText = 'display:flex; align-items:center; width:100%; background:var(--bg-color); padding:6px 10px; border-radius:8px;';

            div.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; background:${badgeBg}; color:${badgeColor}; padding:4px 8px; border-radius:6px; margin-right:10px; min-width:45px;">
                    <span style="font-size:0.7rem; font-weight:700;">${dateStr}</span>
                    <span style="font-size:0.6rem; opacity:0.8;">${dayName}</span>
                </div>
                <div style="flex:1;">
                    <div style="font-size:0.85rem; font-weight:500; color:var(--text-color);">${evt.title}</div>
                </div>
            `;
            container.appendChild(div);
        });
    }

    function renderMiniCalendar() {
        const miniGrid = document.getElementById('calendar-grid'); // index.html satır 190
        const miniMonthYear = document.getElementById('cal-month-year');
        const miniPrev = document.getElementById('cal-prev-month');
        const miniNext = document.getElementById('cal-next-month');

        if (!miniGrid) return;

        let miniDate = new Date();

        function drawMini(date) {
            miniGrid.innerHTML = '';
            const year = date.getFullYear();
            const month = date.getMonth();

            const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
            if (miniMonthYear) miniMonthYear.textContent = `${monthNames[month]} ${year}`;

            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            let startOffset = firstDay === 0 ? 6 : firstDay - 1;

            for (let i = 0; i < startOffset; i++) {
                const empty = document.createElement('div');
                empty.className = 'cal-day empty'; // CSS aynı
                miniGrid.appendChild(empty);
            }

            const today = new Date();

            for (let day = 1; day <= daysInMonth; day++) {
                const cell = document.createElement('div');
                cell.className = 'cal-day';
                cell.textContent = day;

                const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                    cell.classList.add('today');
                }

                // Sistem Olayı (Mini'de de göster)
                // Özel tarihleri tekrar hesapla veya scope dışına taşı. 
                // Basitçe burada tekrar bakalım settings.dates'e
                if (settings && settings.dates) {
                    if (settings.dates.engagement === dStr) cell.classList.add('has-event', 'event-nisan');
                    if (settings.dates.wedding === dStr) cell.classList.add('has-event', 'event-nikah');
                }

                miniGrid.appendChild(cell);
            }
        }

        if (miniPrev) miniPrev.addEventListener('click', (e) => {
            e.stopPropagation(); // Carousel swipe karışmasın
            miniDate.setMonth(miniDate.getMonth() - 1);
            drawMini(miniDate);
        });

        if (miniNext) miniNext.addEventListener('click', (e) => {
            e.stopPropagation();
            miniDate.setMonth(miniDate.getMonth() + 1);
            drawMini(miniDate);
        });

        drawMini(miniDate);
        console.log("✅ Mini takvim render edildi");
    }

    // =========================================================================
    // 13. ANA SAYFA CAROUSEL (Nişan/Nikah Kartları Carousel)
    // =========================================================================
    function setupHomeCarousel() {
        const track = document.getElementById('home-carousel-track');
        if (!track) {
            console.warn('⚠️ Home carousel track bulunamadı');
            return;
        }

        const slides = track.querySelectorAll('.carousel-slide');
        if (slides.length === 0) {
            console.warn('⚠️ Carousel slide bulunamadı');
            return;
        }

        let currentSlide = 0;
        let touchStartX = 0;
        let touchEndX = 0;
        let touchStartY = 0;
        let touchEndY = 0;

        function updateCarousel() {
            const offset = -currentSlide * 100;
            track.style.transform = `translateX(${offset}%)`;
            track.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

            // Dot göstergelerini güncelle
            const dots = document.querySelectorAll('.carousel-dots-container .c-dot');
            dots.forEach((dot, idx) => {
                if (idx === currentSlide) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });

            console.log(`📍 Carousel slide: ${currentSlide + 1}/${slides.length}`);
        }

        // Touch event handlers
        track.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
            track.style.transition = 'none'; // Smooth dragging
            e.stopPropagation(); // Main swipe'a karışma
        }, { passive: false });

        track.addEventListener('touchmove', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;

            const diffX = touchEndX - touchStartX;
            const diffY = Math.abs(touchEndY - touchStartY);

            // Sadece yatay hareket varsa live preview
            if (Math.abs(diffX) > diffY) {
                e.stopPropagation(); // Main swipe'a karışma
                const currentOffset = -currentSlide * 100;
                const dragOffset = (diffX / track.offsetWidth) * 100;
                track.style.transform = `translateX(${currentOffset + dragOffset}%)`;
            }
        }, { passive: false });

        track.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;

            const diffX = touchStartX - touchEndX;
            const diffY = Math.abs(touchStartY - touchEndY);

            // Yatay kaydırma tespit et (minimum 50px, dikey hareket küçük)
            if (Math.abs(diffX) > 50 && diffY < 100) {
                // Event'in yukarı taşınmasını engelle (main swipe navigation ile çakışmasın)
                e.stopPropagation();

                if (diffX > 0) {
                    // Sola kaydırma -> Sonraki slide
                    if (currentSlide < slides.length - 1) {
                        currentSlide++;
                        console.log('👈 Carousel: Sonraki slide');
                    }
                } else {
                    // Sağa kaydırma -> Önceki slide
                    if (currentSlide > 0) {
                        currentSlide--;
                        console.log('👉 Carousel: Önceki slide');
                    }
                }
            }

            updateCarousel();
        }, { passive: true });

        // Takvim kartına tıklayınca büyük takvimi aç
        const calendarSlide = track.querySelector('.calendar-slide');
        if (calendarSlide) {
            calendarSlide.addEventListener('click', (e) => {
                // Eğer çok az hareket ettiyse (tıklama) aç
                const diffX = Math.abs(touchStartX - touchEndX);
                const diffY = Math.abs(touchStartY - touchEndY);

                // Mouse ile tıklamada touch değerleri 0 olabilir veya eski kalabilir.
                // Basitçe: Eğer swipe yapılmadıysa (diff < 10) aç.
                // Veya mouse click ise (screenX/Y yoksa) aç.

                // Güvenli yöntem: Swipe sırasında click tetiklenmez genelde,
                // ama biz preventDefault yapmadığımız için tetiklenebilir.
                // O yüzden kontrol şart.

                if (diffX < 10 && diffY < 10) {
                    console.log("📅 Takvim kartına tıklandı -> Büyük takvim açılıyor");

                    // Takvimi güncel tarihle yenile
                    if (window.refreshFullCalendar) {
                        window.refreshFullCalendar();
                    }

                    // Eğer modal fonksiyonu varsa çağır
                    if (window.openModal) {
                        window.openModal('modal-full-calendar');
                    } else if (openModal) {
                        openModal('modal-full-calendar');
                    }
                }
            });
            // Tıklanabilir olduğunu göster
            calendarSlide.style.cursor = 'pointer';
        }

        // İlk pozisyonu ayarla
        updateCarousel();
        console.log('✅ Home carousel kuruldu');
    }


    // =========================================================================
    // 15. SÜRÜKLE-BIRAK SIRALAMA SENKRONİZASYONU
    // =========================================================================
    function setupReorderListeners() {
        ['ceyiz-list', 'damat-list'].forEach(listId => {
            const listContainer = document.getElementById(listId);
            if (!listContainer) return;

            listContainer.addEventListener('itemsReordered', (e) => {
                const type = listId.split('-')[0];
                console.log(`🔄 Sıralama Değişti: ${type}`);

                // DOM'daki yeni sırayı al (ID listesi olarak)
                const newOrderIds = Array.from(listContainer.children)
                    .filter(el => el.classList.contains('item-card'))
                    .map(el => el.dataset.id);

                if (newOrderIds.length === 0) return;

                // 1. Bu tipteki ürünleri ve diğerlerini ayır
                const otherTypes = items.filter(i => i.type !== type);
                const currentTypeItems = items.filter(i => i.type === type);

                // 2. Bu tipteki ürünleri yeni sıraya göre diz
                const reorderedItems = newOrderIds.map(id => {
                    return currentTypeItems.find(i => i.id === id);
                }).filter(Boolean); // Güvenlik önlemi

                // 3. Birleştir ve kaydet
                // Not: Orijinal dizindeki yerlerini korumak yerine, 
                // bu tipteki ürünleri topluca başa/sona koyabiliriz ama 
                // genel listenin bütünlüğünü korumak en iyisidir.
                items = [...otherTypes, ...reorderedItems];

                saveData();
                console.log(`✅ ${type} sıralaması kalıcı olarak kaydedildi.`);
            });
        });
    }


    // =========================================================================
    // BAŞLATMA ZİNCİRİNE EKLEMELER
    // =========================================================================
    setupSearch();
    setupSwipeNavigation(); // Yatay kaydırma ile sayfa değiştirme
    setupHomeCarousel(); // Ana sayfa carousel (Nişan/Nikah kartları)
    // Diğer initler DOMContentLoaded sonunda zaten var

    // BAŞLATMA
    // =========================================================================
    loadData();
    initTheme(); // Tema tercihini uygula
    setupThemeListeners(); // Dinleyiciyi tak (Not: Modal DOM'da statikse çalışır)
    setupSettingsListeners(); // Ayarlar ve tarih dinleyicileri
    setupSettingsListeners(); // Ayarlar ve tarih dinleyicileri
    // alert("🐛 DEBUG: setupDataSafetyListeners Çağrılıyor...");
    setupDataSafetyListeners(); // Veri Güvenliği ve Bulut Senkronizasyonu (YENİ)
    setupBudgetListeners(); // Bütçe dinleyicileri (YENİ)
    setupReorderListeners(); // Sıralama dinleyicileri (YENİ)
    setupHistoryListeners(); // Geçmiş modalı dinleyicisi (YENİ)

    renderApp();
    setupFullCalendar(); // Tam ekran takvim

    switchTab('home'); // Başlangıç tabı
    console.log("✅ Uygulama Başarıyla Başlatıldı!");

    // EXPOSE TO GLOBAL SCOPE (For missing_funcs.js helpers)
    window.appData = {
        getItems: () => items,
        setItems: (newItems) => { items = newItems; },
        getUserCategories: () => userCategories,
        setUserCategories: (newCats) => { userCategories = newCats; },
        getDefaultCategories: () => defaultCategories,
        saveData: saveData,
        renderList: renderList,
        renderApp: renderApp
    };
    console.log("🔓 App Data Expose Edildi:", window.appData);

    // --- Daily Romantic Messages ---
    const romanticMessages = [
        "Seninle geçen her gün, hayatımın en güzel hediyesi. ✨",
        "Kalbimin her atışında senin adın yazıyor. ❤️",
        "Gözlerine her baktığımda, yeniden aşık oluyorum. 🌟",
        "Seninle bir ömür, hayallerimin de ötesinde. 💍",
        "Dünyadaki en şanslı insanım çünkü sen yanımdasın. ✨",
        "Her sabah seninle uyanma fikri bile içimi ısıtıyor. ☕",
        "Gülüşün, karanlık dünyamı aydınlatan en parlak ışık. ✨",
        "Seninle kurduğumuz her hayal, gerçeğe bir adım daha yakın. 🏡",
        "Hayat yolculuğunda elimi tuttuğun için teşekkür ederim. ❤️",
        "Sen benim hem şimdiki zamanım, hem de geleceğimsin. ⏳",
        "Ruhunun güzelliği yüzüne yansımış, meleğim. 👼",
        "Sesini duymak, en sevdiğim melodi. 🎶",
        "Seninle her zorluk, aşılması kolay bir engel. 💪",
        "Kalbimin ritmi, senin varlığınla anlam kazanıyor. ❤️",
        "Dünyanın en güzel kadınıyla evleneceğim için çok heyecanlıyım. 💍",
        "Sen benim bitmeyen şarkım, bitmeyecek masalımsın. ✨",
        "Varlığın, hayatıma kattığın en büyük zenginlik. 🎉",
        "Seninle el ele yürümek, dünyanın en güzel yolu. 🛣️",
        "Kalbimdeki yerin hiçbir zaman değişmeyecek. ❤️",
        "Sen benim can yoldaşım, hayat arkadaşımsın. 💍",
        "Gözlerin bana cenneti hatırlatıyor. ✨",
        "Seninle geçen her an, bir ömre bedel. ⏳",
        "Hayatımın başrolü, kalbimin prensesi... ❤️",
        "Seninle her yer evim, her an huzur dolu. 🏡",
        "Sonsuzluğa seninle yürümek istiyorum. ✨",
        "Kalbindeki sevgi, benim en büyük sığınağım. ❤️",
        "Seninle her gün yeni bir macera, yeni bir mutluluk. 🌟",
        "Gülüşünle dünyayı dize getirebilirsin, güzelim. ✨",
        "Sen benim hayatımın en doğru kararıydın. ❤️",
        "Ruh eşim, sevgilim, her şeyim... ✨",
        "Seninle yaşlanmak, hayal edebileceğim en güzel son. ⏳",
        "Kalbimin anahtarı sonsuza dek sende kalacak. 🔑",
        "Seninle paylaştığımız her anı, kalbime altın harflerle yazdım. ✨",
        "Gözlerindeki ışık, yolumu aydınlatan fenerim. 🏮",
        "Seninle her şey daha renkli, daha canlı. 🌈",
        "Hayatımdaki en güzel mucize sensin. ✨",
        "Senin sevginle besleniyor, seninle büyüyorum. ❤️",
        "Sen benim huzur limanımsın, bitanem. ✨",
        "Yüzündeki tek bir gülümseme için dünyaları veririm. 🌍",
        "Seninle her mevsim bahar, her gün bayram. 🎉",
        "Kalbimin en derin köşesinde sadece sen varsın. ❤️",
        "Sen benim kabul olmuş duamsın. 🤲",
        "Neşe kaynağım, huzur pınarım benim. 💧",
        "Seni sevmek, nefes almak kadar doğal. 🌬️",
        "Bakışların ruhumu dinlendiriyor. 🌿",
        "Sen yanımdayken zaman dursun istiyorum. ⏳",
        "Mutluluğun tanımı, senin adında saklı. 😊",
        "Seni düşünmek bile günümü güzelleştiriyor. 💭",
        "Sen benim en kıymetli hazinemsin. 💎",
        "Aşkın, kalbimi ısıtan en güzel güneş. ☀️",
        "Seninle her şey mümkün, imkansız diye bir şey yok. 🚀",
        "Gözlerin, kaybolmak istediğim tek deniz. 🌊",
        "Sen benim tamamlayıcı parçam, diğer yarımsın. 🧩",
        "Seni her gün, dünden daha çok seviyorum. 📈",
        "Sesin, yorgunluğumu alan en güzel ilaç. 💊",
        "Varlığınla hayatım çiçek açıyor. 🌸",
        "Sen benim en güzel iyikimsin. ✅",
        "Seni sevmek bir ayrıcalık, seninle olmak bir ödül. 🏆",
        "Kalbim sadece senin için atıyor. 💓",
        "Sen benim sonsuz sevdam, bitmeyen aşkımsın. ∞",
        "Gülüşün, en gri günlerimi bile renklendiriyor. 🎨",
        "Seni gördüğüm an, dünyam güzelleşiyor. 👀",
        "Sen benim hayallerimin gerçeğe dönüşmüş halisin. 🧞‍♂️",
        "Her zerremle sana aşığım. ❤️‍🔥",
        "Seninle kurduğumuz yuva, en güvenli kalem. 🏰",
        "Aşkınla beni dünyanın en güçlü insanı yapıyorsun. 💪",
        "Seni sevmek, hayatın tadını çıkarmak demek. 🍭",
        "Sen benim başımın tacı, gönlümün sultanısın. 👑",
        "Ellerini tutunca tüm dertlerimi unutuyorum. 🤝",
        "Sen benim en güzel şiirim, en tatlı şarkımsın. 📜",
    ];

    window.updateDailyMessage = function () {
        const textElem = document.getElementById('special-message-text');
        if (!textElem) return;

        // Her 10 dakikada bir değişen indeks (10 dk = 600,000 ms)
        const intervalMs = 10 * 60 * 1000;
        const now = Date.now();
        const intervalIndex = Math.floor(now / intervalMs);

        // Modulo ile dizi sınırlarında kal
        const msgIndex = intervalIndex % romanticMessages.length;

        textElem.textContent = romanticMessages[msgIndex];
        console.log("💌 Romantik Mesaj Güncellendi (Sıra:", msgIndex, ")");
    };

    window.toggleSpecialMessage = function () {
        const card = document.querySelector('.special-message-card');
        if (card) {
            const isOpening = !card.classList.contains('active');
            if (isOpening) {
                window.updateDailyMessage();
            }
            card.classList.toggle('active');
            console.log("💌 Mesaj Kutusu:", card.classList.contains('active') ? "Açıldı" : "Kapandı");
        }
    };

    updateDailyMessage();
    setupPhotoListeners();
    setupViewerListeners();

    /* Demo button listener removed. */

    // YENİ: Otomatik demo veri ekleme mantığı kaldırıldı (Kullanıcı isteği: Tam sıfırlama)
    // const hasDemoItem = items.some(i => i.id === 'mock-demo-fridge');
    // if (!hasDemoItem) ...

    // KİŞİSELLEŞTİRİLMİŞ ONAY MODALI
    window.showConfirm = function (title, message, onConfirm, confirmBtnText = "Evet, Sil") {
        const modal = document.getElementById('modal-confirmation');
        const titleEl = document.getElementById('confirm-title');
        const msgEl = document.getElementById('confirm-message');
        const btnConfirm = document.getElementById('btn-confirm-action');

        if (!modal || !titleEl || !msgEl || !btnConfirm) return;

        titleEl.textContent = title;
        msgEl.innerHTML = message.replace(/\n/g, '<br>');
        if (btnConfirm) btnConfirm.textContent = confirmBtnText;

        // Temizle ve yeni listener ekle (Clone methodu ile eski listenerları sil)
        const newBtn = btnConfirm.cloneNode(true);
        btnConfirm.parentNode.replaceChild(newBtn, btnConfirm);

        newBtn.addEventListener('click', () => {
            window.closeModal('modal-confirmation');
            if (onConfirm) onConfirm();
        });

        window.openModal('modal-confirmation');
        modal.classList.add('active'); // CSS display:block rule requires this
    };

    // TAM VERİ SIFIRLAMA (Hard Reset) - Custom Modal ile
    const btnReset = document.getElementById('btn-reset-app-data');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            window.showConfirm(
                'Tüm Verileri Sıfırla',
                '⚠️ DİKKAT: Tüm verileriniz (ürünler, bütçeler, ayarlar) silinecek ve uygulama fabrika ayarlarına dönecektir.\n\nİşlemden sonra kısa bir süre geri alma şansınız olacak. Devam etmek istiyor musunuz?',
                () => {
                    // 1. YEDEKLE (Restore Point)
                    const currentData = localStorage.getItem(STORAGE_KEY);
                    if (currentData) {
                        const restoreData = {
                            timestamp: Date.now(),
                            data: currentData
                        };
                        localStorage.setItem('restore_point', JSON.stringify(restoreData));
                    }

                    // 2. SİL
                    localStorage.removeItem(STORAGE_KEY);
                    localStorage.removeItem('darkMode');
                    location.reload();
                }
            );
        });
    }

    // YEDEKLENMİŞ VERİYİ KONTROL ET (UNDO İMKANI)
    const restorePoint = localStorage.getItem('restore_point');
    if (restorePoint) {
        try {
            const parsed = JSON.parse(restorePoint);
            const diff = Date.now() - parsed.timestamp;
            const limit = 5 * 60 * 1000; // 5 dakika

            if (diff < limit) {
                // Geri alma butonu göster (Compact UI)
                const undoDiv = document.createElement('div');
                undoDiv.className = 'undo-notification';
                undoDiv.innerHTML = `
                    <span>⚠️ Veriler silindi.</span>
                    <div style="display:flex; gap:5px;">
                        <button id="btn-undo-reset">Geri Al</button>
                        <button id="btn-dismiss-undo" class="btn-dismiss">✕</button>
                    </div>
                `;
                document.body.appendChild(undoDiv);

                document.getElementById('btn-undo-reset').addEventListener('click', () => {
                    window.showConfirm(
                        'Geri Yükleme',
                        'Silinen veriler geri yüklensin mi?',
                        () => {
                            localStorage.setItem(STORAGE_KEY, parsed.data);
                            localStorage.removeItem('restore_point');

                            // Toast mesajı
                            if (window.showToast) window.showToast('Veriler kurtarıldı! ♻️');

                            setTimeout(() => location.reload(), 1000);
                        }
                    );
                });

                document.getElementById('btn-dismiss-undo').addEventListener('click', () => {
                    localStorage.removeItem('restore_point');
                    undoDiv.remove();
                });

                // --- SÜRÜKLE BIRAK (DRAG & DROP) ---
                let isDragging = false;
                let dragTimer = null;
                let startX, startY, initialLeft, initialTop;

                const startDragTimer = (e) => {
                    // Sadece sol tık veya touch
                    if (e.type === 'mousedown' && e.button !== 0) return;

                    // Görsel Geri Bildirim: Pressing
                    undoDiv.classList.add('pressing');

                    dragTimer = setTimeout(() => {
                        isDragging = true;
                        undoDiv.classList.remove('pressing'); // Pressing bitti, dragging başladı
                        undoDiv.classList.add('ready-to-drag');
                        undoDiv.classList.add('dragging');

                        // Titreşim (Mobil için)
                        if (navigator.vibrate) navigator.vibrate(50);

                        // Başlangıç koordinatlarını al
                        const rect = undoDiv.getBoundingClientRect();

                        // Transform etkisini kaldır ve absolute pozisyona geç
                        undoDiv.style.transform = 'none';
                        undoDiv.style.left = rect.left + 'px';
                        undoDiv.style.top = rect.top + 'px';
                        undoDiv.style.bottom = 'auto'; // Bottom iptal
                        undoDiv.style.position = 'fixed';

                        // Mouse/Touch başlangıç noktası
                        const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
                        const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

                        startX = clientX;
                        startY = clientY;
                        initialLeft = rect.left;
                        initialTop = rect.top;

                    }, 600); // 0.6 saniye (Snappier)
                };

                const clearDragTimer = () => {
                    if (dragTimer) {
                        clearTimeout(dragTimer);
                        dragTimer = null;
                    }
                };

                const stopDrag = () => {
                    clearDragTimer();
                    undoDiv.classList.remove('pressing'); // Erken bırakırsa pressing sil
                    if (isDragging) {
                        isDragging = false;
                        undoDiv.classList.remove('dragging');
                        // ready-to-drag kalabilir veya silinebilir, görsel tercihe bağlı
                    }
                };

                const moveDrag = (e) => {
                    if (!isDragging) return;
                    e.preventDefault(); // Scroll engelle

                    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
                    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

                    const dx = clientX - startX;
                    const dy = clientY - startY;

                    undoDiv.style.left = `${initialLeft + dx}px`;
                    undoDiv.style.top = `${initialTop + dy}px`;
                };

                // Event Listeners
                undoDiv.addEventListener('mousedown', startDragTimer);
                undoDiv.addEventListener('touchstart', startDragTimer);

                document.addEventListener('mouseup', stopDrag);
                document.addEventListener('touchend', stopDrag);

                document.addEventListener('mousemove', moveDrag);
                document.addEventListener('touchmove', moveDrag, { passive: false });

                // Süre dolunca otomatik sil
                setTimeout(() => {
                    localStorage.removeItem('restore_point');
                    if (undoDiv.parentNode) undoDiv.remove();
                }, limit - diff);

            } else {
                // Süresi geçmiş, temizle
                localStorage.removeItem('restore_point');
            }
        } catch (e) {
            console.error("Restore point hatası:", e);
            localStorage.removeItem('restore_point');
        }
    }

    // =========================================================================
    // LIST STATISTICS MODAL
    // =========================================================================

    window.showListStats = function (type) {
        const modal = document.getElementById('modal-list-stats');
        if (!modal) {
            console.error("Statistics modal not found.");
            return;
        }

        const typeItems = items.filter(i => i.type === type);
        const completed = typeItems.filter(i => i.isBought);
        const totalPrice = typeItems.reduce((sum, i) => sum + (i.price || 0), 0);
        const progress = typeItems.length > 0 ? Math.round((completed.length / typeItems.length) * 100) : 0;

        // Visual Colors & Icons
        const isCeyiz = type === 'ceyiz';
        const color = isCeyiz ? '#FFB7B2' : '#a29bfe';
        const icon = isCeyiz ? 'fa-home' : 'fa-user-tie';
        const title = isCeyiz ? 'Çeyiz' : 'Bohça';

        // Update Modal Content
        const iconContainer = document.getElementById('stats-icon-container');
        if (iconContainer) iconContainer.style.background = color;

        const mainIcon = document.getElementById('stats-main-icon');
        if (mainIcon) mainIcon.className = `fas ${icon}`;

        const modalTitle = document.getElementById('stats-modal-title');
        if (modalTitle) modalTitle.textContent = title;

        const progressBar = document.getElementById('stat-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
            progressBar.style.background = color;
        }

        const progressRatio = document.getElementById('stat-progress-ratio');
        if (progressRatio) progressRatio.textContent = `${completed.length}/${typeItems.length}`;

        const progressPercent = document.getElementById('stat-progress-percent');
        if (progressPercent) {
            progressPercent.textContent = `%${progress}`;
            progressPercent.style.color = color;
        }

        const priceEl = document.getElementById('stat-total-price');
        if (priceEl) priceEl.textContent = `₺${totalPrice.toLocaleString()}`;

        // Open modal
        window.openModal('modal-list-stats');
    };

});
