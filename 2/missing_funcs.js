
// --- Missing Helper Functions ---

function updateAllCategoryDropdowns() {
    const selects = document.querySelectorAll('#qa-category-select, #item-category');
    selects.forEach(select => {
        if (!select) return;
        // Keep first option (placeholder)
        const first = select.firstElementChild;
        select.innerHTML = '';
        if (first) select.appendChild(first);

        // Determine type based on current tab or default to ceyiz
        const type = (currentTab === 'stats' || currentTab === 'home') ? 'ceyiz' : currentTab;
        const cats = getCategories(type);

        cats.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            select.appendChild(opt);
        });
    });
    window.appData.updateAllCategoryDropdowns = updateAllCategoryDropdowns;
}

function openQuickAddModal() {
    const modal = document.getElementById('modal-quick-add-category');
    if (modal) {
        // Reset form
        const name = document.getElementById('qa-product-name');
        const qty = document.getElementById('qa-qty');
        const price = document.getElementById('qa-price');
        const note = document.getElementById('qa-note');
        const err = document.getElementById('qa-error-msg');
        const title = modal.querySelector('.modal-title');

        if (title) title.textContent = 'Ürün Detayı 📝';
        delete modal.dataset.editId; // Clear edit mode

        if (name) name.value = '';
        if (qty) qty.value = 1;
        if (price) price.value = '';
        if (note) note.value = '';
        if (err) err.classList.add('hidden');

        updateAllCategoryDropdowns(); // Ensure categories are up to date

        modal.classList.remove('hidden');
        requestAnimationFrame(() => modal.classList.add('active'));
        document.body.classList.add('modal-open');

        if (name) name.focus();
    }
}

function closeQAModal() {
    const modal = document.getElementById('modal-quick-add-category');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.classList.add('hidden'), 300);
        document.body.classList.remove('modal-open');
    }
}

function saveQuickAddItem() {
    const modal = document.getElementById('modal-quick-add-category');
    const nameInput = document.getElementById('qa-product-name');
    const catSelect = document.getElementById('qa-category-select');
    const qtyInput = document.getElementById('qa-qty');
    const priceInput = document.getElementById('qa-price');
    const noteInput = document.getElementById('qa-note');
    const errorMsg = document.getElementById('qa-error-msg');

    if (!nameInput || !catSelect || !qtyInput) return;

    const name = nameInput.value.trim();
    const category = catSelect.value;
    const quantity = parseInt(qtyInput.value) || 1;
    const price = parseFloat(priceInput.value) || 0;
    const note = noteInput ? noteInput.value.trim() : '';

    if (!name) {
        if (errorMsg) { errorMsg.textContent = 'Ürün adı gerekli!'; errorMsg.classList.remove('hidden'); }
        return;
    }
    if (!category) {
        if (errorMsg) { errorMsg.textContent = 'Lütfen kategori seçin!'; errorMsg.classList.remove('hidden'); }
        return;
    }

    const editId = modal.dataset.editId;
    const currentType = (currentTab === 'stats' || currentTab === 'home') ? 'ceyiz' : currentTab;

    if (editId) {
        // Edit existing
        const idx = items.findIndex(i => i.id == editId);
        if (idx > -1) {
            items[idx] = {
                ...items[idx],
                name, category, quantity, price, note
            };
        }
    } else {
        // Add new
        items.push({
            id: Date.now(),
            type: currentType,
            name,
            category,
            quantity,
            price,
            note,
            isBought: false,
            dateAdded: new Date().toISOString()
        });
    }

    saveData();
    renderApp();
    closeQAModal();
    showToast(editId ? 'Ürün güncellendi ✅' : 'Ürün eklendi ✨', false);
}

