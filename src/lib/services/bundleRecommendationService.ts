import { 
  BundleItem, 
  ProductBundle, 
  CoPurchaseMetric, 
  BundleSourceType 
} from '../../types/bundle';

/**
 * Module 15: Apriori Market Basket Analysis & Heuristic Recommendation Service
 * (Items 4, 5, 22, 23, 25, 26, 31, 32, 33, 34, 38, 39)
 */

export interface OrderBasket {
  order_id: string;
  item_ids: string[];
}

/**
 * Apriori Market Basket Analysis: Computes Support, Confidence & Lift (Item 4, 31)
 * Thresholds: Support >= 1%, Confidence >= 20%, Lift > 1.0
 */
export function calculateAprioriMetrics(
  orders: OrderBasket[],
  minSupport: number = 0.01,
  minConfidence: number = 0.20
): CoPurchaseMetric[] {
  const totalOrders = orders.length;
  if (totalOrders === 0) return [];

  // 1. Calculate individual item frequencies
  const itemFrequencies = new Map<string, number>();
  // 2. Calculate co-purchase pair frequencies
  const pairFrequencies = new Map<string, number>();

  for (const ord of orders) {
    const uniqueItems = Array.from(new Set(ord.item_ids));

    for (let i = 0; i < uniqueItems.length; i++) {
      const a = uniqueItems[i];
      itemFrequencies.set(a, (itemFrequencies.get(a) || 0) + 1);

      for (let j = 0; j < uniqueItems.length; j++) {
        if (i !== j) {
          const b = uniqueItems[j];
          const pairKey = `${a}:::${b}`;
          pairFrequencies.set(pairKey, (pairFrequencies.get(pairKey) || 0) + 1);
        }
      }
    }
  }

  const metrics: CoPurchaseMetric[] = [];

  // 3. Compute metrics for each directional pair (A -> B)
  for (const [pairKey, coCount] of pairFrequencies.entries()) {
    const [itemA, itemB] = pairKey.split(':::');
    const freqA = itemFrequencies.get(itemA) || 0;
    const freqB = itemFrequencies.get(itemB) || 0;

    const support = coCount / totalOrders;
    const confidence = freqA > 0 ? coCount / freqA : 0;
    const probB = freqB / totalOrders;
    const lift = probB > 0 ? confidence / probB : 0;

    // Filter by statutory thresholds (Item 31 & Item 4)
    if (support >= minSupport && confidence >= minConfidence && lift > 1.0) {
      metrics.push({
        product_a_id: itemA,
        product_b_id: itemB,
        co_purchase_count: coCount,
        support: Math.round(support * 1000) / 1000,
        confidence: Math.round(confidence * 1000) / 1000,
        lift_score: Math.round(lift * 100) / 100,
        last_calculated_at: new Date().toISOString(),
      });
    }
  }

  // Sort descending by lift and confidence
  return metrics.sort((a, b) => b.lift_score - a.lift_score || b.confidence - a.confidence);
}

/**
 * Anti-Cannibalization Filter (Item 32)
 * Disallows bundling direct competitor substitute textbooks for the exact same subject and class
 * e.g. Chhaya Mathematics vs Prantik Mathematics for Class 10
 */
export function isAntiCannibalized(primary: BundleItem, candidate: BundleItem): boolean {
  if (primary.product_id === candidate.product_id) {
    return false; // Cannot bundle item with itself
  }

  // If same subject and same category, but different rival publisher/author textbook
  const sameSubject = primary.subject && candidate.subject && primary.subject.toLowerCase() === candidate.subject.toLowerCase();
  const sameCategory = primary.category_id && candidate.category_id && primary.category_id === candidate.category_id;
  
  const differentPublisherOrAuthor =
    (primary.publisher && candidate.publisher && primary.publisher.toLowerCase() !== candidate.publisher.toLowerCase()) ||
    (primary.author && candidate.author && primary.author.toLowerCase() !== candidate.author.toLowerCase()) ||
    (!primary.publisher && !candidate.publisher && primary.product_id !== candidate.product_id);

  // If both are main textbooks (not question bank or mock test or syllabus guide)
  const isPrimaryTextbook = !isComplementaryType(primary.title);
  const isCandidateTextbook = !isComplementaryType(candidate.title);

  if (sameSubject && sameCategory && differentPublisherOrAuthor && isPrimaryTextbook && isCandidateTextbook) {
    return false; // Block cannibalizing rival substitute
  }

  return true;
}

function isComplementaryType(title: string): boolean {
  const lower = title.toLowerCase();
  return (
    lower.includes('question') ||
    lower.includes('solved') ||
    lower.includes('test paper') ||
    lower.includes('mock') ||
    lower.includes('omr') ||
    lower.includes('formula') ||
    lower.includes('handbook') ||
    lower.includes('practice') ||
    lower.includes('map') ||
    lower.includes('প্রশ্নোত্তর') ||
    lower.includes('টেস্ট পেপার') ||
    lower.includes('প্র্যাকটিস')
  );
}

/**
 * Asymmetric Directional Price Validator (Item 26)
 * Avoids recommending a high-priced item on a low-priced item's page
 * e.g. ₹150 paper on ₹600 manual is valid; ₹600 manual on ₹50 notebook is invalid
 */
export function isPriceAsymmetricValid(
  primary: BundleItem | number,
  candidate: BundleItem | number,
  maxMultiplier = 2.0
): boolean {
  const pPrice = typeof primary === 'number' ? primary : primary.unit_selling_price;
  const cPrice = typeof candidate === 'number' ? candidate : candidate.unit_selling_price;
  return cPrice <= pPrice * maxMultiplier;
}

/**
 * Series / Multi-Volume Auto-Grouping Detector (Item 38)
 */
export function isVolumeSeriesMatch(primaryTitle: string, candidateTitle: string): boolean {
  const normalize = (t: string) => t.toLowerCase().replace(/vol(\.|ume)?\s*\d+/i, '').trim();
  const primaryBase = normalize(primaryTitle);
  const candidateBase = normalize(candidateTitle);

  // If base titles match and both indicate different volumes/parts
  const hasVol1 = /vol(\.|ume)?\s*1|part\s*1|১ম\s*খণ্ড/i.test(primaryTitle);
  const hasVol2Or3 = /vol(\.|ume)?\s*[23]|part\s*[23]|[২|৩]য়\s*খণ্ড/i.test(candidateTitle);

  return primaryBase === candidateBase && hasVol1 && hasVol2Or3;
}

/**
 * Resolves the Best Frequently Bought Together Bundle for a Product (Items 5, 25, 34, 39)
 * Priority Hierarchy:
 * 1. Admin Curated Bundle (score 100)
 * 2. Algorithmic Co-Purchase via Apriori (score 75)
 * 3. Heuristic / Category Bestseller Fallback (score 50)
 */
export function resolveFbtBundle(params: {
  primaryProduct: BundleItem;
  catalog: BundleItem[];
  curatedBundles?: ProductBundle[];
  coPurchaseMetrics?: CoPurchaseMetric[];
  isTestPaperSeason?: boolean; // Item 34: Seasonal boost
}): ProductBundle {
  const { primaryProduct, catalog, curatedBundles = [], coPurchaseMetrics = [], isTestPaperSeason = false } = params;

  // 1. Check for Active Admin Curated Bundle (Priority 1 - Item 24, 25)
  const curated = curatedBundles.find(
    (b) => b.is_active && b.primary_product_id === primaryProduct.product_id
  );

  if (curated && curated.items.length >= 2) {
    // Ensure primary item is flagged
    const sanitizedItems = curated.items.map((it) => ({
      ...it,
      is_primary: it.product_id === primaryProduct.product_id,
    }));

    return {
      ...curated,
      items: sanitizedItems,
      bundle_source: 'CURATED',
      priority_score: 100,
    };
  }

  // 2. Check for Algorithmic Co-Purchase Matches (Priority 2 - Item 4, 22)
  const matchingMetrics = coPurchaseMetrics
    .filter((m) => m.product_a_id === primaryProduct.product_id)
    .sort((a, b) => b.lift_score - a.lift_score);

  const algorithmicItems: BundleItem[] = [{ ...primaryProduct, is_primary: true }];

  for (const metric of matchingMetrics) {
    if (algorithmicItems.length >= 3) break; // Max 3 items (Item 6)

    const candidate = catalog.find((c) => c.product_id === metric.product_b_id);
    if (!candidate || !candidate.is_in_stock) continue;

    // Check anti-cannibalization and asymmetric pricing
    if (
      isAntiCannibalized(primaryProduct, candidate) &&
      isPriceAsymmetricValid(primaryProduct.unit_selling_price, candidate.unit_selling_price)
    ) {
      algorithmicItems.push({ ...candidate, is_primary: false });
    }
  }

  if (algorithmicItems.length >= 2) {
    return {
      id: `bndl_algo_${primaryProduct.product_id}`,
      primary_product_id: primaryProduct.product_id,
      title: `${primaryProduct.title} & Frequently Bought Items`,
      title_bn: `${primaryProduct.title_bn || primaryProduct.title} - প্রায়ই একসাথে কেনা কম্বো`,
      items: algorithmicItems,
      discount_type: 'PERCENTAGE',
      discount_value: 5, // Default 5% co-purchase incentive (Item 7)
      bundle_source: 'ALGORITHMIC',
      is_active: true,
      priority_score: 75,
      created_at: new Date().toISOString(),
    };
  }

  // 3. Fallback: Category / Syllabus Bestseller Matching (Priority 3 - Cold Start, Item 5, 33, 39)
  const fallbackCandidates = catalog
    .filter((c) => c.product_id !== primaryProduct.product_id && c.is_in_stock)
    .filter((c) => isAntiCannibalized(primaryProduct, c))
    .filter((c) => isPriceAsymmetricValid(primaryProduct.unit_selling_price, c.unit_selling_price))
    .sort((a, b) => {
      // Prioritize series volumes
      const aIsSeries = isVolumeSeriesMatch(primaryProduct.title, a.title);
      const bIsSeries = isVolumeSeriesMatch(primaryProduct.title, b.title);
      if (aIsSeries && !bIsSeries) return -1;
      if (!aIsSeries && bIsSeries) return 1;

      // Seasonal boost for test papers (Item 34)
      if (isTestPaperSeason) {
        const aIsTest = isComplementaryType(a.title);
        const bIsTest = isComplementaryType(b.title);
        if (aIsTest && !bIsTest) return -1;
        if (!aIsTest && bIsTest) return 1;
      }

      // Prioritize same category
      const aSameCat = a.category_id === primaryProduct.category_id;
      const bSameCat = b.category_id === primaryProduct.category_id;
      if (aSameCat && !bSameCat) return -1;
      if (!aSameCat && bSameCat) return 1;

      // Sort by rating & reviews
      return (b.rating || 0) * (b.total_reviews || 0) - (a.rating || 0) * (a.total_reviews || 0);
    });

  const fallbackItems: BundleItem[] = [{ ...primaryProduct, is_primary: true }];
  for (const c of fallbackCandidates) {
    if (fallbackItems.length >= 3) break;
    fallbackItems.push({ ...c, is_primary: false });
  }

  return {
    id: `bndl_fallback_${primaryProduct.product_id}`,
    primary_product_id: primaryProduct.product_id,
    title: `${primaryProduct.title} Study Combo Pack`,
    title_bn: `${primaryProduct.title_bn || primaryProduct.title} - স্টাডি কম্বো প্যাক`,
    items: fallbackItems,
    discount_type: 'FLAT',
    discount_value: 30, // Flat ₹30 off on fallback combo
    bundle_source: 'CATEGORY_FALLBACK',
    is_active: true,
    priority_score: 50,
    created_at: new Date().toISOString(),
  };
}
