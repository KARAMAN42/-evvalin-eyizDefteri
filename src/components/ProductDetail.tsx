import { CalendarDays, Edit2, ExternalLink, Gift, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, priorityLabels, purchasedByLabels, statusLabels } from '../utils/format';
import { ImageGallery } from './ImageGallery';
import { Modal } from './Modal';

export function ProductDetail() {
  const { productDetailOpen, selectedProduct: product, closeProductDetail, openProductForm, categories } = useApp();
  const [galleryOpen, setGalleryOpen] = useState(false);
  if (!product) return null;
  const images = product.imageUrls?.length ? product.imageUrls : product.imageDataUrl ? [product.imageDataUrl] : [];
  const category = categories.find((item) => item.id === product.categoryId);
  return <>
    <Modal open={productDetailOpen} onClose={closeProductDetail} title={product.name} subtitle={category?.name}>
      {images[0] && <button className="detail-image" type="button" onClick={() => setGalleryOpen(true)}><img src={images[0]} alt={product.name} /></button>}
      <div className="detail-grid"><div><small>Durum</small><strong>{statusLabels[product.status]}</strong></div><div><small>Öncelik</small><strong>{priorityLabels[product.priority]}</strong></div><div><small>Adet</small><strong>{product.quantity}</strong></div><div><small>Toplam</small><strong>{formatCurrency((product.actualUnitPrice || product.estimatedUnitPrice) * product.quantity)}</strong></div><div><small>Alan</small><strong>{purchasedByLabels[product.purchasedBy]}</strong></div><div><small>Tarih</small><strong>{formatDate(product.purchaseDate || product.targetDate)}</strong></div></div>
      {product.isGift && <p className="detail-note"><Gift />Hediye olarak işaretlendi</p>}{product.store && <p className="detail-note"><MapPin />{product.store}</p>}{product.note && <p className="note-box">{product.note}</p>}
      <div className="form-actions">{product.url && <a className="btn-secondary" href={product.url} target="_blank" rel="noreferrer"><ExternalLink />Bağlantıyı aç</a>}<button className="btn-primary" type="button" onClick={() => { closeProductDetail(); openProductForm(product); }}><Edit2 />Düzenle</button></div>
      <p className="updated"><CalendarDays />Son güncelleme: {formatDate(product.updatedAt, true)}</p>
    </Modal>
    {galleryOpen && <ImageGallery images={images} onClose={() => setGalleryOpen(false)} />}
  </>;
}
