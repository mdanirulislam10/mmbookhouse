export interface CarouselProduct {
  id: string;
  bookId: string;
  title: string;
  titleBn: string;
  author: string;
  authorBn: string;
  publisher: string;
  publisherBn: string;
  category: string;
  categoryBn: string;
  price: number;
  mrp: number;
  discountPercent: number;
  rating: number;
  reviewsCount: number;
  inStock: boolean;
  coverImage: string;
  badge?: string;
  badgeBn?: string;
  edition?: string;
  pages?: number;
  binding?: 'paperback' | 'hardcover' | 'bundle';
  bindingBn?: string;
  language?: string;
  languageBn?: string;
  isbn?: string;
  descriptionBn?: string;
  tableOfContents?: string[];
  deliveryTimeBn?: string;
}

export interface CarouselCollection {
  id: string;
  title: string;
  titleBn: string;
  subtitleBn?: string;
  viewAllUrl: string;
  badgeTextBn?: string;
  items: CarouselProduct[];
}
