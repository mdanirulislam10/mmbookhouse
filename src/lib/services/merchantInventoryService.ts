import { BookInventoryItem } from '../../types/sellerCentral';

/**
 * Module 19: Merchant Inventory, Barcode & Stock Reconciliation Service
 * 
 * Complies with:
 * - Item 11: Comprehensive Book Metadata Form
 * - Item 13: Low-Stock Warning (< 5 copies) & Evening Restock Checklist
 * - Item 14: Auto Out-of-Stock Mode (SEO Friendly)
 * - Item 17: Barcode / Camera ISBN Scanner Lookup
 * - Item 18: POS Counter Sale Real-Time Stock Reconciliation
 * - Item 19: Soft Delete & Archive Policy
 * - Item 20: Multi-Category Tagging
 */

export class MerchantInventoryService {
  private books: Map<string, BookInventoryItem> = new Map();

  constructor() {
    this.seedInitialInventory();
  }

  private seedInitialInventory() {
    const seed: BookInventoryItem[] = [
      {
        id: 'book_wbcs_001',
        sku: 'WBCS-SCAN-2026',
        isbn: '9789352834912',
        title: 'WBCS Preliminary General Studies Scanner 2026',
        title_bn: 'ডব্লিউবিসিএস প্রিলিমিনারি স্ক্যানার ২০২৬',
        author: 'ড. অশোক কুমার ব্যানার্জী',
        publisher: 'ছায়া প্রকাশনী',
        edition_year: 2026,
        categories: ['WBCS', 'Civil Services', 'Test Papers'],
        class_grade: 'Graduate',
        mrp: 650,
        selling_price: 520,
        wholesale_cost_price: 380,
        discount_percent: 20,
        stock_quantity: 18,
        low_stock_threshold: 5,
        weight_grams: 520,
        rack_location: 'Rack A-2, Shelf 1',
        cover_image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
        is_active: true,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'book_madh_002',
        sku: 'MADH-TEST-2026',
        isbn: '9789350021980',
        title: 'Madhyamik All In One Suggestion 2026',
        title_bn: 'মাধ্যমিক অল ইন ওয়ান টেস্ট সাজেশন ২০২৬',
        author: 'এম. কে. রায় ও সম্পাদকমণ্ডলী',
        publisher: 'রায় ও মার্টিন',
        edition_year: 2026,
        categories: ['Madhyamik', 'Class 10', 'Suggestions'],
        class_grade: 'Class 10',
        mrp: 420,
        selling_price: 350,
        wholesale_cost_price: 240,
        discount_percent: 17,
        stock_quantity: 3, // LOW STOCK TRIGGER (< 5)
        low_stock_threshold: 5,
        weight_grams: 380,
        rack_location: 'Rack B-1, Shelf 4',
        cover_image_url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=400',
        is_active: true,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'book_hist_003',
        sku: 'HIST-HON-003',
        isbn: '9788170742510',
        title: 'Bharatbarsher Itihas (Ancient India)',
        title_bn: 'ভারতবর্ষের ইতিহাস (প্রাচীন ও মধ্যযুগ)',
        author: 'রমেশচন্দ্র মজুমদার',
        publisher: 'আনন্দ পাবলিশার্স',
        edition_year: 2024,
        categories: ['College', 'History Honours', 'UGB Malda'],
        class_grade: 'BA Honours',
        mrp: 550,
        selling_price: 495,
        wholesale_cost_price: 350,
        discount_percent: 10,
        stock_quantity: 0, // OUT OF STOCK
        low_stock_threshold: 5,
        weight_grams: 600,
        rack_location: 'Rack C-3, Shelf 2',
        is_active: true,
        status: 'out_of_stock',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'book_sans_004',
        sku: 'SANS-SAH-2022',
        isbn: '9788170748899',
        title: 'Sanskrit Sahityer Itihas (Reference Edition)',
        title_bn: 'সংস্কৃত সাহিত্যের ইতিহাস (রেফারেন্স সংস্করণ)',
        author: 'ধীরেন্দ্রনাথ বন্দ্যোপাধ্যায়',
        publisher: 'পশ্চিমবঙ্গ রাজ্য পুস্তক পর্ষদ',
        edition_year: 2022,
        categories: ['College', 'Sanskrit Honours'],
        class_grade: 'BA Honours',
        mrp: 380,
        selling_price: 320,
        wholesale_cost_price: 210,
        discount_percent: 16,
        stock_quantity: 14,
        low_stock_threshold: 3,
        weight_grams: 450,
        rack_location: 'Rack D-4, Shelf 5',
        is_active: true,
        status: 'active',
        created_at: new Date(Date.now() - 140 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 140 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    seed.forEach((b) => this.books.set(b.id, b));
  }

  /**
   * Item 11: Add a new book to the catalog
   */
  public addBook(data: Omit<BookInventoryItem, 'id' | 'created_at' | 'updated_at'>): BookInventoryItem {
    const id = `book_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const discount_percent = Math.round(((data.mrp - data.selling_price) / data.mrp) * 100);
    const status = data.stock_quantity === 0 ? 'out_of_stock' : data.status || 'active';

    const newBook: BookInventoryItem = {
      ...data,
      id,
      discount_percent,
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.books.set(id, newBook);
    return newBook;
  }

  /**
   * Update existing book metadata & adjust status
   */
  public updateBook(id: string, updates: Partial<BookInventoryItem>): BookInventoryItem | null {
    const existing = this.books.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates };

    if (updates.mrp || updates.selling_price) {
      updated.discount_percent = Math.round(
        ((updated.mrp - updated.selling_price) / updated.mrp) * 100
      );
    }

    // Item 14: Auto Out of Stock mode
    if (updated.stock_quantity === 0 && updated.status !== 'archived' && updated.status !== 'out_of_print') {
      updated.status = 'out_of_stock';
    } else if (updated.stock_quantity > 0 && updated.status === 'out_of_stock') {
      updated.status = 'active';
    }

    updated.updated_at = new Date().toISOString();
    this.books.set(id, updated);
    return updated;
  }

  public getBookById(id: string): BookInventoryItem | null {
    return this.books.get(id) || null;
  }

  /**
   * Item 17: Barcode gun / camera scanner lookup via ISBN or barcode
   */
  public getBookByIsbnOrBarcode(isbnOrBarcode: string): BookInventoryItem | null {
    const trimmed = isbnOrBarcode.trim();
    const clean = trimmed.replace(/[-\s]/g, '');
    for (const b of this.books.values()) {
      const bIsbnClean = b.isbn.replace(/[-\s]/g, '');
      const bSkuClean = b.sku.replace(/[-\s]/g, '');
      if (
        b.isbn === trimmed ||
        b.sku.toUpperCase() === trimmed.toUpperCase() ||
        bIsbnClean === clean ||
        bSkuClean.toUpperCase() === clean.toUpperCase()
      ) {
        return b;
      }
    }
    return null;
  }

  public getItemBySku(sku: string): BookInventoryItem | null {
    const clean = sku.trim().toUpperCase();
    for (const b of this.books.values()) {
      if (b.sku.toUpperCase() === clean) {
        return b;
      }
    }
    return null;
  }

  /**
   * Adjust stock quantity by delta (positive for restocking/RTO, negative for damage/loss)
   */
  public adjustStock(
    skuOrId: string,
    delta: number,
    _reason?: string
  ): { success: boolean; book?: BookInventoryItem; error?: string } {
    const book = this.getBookById(skuOrId) || this.getItemBySku(skuOrId) || this.getBookByIsbnOrBarcode(skuOrId);
    if (!book) {
      return { success: false, error: 'বইটি খুঁজে পাওয়া যায়নি' };
    }

    const newStock = Math.max(0, book.stock_quantity + delta);
    const updated = this.updateBook(book.id, { stock_quantity: newStock });
    return { success: true, book: updated || undefined };
  }


  /**
   * Item 13: Low-stock warning (< 5 copies)
   */
  public getLowStockBooks(customThreshold?: number): BookInventoryItem[] {
    const result: BookInventoryItem[] = [];
    for (const b of this.books.values()) {
      const threshold = customThreshold !== undefined ? customThreshold : b.low_stock_threshold;
      if (b.status === 'active' && b.stock_quantity <= threshold && b.stock_quantity > 0) {
        result.push(b);
      }
    }
    return result;
  }

  /**
   * Item 13: Evening Restock Checklist generator for shopkeeper
   */
  public generateEveningRestockChecklist(): {
    date: string;
    total_items_to_restock: number;
    items: Array<{
      book_id: string;
      title: string;
      publisher: string;
      current_stock: number;
      recommended_reorder_qty: number;
    }>;
  } {
    const lowStock = this.getLowStockBooks();
    const outOfStock = Array.from(this.books.values()).filter((b) => b.status === 'out_of_stock');
    const combined = [...lowStock, ...outOfStock];

    return {
      date: new Date().toISOString().split('T')[0],
      total_items_to_restock: combined.length,
      items: combined.map((b) => ({
        book_id: b.id,
        title: b.title_bn || b.title,
        publisher: b.publisher,
        current_stock: b.stock_quantity,
        recommended_reorder_qty: Math.max(10, (b.low_stock_threshold || 5) * 3 - b.stock_quantity),
      })),
    };
  }

  /**
   * Item 18: POS Counter Sale real-time stock reconciliation
   * Instantly decrements online stock when a physical book is sold at Malda counter
   */
  public recordCounterSale(
    isbnOrId: string,
    quantity = 1
  ): { success: boolean; book?: BookInventoryItem; remainingStock: number; error?: string } {
    let book = this.getBookById(isbnOrId);
    if (!book) {
      book = this.getItemBySku(isbnOrId);
    }
    if (!book) {
      book = this.getBookByIsbnOrBarcode(isbnOrId);
    }


    if (!book) {
      return { success: false, remainingStock: 0, error: 'বইটি খুঁজে পাওয়া যায়নি' };
    }

    if (book.stock_quantity < quantity) {
      return {
        success: false,
        remainingStock: book.stock_quantity,
        error: `পর্যাপ্ত স্টক নেই। বর্তমান স্টক: ${book.stock_quantity}টি`,
      };
    }

    const newStock = book.stock_quantity - quantity;
    const updated = this.updateBook(book.id, { stock_quantity: newStock })!;

    return {
      success: true,
      book: updated,
      remainingStock: updated.stock_quantity,
    };
  }

  /**
   * Item 19: Soft delete & archive policy (preserves historical order relations)
   */
  public archiveBook(id: string): { success: boolean; book?: BookInventoryItem; error?: string } {
    const book = this.getBookById(id);
    if (!book) {
      return { success: false, error: 'বইটি খুঁজে পাওয়া যায়নি' };
    }

    const updated = this.updateBook(id, {
      status: 'archived',
      is_active: false,
    });

    return { success: true, book: updated || undefined };
  }

  /**
   * Search / filter books
   */
  public listBooks(filter?: {
    query?: string;
    category?: string;
    status?: string;
    publisher?: string;
  }): BookInventoryItem[] {
    let result = Array.from(this.books.values());

    if (filter?.query) {
      const q = filter.query.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.title_bn.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.isbn.includes(q) ||
          b.sku.toLowerCase().includes(q)
      );
    }

    if (filter?.category) {
      result = result.filter((b) => b.categories.includes(filter.category!));
    }

    if (filter?.publisher) {
      result = result.filter((b) => b.publisher === filter.publisher);
    }

    if (filter?.status) {
      result = result.filter((b) => b.status === filter.status);
    }

    return result;
  }

  public getAllBooksCount(): number {
    return this.books.size;
  }
}

export const defaultMerchantInventoryService = new MerchantInventoryService();
