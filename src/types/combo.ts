import { CarouselProduct } from './carousel';

export interface ComboDeal {
  id: string;
  title: string;
  titleBn: string;
  subtitleBn: string;
  badgeBn: string;
  badgeType?: 'hot' | 'value' | 'seasonal';
  books: CarouselProduct[];
  totalMrp: number;
  comboPrice: number;
  savingsAmount: number;
  savingsPercentage: number;
  freeDelivery?: boolean;
}
