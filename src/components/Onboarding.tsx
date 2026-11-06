import { ArrowRight, Heart, ListPlus, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext';

export function Onboarding() {
  const { settings, saveSettings } = useApp();
  const [step, setStep] = useState(0);
  const pages = [
    { icon: Heart, title: 'Ortak hayalinize hoş geldiniz', text: 'Çeyiz listenizi, bütçenizi ve alışveriş ilerlemenizi birlikte takip edin.' },
    { icon: ListPlus, title: 'Her şey tek yerde', text: 'Ürünleri kategorilere ayırın, fiyatları karşılaştırın ve eksikleri görün.' },
    { icon: ShieldCheck, title: 'İki cihazda eş zamanlı', text: 'Aynı hesapla giriş yaptığınız cihazlarda değişiklikler Firebase üzerinden anında eşitlenir.' },
  ];
  const page = pages[step]; const Icon = page.icon;
  return <div className="onboarding"><div className="onboarding-card"><Icon className="onboarding-icon" /><h1>{page.title}</h1><p>{page.text}</p><div className="dots">{pages.map((_, index) => <span key={index} className={index === step ? 'active' : ''} />)}</div><button className="btn-primary" type="button" onClick={() => step < pages.length - 1 ? setStep(step + 1) : void saveSettings({ ...settings, onboardingComplete: true })}>{step < pages.length - 1 ? 'Devam et' : 'Başlayalım'}<ArrowRight /></button></div></div>;
}
