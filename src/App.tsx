import { useRegisterSW } from 'virtual:pwa-register/react';
import { Heart, RefreshCcw, X } from 'lucide-react';
import { lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { Onboarding } from './components/Onboarding';
import { ProductForm } from './components/ProductForm';
import { ToastProvider } from './components/Toast';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardPage } from './pages/DashboardPage';

const ProductsPage = lazy(() => import('./pages/ProductsPage').then((module) => ({ default: module.ProductsPage })));
const StatisticsPage = lazy(() => import('./pages/StatisticsPage').then((module) => ({ default: module.StatisticsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));

function Loading() { return <div className="loading"><Heart fill="currentColor" /><span>Çeyiz Defterim yükleniyor…</span></div>; }
function Application() {
  const { ready, settings } = useApp();
  if (!ready) return <Loading />;
  if (!settings.onboardingComplete) return <Onboarding />;
  return <><Routes><Route element={<Layout />}><Route index element={<DashboardPage />} /><Route path="/urunler" element={<ProductsPage />} /><Route path="/istatistik" element={<StatisticsPage />} /><Route path="/ayarlar" element={<SettingsPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Route></Routes><ProductForm /></>;
}
function AuthGate() {
  const { user, loading, error, retry } = useAuth();
  if (loading) return <Loading />;
  if (error) return <div className="login-root"><div className="login-card"><div className="login-logo"><Heart fill="currentColor" /></div><h1>Bağlantı kurulamadı</h1><p>{error}</p><button className="btn-primary login-button" type="button" onClick={() => void retry()}><RefreshCcw />Tekrar dene</button></div></div>;
  return user ? <AppProvider><Application /></AppProvider> : <Loading />;
}
function UpdatePrompt() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW();
  if (!needRefresh) return null;
  return <div className="update-banner"><RefreshCcw /><span>Uygulamanın yeni sürümü hazır.</span><button onClick={() => void updateServiceWorker(true)}>Güncelle</button><button onClick={() => setNeedRefresh(false)} aria-label="Kapat"><X /></button></div>;
}
export default function App() {
  return <ErrorBoundary><ToastProvider><AuthProvider><BrowserRouter><AuthGate /></BrowserRouter><UpdatePrompt /></AuthProvider></ToastProvider></ErrorBoundary>;
}
