import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Camera, Save, Trash2 } from 'lucide-react';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, storage } from '../firebase';
import { useApp } from '../context/AppContext';
import type { ProductDraft } from '../types';
import { Modal } from './Modal';
import { useToast } from './Toast';

const emptyDraft = (categoryId = ''): ProductDraft => ({ name: '', categoryId, status: 'planned', quantity: 1, estimatedUnitPrice: 0, actualUnitPrice: 0, priority: 'normal', store: '', url: '', brand: '', colorModel: '', purchaseDate: '', targetDate: '', note: '', imageDataUrl: '', imageUrls: [], purchasedBy: 'together', isGift: false });

export function ProductForm() {
  const { categories, editingProduct, productFormOpen, closeProductForm, saveProduct } = useApp();
  const { showToast } = useToast();
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft());
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!productFormOpen) return;
    if (editingProduct) {
      const { id, createdAt, updatedAt, ...value } = editingProduct;
      void id; void createdAt; void updatedAt;
      setDraft(value);
    }
    else setDraft(emptyDraft(categories[0]?.id ?? ''));
    setFiles([]);
  }, [categories, editingProduct, productFormOpen]);

  const update = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.name.trim() || !draft.categoryId) return showToast('Ürün adı ve kategori zorunludur.', 'error');
    setSaving(true);
    try {
      const uploaded = await Promise.all(files.map(async (file) => {
        if (!file.type.startsWith('image/') || file.size > 8 * 1024 * 1024) throw new Error('Fotoğraflar 8 MB’den küçük bir görsel olmalıdır.');
        const path = `products/${auth.currentUser?.uid ?? 'unknown'}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const result = await uploadBytes(ref(storage, path), file, { contentType: file.type });
        return getDownloadURL(result.ref);
      }));
      await saveProduct({ ...draft, name: draft.name.trim(), imageUrls: [...(draft.imageUrls ?? []), ...uploaded] }, editingProduct?.id);
      showToast(editingProduct ? 'Ürün güncellendi.' : 'Ürün eklendi.');
      closeProductForm();
    } catch (error) { showToast(error instanceof Error ? error.message : 'Ürün kaydedilemedi.', 'error'); }
    finally { setSaving(false); }
  }

  return <Modal open={productFormOpen} onClose={closeProductForm} title={editingProduct ? 'Ürünü düzenle' : 'Yeni ürün'} subtitle="Bilgiler diğer cihazlarda anında eşitlenir." wide>
    <form onSubmit={submit} className="form-grid">
      <label className="span-2">Ürün adı *<input value={draft.name} onChange={(e) => update('name', e.target.value)} maxLength={120} required /></label>
      <label>Kategori *<select value={draft.categoryId} onChange={(e) => update('categoryId', e.target.value)} required><option value="">Seç</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <label>Durum<select value={draft.status} onChange={(e) => update('status', e.target.value as ProductDraft['status'])}><option value="planned">Planlandı</option><option value="researching">Araştırılıyor</option><option value="ordered">Sipariş verildi</option><option value="purchased">Alındı</option><option value="abandoned">Vazgeçildi</option></select></label>
      <label>Adet<input type="number" min="1" max="999" value={draft.quantity} onChange={(e) => update('quantity', Math.max(1, Number(e.target.value)))} /></label>
      <label>Öncelik<select value={draft.priority} onChange={(e) => update('priority', e.target.value as ProductDraft['priority'])}><option value="low">Düşük</option><option value="normal">Normal</option><option value="high">Yüksek</option><option value="urgent">Acil</option></select></label>
      <label>Tahmini birim fiyat<input type="number" min="0" step="0.01" value={draft.estimatedUnitPrice || ''} onChange={(e) => update('estimatedUnitPrice', Math.max(0, Number(e.target.value)))} /></label>
      <label>Gerçek birim fiyat<input type="number" min="0" step="0.01" value={draft.actualUnitPrice || ''} onChange={(e) => update('actualUnitPrice', Math.max(0, Number(e.target.value)))} /></label>
      <label>Mağaza<input value={draft.store} onChange={(e) => update('store', e.target.value)} /></label>
      <label>Marka / model<input value={draft.brand} onChange={(e) => update('brand', e.target.value)} /></label>
      <label>Satın alma tarihi<input type="date" value={draft.purchaseDate} onChange={(e) => update('purchaseDate', e.target.value)} /></label>
      <label>Hedef tarihi<input type="date" value={draft.targetDate} onChange={(e) => update('targetDate', e.target.value)} /></label>
      <label className="span-2">Ürün bağlantısı<input type="url" value={draft.url} onChange={(e) => update('url', e.target.value)} placeholder="https://" /></label>
      <label className="span-2">Not<textarea value={draft.note} onChange={(e) => update('note', e.target.value)} rows={3} maxLength={1000} /></label>
      <label className="check"><input type="checkbox" checked={draft.isGift} onChange={(e) => update('isGift', e.target.checked)} />Bu ürün hediye</label>
      <label className="upload"><Camera />Fotoğraf seç<input type="file" accept="image/*" multiple onChange={(event: ChangeEvent<HTMLInputElement>) => setFiles(Array.from(event.target.files ?? []).slice(0, 5))} /></label>
      {(draft.imageUrls?.length ?? 0) > 0 && <div className="image-list span-2">{draft.imageUrls?.map((url) => <div key={url}><img src={url} alt="" /><button type="button" onClick={() => update('imageUrls', draft.imageUrls?.filter((item) => item !== url))}><Trash2 /></button></div>)}</div>}
      <div className="form-actions span-2"><button className="btn-secondary" type="button" onClick={closeProductForm}>Vazgeç</button><button className="btn-primary" disabled={saving} type="submit"><Save />{saving ? 'Kaydediliyor…' : 'Kaydet'}</button></div>
    </form>
  </Modal>;
}
