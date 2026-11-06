import {
  Armchair,
  Bath,
  BedDouble,
  Gift,
  Heart,
  LampDesk,
  Laptop,
  Package,
  Shirt,
  Sparkles,
  SprayCan,
  UtensilsCrossed,
  Watch,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  armchair: Armchair,
  bath: Bath,
  bed: BedDouble,
  gift: Gift,
  heart: Heart,
  lamp: LampDesk,
  laptop: Laptop,
  package: Package,
  shirt: Shirt,
  sparkles: Sparkles,
  spray: SprayCan,
  utensils: UtensilsCrossed,
  watch: Watch,
};

export function CategoryIcon({ name, size = 20 }: { name: string; size?: number }) {
  const Icon = iconMap[name] ?? Package;
  return <Icon size={size} />;
}

