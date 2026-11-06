import { BarChart3, Heart, Home, ListChecks, Moon, Plus, Settings, Sun } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BottomNav } from './BottomNav';

export function Layout() {
  const { settings, saveSettings, openProductForm, syncError } = useApp();
  const toggleTheme = () => void saveSettings({ ...settings, theme: settings.theme === 'dark' ? 'light' : 'dark' });
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span><Heart fill="currentColor" /></span><div><strong>Çeyiz Defterim</strong><small>{settings.partnerOne} & {settings.partnerTwo}</small></div></div>
      <nav>
        <NavLink to="/" end><Home />Ana Sayfa</NavLink>
        <NavLink to="/urunler"><ListChecks />Ürünler</NavLink>
        <NavLink to="/istatistik"><BarChart3 />İstatistik</NavLink>
        <NavLink to="/ayarlar"><Settings />Ayarlar</NavLink>
      </nav>
      <button className="btn-primary sidebar-add" type="button" onClick={() => openProductForm()}><Plus />Ürün Ekle</button>
      <button className="theme-toggle" type="button" onClick={toggleTheme}>{settings.theme === 'dark' ? <Sun /> : <Moon />}{settings.theme === 'dark' ? 'Aydınlık mod' : 'Karanlık mod'}</button>
    </aside>
    <main className="main-content">{syncError && <div className="sync-warning" role="alert">{syncError}</div>}<Outlet /></main>
    <BottomNav />
  </div>;
}
