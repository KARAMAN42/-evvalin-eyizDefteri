import { Check, Edit3, Gift, Trash2 } from 'lucide-react';
import type { Category, Product } from '../types';
import { formatCurrency, statusLabels } from '../utils/format';
import { CategoryIcon } from './CategoryIcon';

export function ProductCard({ product, category, selected = false, selectionMode = false, onSelect, onOpen, onEdit, onDelete }: { product: Product; category?: Category; selected?: boolean; selectionMode?: boolean; onSelect?: () => void; onOpen: () => void; onEdit: () => void; onDelete: () => void }) {
  const image = product.imageUrls?.[0] || product.imageDataUrl;
  return <article className={`product-card ${selected ? 'selected' : ''}`} onClick={selectionMode ? onSelect : onOpen}>
    {selectionMode && <button className="select-dot" type="button" onClick={(event) => { event.stopPropagation(); onSelect?.(); }} aria-label="Seç">{selected && <Check />}</button>}
    <div className="product-image">{image ? <img src={image} alt="" /> : <CategoryIcon name={category?.icon ?? 'package'} size={34} />}{product.isGift && <span className="gift-badge"><Gift /></span>}</div>
    <div className="product-card-body"><div className="product-meta"><span style={{ color: category?.color }}>{category?.name ?? 'Diğer'}</span><span>{statusLabels[product.status]}</span></div><h3>{product.name}</h3><p>{product.quantity} adet · {formatCurrency((product.actualUnitPrice || product.estimatedUnitPrice) * product.quantity)}</p></div>
    <div className="product-actions"><button type="button" onClick={(event) => { event.stopPropagation(); onEdit(); }} aria-label="Düzenle"><Edit3 /></button><button type="button" onClick={(event) => { event.stopPropagation(); onDelete(); }} aria-label="Sil"><Trash2 /></button></div>
  </article>;
}
