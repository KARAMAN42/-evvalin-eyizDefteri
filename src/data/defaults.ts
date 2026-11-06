import type { AppSettings, Category, Product } from '../types';

const createdAt = '2026-01-01T00:00:00.000Z';
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'mutfak', name: 'Mutfak', color: '#f59e0b', icon: 'utensils', budgetLimit: 0, isDefault: true, createdAt },
  { id: 'yatak-odasi', name: 'Yatak Odası', color: '#a855f7', icon: 'bed', budgetLimit: 0, isDefault: true, createdAt },
  { id: 'banyo', name: 'Banyo', color: '#06b6d4', icon: 'bath', budgetLimit: 0, isDefault: true, createdAt },
  { id: 'salon', name: 'Salon', color: '#ec4899', icon: 'sofa', budgetLimit: 0, isDefault: true, createdAt },
  { id: 'elektronik', name: 'Elektronik', color: '#3b82f6', icon: 'plug', budgetLimit: 0, isDefault: true, createdAt },
  { id: 'damat-bohcasi', name: 'Damat Bohçası', color: '#14b8a6', icon: 'gift', budgetLimit: 0, isDefault: true, createdAt },
  { id: 'diger', name: 'Diğer', color: '#64748b', icon: 'package', budgetLimit: 0, isDefault: true, createdAt },
];
export const DEFAULT_SETTINGS: AppSettings = { id: 'main', partnerOne: 'Şevval', partnerTwo: 'Yusuf', engagementDate: '', weddingDate: '', generalBudget: 0, currency: 'TRY', theme: 'light', onboardingComplete: false, sampleLoaded: false, notificationsEnabled: false };
export const SAMPLE_PRODUCTS: Product[] = [];
