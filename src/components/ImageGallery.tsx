import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ImageGallery({ images, initialIndex = 0, onClose }: { images: string[]; initialIndex?: number; onClose: () => void }) {
  const [index, setIndex] = useState(initialIndex);
  useEffect(() => { const key = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); if (event.key === 'ArrowLeft') setIndex((value) => (value - 1 + images.length) % images.length); if (event.key === 'ArrowRight') setIndex((value) => (value + 1) % images.length); }; document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key); }, [images.length, onClose]);
  if (!images.length) return null;
  return <div className="gallery" role="dialog" aria-modal="true"><button onClick={onClose} aria-label="Kapat"><X /></button><button onClick={() => setIndex((index - 1 + images.length) % images.length)} aria-label="Önceki"><ChevronLeft /></button><img src={images[index]} alt={`Ürün fotoğrafı ${index + 1}`} /><button onClick={() => setIndex((index + 1) % images.length)} aria-label="Sonraki"><ChevronRight /></button></div>;
}
