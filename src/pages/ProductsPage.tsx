import { CheckCircle2, Filter, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { ProductDetail } from '../components/ProductDetail';
import { useToast } from '../components/Toast';
import { useApp } from '../context/AppContext';
import type { ProductStatus } from '../types';

export function ProductsPage() {
  const { products, categories, openProductForm, openProductDetail, deleteProduct, bulkUpdateProducts } = useApp();
  const { showToast } = useToast();
  const [params] = useSearchParams();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(params.get('category') ?? '');
  const [status, setStatus] = useState<'' | ProductStatus>('');
  const [sort, setSort] = useState('newest');
  const [selected, setSelected] = useState<string[]>([]);
  const categoryMap = useMemo(() => new Map(categories.map((item) => [item.id, item])), [categories]);
  const filtered = useMemo(() => products.filter((product) => (!query || [product.name, product.brand, product.store, product.note].join(' ').toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr'))) && (!category || product.categoryId === category) && (!status || product.status === status)).sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name, 'tr') : sort === 'price' ? (b.actualUnitPrice || b.estimatedUnitPrice) - (a.actualUnitPrice || a.estimatedUnitPrice) : b.updatedAt.localeCompare(a.updatedAt)), [category, products, query, sort, status]);
  const remove = async (id: string) => { if (!window.confirm('Bu ürünü silmek istediğine emin misin?')) return; await deleteProduct(id); showToast('Ürün silindi.'); };
  return <div className="page"><header className="page-header"><div><span className="eyebrow">Çeyiz listesi</span><h1>Ürünler</h1><p>{filtered.length} ürün gösteriliyor.</p></div><button className="btn-primary" type="button" onClick={() => openProductForm()}><Plus />Ürün ekle</button></header>
    <section className="filter-bar"><div className="search"><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ürün, mağaza veya not ara" /></div><label><Filter /><select value={category} onChange={(e) => setCategory(e.target.value)}><option value="">Tüm kategoriler</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><select value={status} onChange={(e) => setStatus(e.target.value as '' | ProductStatus)}><option value="">Tüm durumlar</option><option value="planned">Planlandı</option><option value="researching">Araştırılıyor</option><option value="ordered">Sipariş verildi</option><option value="purchased">Alındı</option></select><select value={sort} onChange={(e) => setSort(e.target.value)}><option value="newest">Son güncellenen</option><option value="name">Ada göre</option><option value="price">Fiyata göre</option></select></section>
    {selected.length > 0 && <div className="bulk-bar"><strong>{selected.length} ürün seçildi</strong><button type="button" onClick={() => void bulkUpdateProducts(selected, { status: 'purchased' }).then(() => { setSelected([]); showToast('Ürünler alındı olarak işaretlendi.'); })}><CheckCircle2 />Alındı yap</button><button type="button" onClick={() => { if (window.confirm(`${selected.length} ürünü kalıcı olarak silmek istediğine emin misin?`)) void Promise.all(selected.map(deleteProduct)).then(() => { setSelected([]); showToast('Seçili ürünler silindi.'); }); }}><Trash2 />Sil</button></div>}
    <section className="products-grid">{filtered.map((product) => <ProductCard key={product.id} product={product} category={categoryMap.get(product.categoryId)} selectionMode={selected.length > 0} selected={selected.includes(product.id)} onSelect={() => setSelected((ids) => ids.includes(product.id) ? ids.filter((id) => id !== product.id) : [...ids, product.id])} onOpen={() => openProductDetail(product)} onEdit={() => openProductForm(product)} onDelete={() => void remove(product.id)} />)}</section>
    {!filtered.length && <div className="empty-state"><h2>Henüz ürün yok</h2><p>İlk ürününüzü ekleyerek hazırlıklara başlayın.</p><button className="btn-primary" onClick={() => openProductForm()}><Plus />Ürün ekle</button></div>}
    <ProductDetail />
  </div>;
}
