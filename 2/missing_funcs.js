
// =========================================================================
// EKSİK OLAN FONKSİYONLAR (SONRADAN EKLENDİ - TAMİR)
// =========================================================================

console.log("🧩 EKSTRA FONKSİYONLAR YÜKLENİYOR...");

// APP DATA ERİŞİM YARDIMCISI
function getAppData() {
    if (window.appData) return window.appData;
    console.error("❌ window.appData bulunamadı! app.js yüklenmemiş olabilir.");
    return null;
}

// 1. AYARLAR MODALINI AÇ
window.openSettings = function () {
    console.log("⚙️ Ayarlar açılıyor...");

    // loadSettingsUI fonksiyonu window scope'ta değilse, app.js'den dışarıya vermedik.
    // Ancak app.js içinde loadSettingsUI global tanımlanmış olabilir mi?
    // app.js view_file çıktısına göre loadSettingsUI DOMContentLoaded içinde değil, global tanımlı DEĞİL.
    // O yüzden loadSettingsUI'ye erişemeyiz.

    // ÇÖZÜM: Settings modalını açınca, app.js içindeki bir listener (eğer varsa) UI'yi doldurmalı.
    // Ama yoksa, manuel doldurmamız gerekir.

    // app.js'de "window.openModal" var.
    if (window.openModal) {
        window.openModal('modal-settings');

        // Settings UI doldurma (Manuel Fallback)
        const app = getAppData();
        // Settings verisine erişimimiz yok (settings dışarı verilmedi).
        // Ancak localStorage'dan okuyabiliriz!

        try {
            const stored = JSON.parse(localStorage.getItem('ceyiz_data_v2') || '{}');
            const settings = stored.settings || {};

            const nameInput = document.getElementById('setting-user-name');
            if (nameInput) nameInput.value = settings.userName || '';

            const partnerInput = document.getElementById('setting-partner-name');
            if (partnerInput) partnerInput.value = settings.partnerName || '';

            const engageInput = document.getElementById('input-date-nisan');
            if (engageInput && settings.dates && settings.dates.engagement) engageInput.value = settings.dates.engagement;

            const weddingInput = document.getElementById('input-date-nikah');
            if (weddingInput && settings.dates && settings.dates.wedding) weddingInput.value = settings.dates.wedding;

            // Dark Mode
            const darkToggle = document.getElementById('darkModeToggle');
            if (darkToggle) darkToggle.checked = document.body.classList.contains('dark-mode');

        } catch (e) {
            console.error("Settings load error:", e);
        }

    } else {
        console.error("❌ openModal bulunamadı!");
    }
};


// 2. ITEM DÜZENLEME (Listeden Tıklanınca) - app.js içindeki openQuickAddModal kullanılır.

// 3. ÖZEL MESAJ TOGGLE
window.toggleSpecialMessage = function () {
    const content = document.getElementById('special-message-content');
    const chevron = document.getElementById('message-chevron');
    if (content) {
        content.classList.toggle('active');
        if (chevron) {
            chevron.style.transform = content.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
        }
    }
};

// 4. KATEGORİ YÖNETİMİ
window.closeCategoryModal = function () {
    const modal = document.getElementById('modal-categories');
    if (modal && window.closeModalHelper) {
        window.closeModalHelper(modal);
    }
};

// Listener Ekleme (Güvenli)
function setupCategoryButton() {
    const btnManageCats = document.getElementById('btn-settings-manage-cats');
    if (btnManageCats) {
        // Event listener'ı temizlemeden eklersek duplicate olabilir.
        // Ama cloneNode yaparak temizleyebiliriz.
        const newBtn = btnManageCats.cloneNode(true);
        btnManageCats.parentNode.replaceChild(newBtn, btnManageCats);

        newBtn.addEventListener('click', () => {
            if (window.openModal) window.openModal('modal-categories');
            renderCategoriesManager();
        });
    }
}

// DOM Hazır Olunca Buton Setup
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupCategoryButton);
} else {
    setupCategoryButton();
}

// 5. KATEGORİ YÖNETİCİSİ RENDER
// 5. KATEGORİ YÖNETİCİSİ RENDER
window.renderCategoriesManager = function () {
    const container = document.getElementById('category-list-container');
    if (!container) return;

    const app = getAppData();
    if (!app) {
        container.innerHTML = "<p>Verilere erişilemiyor. Lütfen sayfayı yenileyin.</p>";
        return;
    }

    const userCategories = app.getUserCategories();
    const defaultCategories = app.getDefaultCategories();

    let html = '';

    ['ceyiz', 'damat'].forEach(type => {
        const title = type === 'ceyiz' ? 'Çeyiz' : 'Bohça';
        html += `<div class="cat-manage-section" style="margin-bottom: 25px; background: rgba(0,0,0,0.02); padding: 15px; border-radius: 16px;">`;
        html += `<h4 style="margin: 0 0 12px 0; text-transform:uppercase; font-size:0.75rem; color:var(--text-light); font-weight:700; letter-spacing: 0.5px;">${title} Kategorilerİ</h4>`;

        // Input Area
        html += `<div class="add-cat-form" style="display:flex; gap:8px; margin-bottom:15px;">
            <input type="text" id="new-cat-input-${type}" placeholder="Yeni ${title} kategorisi..." 
                style="flex:1; padding:8px 12px; border-radius:10px; border:1px solid var(--border-color); font-size:0.85rem; background:white;">
            <button onclick="window.addCategory('${type}')" class="btn-primary" 
                style="padding:8px 15px; border-radius:10px; font-size:0.8rem; height: auto;">Ekle</button>
        </div>`;

        html += `<div style="display:flex; flex-wrap:wrap; gap:8px;">`;

        // Varsayılanlar (Silinemez)
        if (defaultCategories[type]) {
            defaultCategories[type].forEach(c => {
                html += `<span class="category-tag-mini" title="Varsayılan kategori silinemez" 
                    style="background:#f0f0f0; padding:5px 10px; border-radius:10px; font-size:0.75rem; color:#888; border:1px solid #ddd; cursor:not-allowed;">${c}</span>`;
            });
        }

        // Kullanıcı Kategorileri (Silinebilir)
        if (userCategories[type] && userCategories[type].length > 0) {
            userCategories[type].forEach(c => {
                const safeCat = c.replace(/'/g, "\\'");
                html += `<span class="category-tag-mini user-cat" 
                    style="background:var(--primary-light); color:var(--primary-dark); padding:5px 10px; border-radius:10px; font-size:0.8rem; display:inline-flex; align-items:center; gap:6px; font-weight:600; border:1px solid var(--primary-color); opacity:0.9;">
                    ${c} 
                    <i class="fas fa-times-circle" onclick="window.deleteCategory('${type}', '${safeCat}')" 
                        style="cursor:pointer; color:var(--primary-color); font-size:1rem;"></i>
                 </span>`;
            });
        }

        html += `</div></div>`;
    });

    container.innerHTML = html;
};

// 6. KATEGORİ EKLEME
window.addCategory = function (type) {
    const input = document.getElementById(`new-cat-input-${type}`);
    if (!input) return;

    const catName = input.value.trim();
    if (!catName) return;

    const app = getAppData();
    if (!app) return;

    const userCats = app.getUserCategories();
    const defaultCats = app.getDefaultCategories();

    // Kontrol: Zaten var mı?
    if (defaultCats[type].includes(catName) || userCats[type].includes(catName)) {
        console.warn("⚠️ Kategori zaten mevcut:", catName);
        return;
    }

    userCats[type].push(catName);
    app.setUserCategories(userCats);
    app.saveData();
    renderCategoriesManager();
    console.log(`✅ Yeni kategori eklendi: ${catName} (${type})`);
};

// 7. KATEGORİ SİLME (Akıllı Kontrol)
window.deleteCategory = function (type, catName) {
    const app = getAppData();
    if (!app) return;

    // Kategorideki ürünleri kontrol et
    const items = app.getItems();
    const relatedItems = items.filter(i => i.type === type && i.category === catName);

    const performDelete = () => {
        const userCats = app.getUserCategories();
        userCats[type] = userCats[type].filter(c => c !== catName);
        app.setUserCategories(userCats);
        app.saveData();
        renderCategoriesManager();
        console.log(`🗑️ Kategori silindi: ${catName}`);
    };

    if (relatedItems.length > 0) {
        // Ürünler varsa özel uyarı göster
        const itemNames = relatedItems.map(i => i.name).join(', ');
        const message = `'${catName}' kategorisinde şu ürünler var:\n\n` +
            `<strong>${itemNames}</strong>\n\n` +
            `Devam edersen kategori silinecek. Emin misin?`;

        window.showCustomConfirm("Kategori Silinsin mi?", message, performDelete);
    } else {
        // Ürün yoksa direkt sil
        performDelete();
    }
};

// ÖZEL ONAY MODALI YARDIMCISI
window.showCustomConfirm = function (title, message, onConfirm) {
    const modal = document.getElementById('modal-custom-confirm');
    const titleElem = document.getElementById('confirm-title');
    const msgElem = document.getElementById('confirm-message');
    const okBtn = document.getElementById('confirm-ok-btn');
    const cancelBtn = document.getElementById('confirm-cancel-btn');

    if (!modal) return;

    titleElem.innerHTML = title;
    msgElem.innerHTML = message;

    // Event listener'ları temizlemek için cloneNode kullanıyoruz
    const newOkBtn = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);
    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('active'), 10);

    const close = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.classList.add('hidden'), 300);
    };

    newOkBtn.onclick = () => {
        onConfirm();
        close();
    };

    newCancelBtn.onclick = close;
};

console.log("✅ EKSTRA FONKSİYONLAR HAZIR (Safe Mode).");
