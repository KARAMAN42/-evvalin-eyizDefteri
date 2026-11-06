import { CalendarDays, CheckCircle2, Clock3, PackageOpen, Plus, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { daysUntil, formatCurrency, greeting } from '../utils/format';

export function DashboardPage() {
  const { products, categories, settings, openProductForm } = useApp();
  const active = products.filter((product) => product.status !== 'abandoned');
  const purchased = active.filter((product) => product.status === 'purchased');
  const spent = active.reduce((sum, product) => sum + (product.isGift ? 0 : product.actualUnitPrice * product.quantity), 0);
  const estimated = active.reduce((sum, product) => sum + (product.isGift ? 0 : product.estimatedUnitPrice * product.quantity), 0);
  const completion = active.length ? Math.round((purchased.length / active.length) * 100) : 0;
  const weddingDays = daysUntil(settings.weddingDate);
  return <div className="page"><header className="page-header"><div><span className="eyebrow">{greeting(settings.partnerOne)}</span><h1>Hazırlıklar nasıl gidiyor?</h1><p>Bugün tamamlanan her eksik, yarına güzel bir hatıra.</p></div><button className="btn-primary" type="button" onClick={() => openProductForm()}><Plus />Ürün ekle</button></header>
    {weddingDays !== null && <section className="hero-card"><div><span><CalendarDays />Düğüne kalan</span><strong>{weddingDays > 0 ? weddingDays : 0} gün</strong><p>{settings.partnerOne} & {settings.partnerTwo}</p></div><div className="progress-ring" style={{ '--progress': `${completion * 3.6}deg` } as React.CSSProperties}><span>{completion}%</span></div></section>}
    <section className="stat-grid"><article><PackageOpen /><div><span>Toplam ürün</span><strong>{active.length}</strong></div></article><article><CheckCircle2 /><div><span>Alınan</span><strong>{purchased.length}</strong></div></article><article><Clock3 /><div><span>Bekleyen</span><strong>{active.length - purchased.length}</strong></div></article><article><WalletCards /><div><span>Harcanan</span><strong>{formatCurrency(spent)}</strong></div></article></section>
    <section className="content-card"><div className="section-title"><div><h2>Kategori özeti</h2><p>{categories.length} kategori · Tahmini toplam {formatCurrency(estimated)}</p></div><Link to="/urunler">Tümünü gör</Link></div><div className="category-grid">{categories.map((category) => { const items = active.filter((product) => product.categoryId === category.id); const done = items.filter((product) => product.status === 'purchased').length; return <Link to={`/urunler?category=${category.id}`} key={category.id} className="category-card"><span style={{ background: category.color }} /><div><strong>{category.name}</strong><small>{done}/{items.length} tamamlandı</small></div><b>{items.length ? Math.round(done / items.length * 100) : 0}%</b></Link>; })}</div></section>
  </div>;
}
