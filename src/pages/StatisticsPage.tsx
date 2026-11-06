import { CheckCircle2, PackageOpen, TrendingUp, WalletCards } from 'lucide-react';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../context/AppContext';
import { formatCurrency, statusLabels } from '../utils/format';

const colors = ['#9333ea', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6', '#64748b'];
export function StatisticsPage() {
  const { products, categories, settings } = useApp();
  const data = useMemo(() => {
    const active = products.filter((product) => product.status !== 'abandoned');
    const spent = active.reduce((sum, product) => sum + (product.isGift ? 0 : product.actualUnitPrice * product.quantity), 0);
    const estimated = active.reduce((sum, product) => sum + (product.isGift ? 0 : product.estimatedUnitPrice * product.quantity), 0);
    const purchased = active.filter((product) => product.status === 'purchased').length;
    const byCategory = categories.map((category) => ({ name: category.name, value: active.filter((product) => product.categoryId === category.id).reduce((sum, product) => sum + (product.actualUnitPrice || product.estimatedUnitPrice) * product.quantity, 0) })).filter((item) => item.value > 0);
    const byStatus = Object.entries(statusLabels).map(([status, name]) => ({ name, value: active.filter((product) => product.status === status).length })).filter((item) => item.value > 0);
    return { active, spent, estimated, purchased, byCategory, byStatus };
  }, [categories, products]);
  return <div className="page"><header className="page-header"><div><span className="eyebrow">Genel görünüm</span><h1>İstatistikler</h1><p>Bütçe ve tamamlanma durumunu tek ekranda izle.</p></div></header>
    <section className="stat-grid"><article><PackageOpen /><div><span>Aktif ürün</span><strong>{data.active.length}</strong></div></article><article><CheckCircle2 /><div><span>Tamamlanan</span><strong>{data.purchased}</strong></div></article><article><WalletCards /><div><span>Harcanan</span><strong>{formatCurrency(data.spent)}</strong></div></article><article><TrendingUp /><div><span>Kalan bütçe</span><strong>{formatCurrency(Math.max(0, settings.generalBudget - data.spent))}</strong></div></article></section>
    <section className="chart-grid"><article className="content-card"><h2>Kategori harcamaları</h2><div className="chart">{data.byCategory.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={data.byCategory}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip formatter={(value) => formatCurrency(Number(value))} /><Bar dataKey="value" fill="#9333ea" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer> : <p className="chart-empty">Grafik için fiyat bilgisi ekleyin.</p>}</div></article>
      <article className="content-card"><h2>Durum dağılımı</h2><div className="chart">{data.byStatus.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.byStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85}>{data.byStatus.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <p className="chart-empty">Henüz ürün yok.</p>}</div></article></section>
  </div>;
}
