import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '../data/defaults';
import type { AppSettings, BackupFile, Category, Product, ProductDraft } from '../types';

const PRODUCTS_COL = collection(db, 'products');
const CATEGORIES_COL = collection(db, 'categories');
const SETTINGS_DOC = doc(db, 'settings', 'main');

interface AppContextValue {
  ready: boolean;
  syncError: string;
  products: Product[];
  categories: Category[];
  settings: AppSettings;
  productFormOpen: boolean;
  editingProduct?: Product;
  productDetailOpen: boolean;
  selectedProduct?: Product;
  openProductForm: (product?: Product) => void;
  closeProductForm: () => void;
  openProductDetail: (product: Product) => void;
  closeProductDetail: () => void;
  saveProduct: (draft: ProductDraft, id?: string) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  bulkUpdateProducts: (ids: string[], patch: Partial<Product>) => Promise<void>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  addCategory: (name: string, color: string) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  restoreBackup: (backup: BackupFile) => Promise<void>;
  clearAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function normalizedProduct(value: Record<string, unknown>, id: string): Product {
  return {
    id,
    name: String(value.name ?? ''),
    categoryId: String(value.categoryId ?? 'diger'),
    status: (value.status as Product['status']) ?? 'planned',
    quantity: Number(value.quantity ?? 1),
    estimatedUnitPrice: Number(value.estimatedUnitPrice ?? 0),
    actualUnitPrice: Number(value.actualUnitPrice ?? 0),
    priority: (value.priority as Product['priority']) ?? 'normal',
    store: String(value.store ?? ''),
    url: String(value.url ?? ''),
    brand: String(value.brand ?? ''),
    colorModel: String(value.colorModel ?? ''),
    purchaseDate: String(value.purchaseDate ?? ''),
    targetDate: String(value.targetDate ?? ''),
    note: String(value.note ?? ''),
    imageDataUrl: value.imageDataUrl ? String(value.imageDataUrl) : '',
    imageUrls: Array.isArray(value.imageUrls) ? value.imageUrls.map(String) : [],
    purchasedBy: (value.purchasedBy as Product['purchasedBy']) ?? 'together',
    isGift: Boolean(value.isGift),
    createdAt: String(value.createdAt ?? new Date().toISOString()),
    updatedAt: String(value.updatedAt ?? value.createdAt ?? new Date().toISOString()),
  };
}

async function deleteCollectionContents(path: 'products' | 'categories') {
  const snapshot = await getDocs(collection(db, path));
  for (let start = 0; start < snapshot.docs.length; start += 450) {
    const batch = writeBatch(db);
    snapshot.docs.slice(start, start + 450).forEach((item) => batch.delete(item.ref));
    await batch.commit();
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState({ products: false, categories: false, settings: false });
  const [syncError, setSyncError] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product>();
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product>();
  const [productDetailOpen, setProductDetailOpen] = useState(false);

  useEffect(() => {
    const fail = (area: keyof typeof loaded) => (error: Error) => {
      console.error(`Firestore ${area} eşitleme hatası`, error);
      setSyncError('Bulut eşitlemesi kurulamadı. İnternet bağlantını veya Firebase erişim kurallarını kontrol et.');
      setLoaded((state) => ({ ...state, [area]: true }));
    };
    const unsubProducts = onSnapshot(PRODUCTS_COL, (snapshot) => {
      setProducts(snapshot.docs.map((item) => normalizedProduct(item.data(), item.id)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      setLoaded((state) => ({ ...state, products: true }));
      setSyncError('');
    }, fail('products'));
    const unsubCategories = onSnapshot(CATEGORIES_COL, (snapshot) => {
      setCategories(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Category)).sort((a, b) => a.name.localeCompare(b.name, 'tr')));
      setLoaded((state) => ({ ...state, categories: true }));
    }, fail('categories'));
    const unsubSettings = onSnapshot(SETTINGS_DOC, (snapshot) => {
      if (snapshot.exists()) setSettings({ ...DEFAULT_SETTINGS, ...snapshot.data(), id: 'main' } as AppSettings);
      setLoaded((state) => ({ ...state, settings: true }));
    }, fail('settings'));

    void (async () => {
      const [settingsSnapshot, categoriesSnapshot] = await Promise.all([getDoc(SETTINGS_DOC), getDocs(CATEGORIES_COL)]);
      if (!settingsSnapshot.exists()) await setDoc(SETTINGS_DOC, DEFAULT_SETTINGS);
      if (categoriesSnapshot.empty) {
        const batch = writeBatch(db);
        DEFAULT_CATEGORIES.forEach((category) => batch.set(doc(CATEGORIES_COL, category.id), category));
        await batch.commit();
      }
    })().catch((error) => fail('settings')(error as Error));

    return () => { unsubProducts(); unsubCategories(); unsubSettings(); };
  }, []);

  useEffect(() => { document.documentElement.classList.toggle('dark', settings.theme === 'dark'); }, [settings.theme]);

  const ready = loaded.products && loaded.categories && loaded.settings;
  const value = useMemo<AppContextValue>(() => ({
    ready, syncError, products, categories, settings, productFormOpen, editingProduct, productDetailOpen, selectedProduct,
    openProductForm(product) { setEditingProduct(product); setProductFormOpen(true); },
    closeProductForm() { setEditingProduct(undefined); setProductFormOpen(false); },
    openProductDetail(product) { setSelectedProduct(product); setProductDetailOpen(true); },
    closeProductDetail() { setSelectedProduct(undefined); setProductDetailOpen(false); },
    async saveProduct(draft, id) {
      const now = new Date().toISOString();
      const productId = id ?? crypto.randomUUID();
      const createdAt = id ? products.find((product) => product.id === id)?.createdAt ?? now : now;
      await setDoc(doc(PRODUCTS_COL, productId), { ...draft, id: productId, createdAt, updatedAt: now });
    },
    async deleteProduct(id) { await deleteDoc(doc(PRODUCTS_COL, id)); },
    async bulkUpdateProducts(ids, patch) {
      for (let start = 0; start < ids.length; start += 450) {
        const batch = writeBatch(db);
        ids.slice(start, start + 450).forEach((id) => {
          const current = products.find((product) => product.id === id);
          if (current) batch.set(doc(PRODUCTS_COL, id), { ...current, ...patch, updatedAt: new Date().toISOString() });
        });
        await batch.commit();
      }
    },
    async saveSettings(next) { await setDoc(SETTINGS_DOC, { ...next, id: 'main' }); },
    async addCategory(name, color) {
      const slug = name.toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || crypto.randomUUID();
      const id = categories.some((category) => category.id === slug) ? `${slug}-${Date.now()}` : slug;
      await setDoc(doc(CATEGORIES_COL, id), { id, name: name.trim(), color, icon: 'package', budgetLimit: 0, isDefault: false, createdAt: new Date().toISOString() });
    },
    async updateCategory(category) { await setDoc(doc(CATEGORIES_COL, category.id), category); },
    async deleteCategory(id) {
      if (products.some((product) => product.categoryId === id)) throw new Error('Bu kategoride ürün bulunduğu için önce ürünleri başka kategoriye taşımalısın.');
      await deleteDoc(doc(CATEGORIES_COL, id));
    },
    async restoreBackup(backup) {
      await Promise.all([deleteCollectionContents('products'), deleteCollectionContents('categories')]);
      const entries: Array<{ path: 'products' | 'categories'; id: string; value: Product | Category }> = [
        ...backup.products.map((value) => ({ path: 'products' as const, id: value.id, value })),
        ...backup.categories.map((value) => ({ path: 'categories' as const, id: value.id, value })),
      ];
      for (let start = 0; start < entries.length; start += 450) {
        const batch = writeBatch(db);
        entries.slice(start, start + 450).forEach((entry) => batch.set(doc(db, entry.path, entry.id), entry.value));
        await batch.commit();
      }
      await setDoc(SETTINGS_DOC, backup.settings);
    },
    async clearAllData() {
      await Promise.all([deleteCollectionContents('products'), deleteCollectionContents('categories')]);
      const batch = writeBatch(db);
      DEFAULT_CATEGORIES.forEach((category) => batch.set(doc(CATEGORIES_COL, category.id), category));
      batch.set(SETTINGS_DOC, { ...DEFAULT_SETTINGS, onboardingComplete: true });
      await batch.commit();
    },
  }), [categories, editingProduct, productDetailOpen, productFormOpen, products, ready, selectedProduct, settings, syncError]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp, AppProvider içinde kullanılmalıdır.');
  return context;
}
