export type ProductStatus = 'planned' | 'researching' | 'ordered' | 'purchased' | 'abandoned';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';
export type PurchasedBy = 'sevval' | 'yusuf' | 'together' | 'family' | 'gift' | 'other';
export type ThemeMode = 'light' | 'dark';

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  status: ProductStatus;
  quantity: number;
  estimatedUnitPrice: number;
  actualUnitPrice: number;
  priority: Priority;
  store: string;
  url: string;
  brand: string;
  colorModel: string;
  purchaseDate: string;
  targetDate: string;
  note: string;
  imageDataUrl?: string;
  imageUrls?: string[];
  purchasedBy: PurchasedBy;
  isGift: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProductDraft = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  budgetLimit: number;
  isDefault: boolean;
  createdAt: string;
}

export interface AppSettings {
  id: 'main';
  partnerOne: string;
  partnerTwo: string;
  engagementDate: string;
  weddingDate: string;
  generalBudget: number;
  currency: 'TRY';
  theme: ThemeMode;
  onboardingComplete: boolean;
  sampleLoaded: boolean;
  notificationsEnabled: boolean;
}

export interface BackupFile {
  version: 2;
  exportedAt: string;
  products: Product[];
  categories: Category[];
  settings: AppSettings;
}

export type ToastType = 'success' | 'error' | 'info';
