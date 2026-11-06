import type { Priority, ProductStatus, PurchasedBy } from '../types';
export const statusLabels: Record<ProductStatus, string> = { planned: 'Planlandı', researching: 'Araştırılıyor', ordered: 'Sipariş Verildi', purchased: 'Alındı', abandoned: 'Vazgeçildi' };
export const priorityLabels: Record<Priority, string> = { low: 'Düşük', normal: 'Normal', high: 'Yüksek', urgent: 'Acil' };
export const purchasedByLabels: Record<PurchasedBy, string> = { sevval: 'Şevval', yusuf: 'Yusuf', together: 'Birlikte', family: 'Aile', gift: 'Hediye', other: 'Diğer' };
export function formatCurrency(value: number) { return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(Number.isFinite(value) ? value : 0); }
export function formatDate(value: string, includeTime = false) { if (!value) return '—'; const date = new Date(value); if (Number.isNaN(date.getTime())) return '—'; return new Intl.DateTimeFormat('tr-TR', includeTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(date); }
export function daysUntil(value: string) { if (!value) return null; const target = new Date(`${value}T00:00:00`); if (Number.isNaN(target.getTime())) return null; return Math.ceil((target.getTime() - Date.now()) / 86_400_000); }
export function greeting(name: string) { const hour = new Date().getHours(); const prefix = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar'; return `${prefix}${name ? `, ${name}` : ''}`; }
export function cn(...values: Array<string | false | null | undefined>) { return values.filter(Boolean).join(' '); }
