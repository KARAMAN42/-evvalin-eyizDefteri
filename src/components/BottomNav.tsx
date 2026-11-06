import { BarChart3, Home, ListChecks, Plus, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export function BottomNav() {
  const { openProductForm } = useApp();
  return <nav className="bottom-nav" aria-label="Mobil menü">
    <NavLink to="/"><Home /><span>Ana Sayfa</span></NavLink>
    <NavLink to="/urunler"><ListChecks /><span>Ürünler</span></NavLink>
    <button type="button" className="nav-add" onClick={() => openProductForm()} aria-label="Yeni ürün ekle"><Plus /></button>
    <NavLink to="/istatistik"><BarChart3 /><span>İstatistik</span></NavLink>
    <NavLink to="/ayarlar"><Settings /><span>Ayarlar</span></NavLink>
  </nav>;
}
