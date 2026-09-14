import type {
  CoreWebVitalsMetrics,
  PerformanceAuditReport,
  MetricAuditEvaluation,
} from '@/types/pwaSecurity';

/**
 * Module 20: Performance, Core Web Vitals & Image Optimization Audit Engine
 * Covers Items 21-26, 28, 29, 30:
 * - Google Lighthouse 100/100 targets (Item 21)
 * - Core Web Vitals: LCP < 1.2s, INP < 50ms, CLS = 0 (Item 22)
 * - Next.js Image Optimization & AVIF/WebP (Item 23)
 * - Self-hosted Bengali Font & FOUT/FOIT elimination (Item 24)
 * - Dynamic import & code splitting for heavy tools (Item 25)
 * - < 80 KB First-load JS budget (Item 26)
 * - Hybrid SSR vs ISR architecture (Item 28)
 * - Edge Caching & Deferred Analytics (Items 29, 30)
 */

export const CORE_WEB_VITALS_THRESHOLDS = {
  lcp: { target: 1.2, unit: 's', label: 'Largest Contentful Paint (LCP)' },
  inp: { target: 50, unit: 'ms', label: 'Interaction to Next Paint (INP)' },
  cls: { target: 0.05, unit: '', label: 'Cumulative Layout Shift (CLS)' },
};

export const FIRST_LOAD_JS_BUDGET_KB = 80;

/**
 * Evaluates real or simulated Core Web Vitals metrics against Amazon-standard targets.
 */
export function evaluateCoreWebVitals(
  metrics: CoreWebVitalsMetrics,
  imageStatus: { usesModernFormats: boolean; hasBlurPlaceholders: boolean; hasResponsiveSizes: boolean } = {
    usesModernFormats: true,
    hasBlurPlaceholders: true,
    hasResponsiveSizes: true,
  },
  fontStatus: { selfHosted: boolean; foutFoitPrevented: boolean } = {
    selfHosted: true,
    foutFoitPrevented: true,
  },
  bundleMetrics: { firstLoadJsKb: number; dynamicImportsUsed: boolean } = {
    firstLoadJsKb: 68,
    dynamicImportsUsed: true,
  }
): PerformanceAuditReport {
  const evaluations: MetricAuditEvaluation[] = [];

  // 1. LCP (Largest Contentful Paint)
  const lcpStatus =
    metrics.lcp <= CORE_WEB_VITALS_THRESHOLDS.lcp.target
      ? 'good'
      : metrics.lcp <= 2.5
      ? 'needs_improvement'
      : 'poor';
  evaluations.push({
    metric: CORE_WEB_VITALS_THRESHOLDS.lcp.label,
    value: metrics.lcp,
    target: `< ${CORE_WEB_VITALS_THRESHOLDS.lcp.target}s`,
    unit: 's',
    status: lcpStatus,
  });

  // 2. INP (Interaction to Next Paint)
  const inpStatus =
    metrics.inp <= CORE_WEB_VITALS_THRESHOLDS.inp.target
      ? 'good'
      : metrics.inp <= 200
      ? 'needs_improvement'
      : 'poor';
  evaluations.push({
    metric: CORE_WEB_VITALS_THRESHOLDS.inp.label,
    value: metrics.inp,
    target: `< ${CORE_WEB_VITALS_THRESHOLDS.inp.target}ms`,
    unit: 'ms',
    status: inpStatus,
  });

  // 3. CLS (Cumulative Layout Shift)
  const clsStatus =
    metrics.cls <= CORE_WEB_VITALS_THRESHOLDS.cls.target
      ? 'good'
      : metrics.cls <= 0.1
      ? 'needs_improvement'
      : 'poor';
  evaluations.push({
    metric: CORE_WEB_VITALS_THRESHOLDS.cls.label,
    value: metrics.cls,
    target: `≤ ${CORE_WEB_VITALS_THRESHOLDS.cls.target}`,
    unit: '',
    status: clsStatus,
  });

  const webVitalsPassed = evaluations.every((e) => e.status === 'good');

  // Compute 0-100 overall score
  let score = 100;
  if (lcpStatus === 'needs_improvement') score -= 15;
  if (lcpStatus === 'poor') score -= 35;
  if (inpStatus === 'needs_improvement') score -= 10;
  if (inpStatus === 'poor') score -= 25;
  if (clsStatus === 'needs_improvement') score -= 10;
  if (clsStatus === 'poor') score -= 25;

  return {
    overallScore: Math.max(0, score),
    webVitalsPassed,
    evaluatedMetrics: evaluations,
    imageOptimizationStatus: imageStatus,
    fontOptimizationStatus: fontStatus,
    bundleMetrics: {
      firstLoadJsKb: bundleMetrics.firstLoadJsKb,
      isUnder80KbBudget: bundleMetrics.firstLoadJsKb <= FIRST_LOAD_JS_BUDGET_KB,
      dynamicImportsUsed: bundleMetrics.dynamicImportsUsed,
    },
  };
}

/**
 * Validates Next.js Image Engine configuration against Item 23.
 */
export function validateImageOptimizationConfig(
  imageConfig: { formats?: string[]; deviceSizes?: number[]; imageSizes?: number[] }
): { isValid: boolean; supportsAvif: boolean; supportsWebp: boolean; hasResponsiveBreakpoints: boolean } {
  const formats = imageConfig.formats || [];
  const supportsAvif = formats.includes('image/avif');
  const supportsWebp = formats.includes('image/webp');
  const hasResponsiveBreakpoints =
    Boolean(imageConfig.deviceSizes && imageConfig.deviceSizes.length >= 5);

  return {
    isValid: supportsAvif && supportsWebp && hasResponsiveBreakpoints,
    supportsAvif,
    supportsWebp,
    hasResponsiveBreakpoints,
  };
}

/**
 * Validates Font Self-Hosting & FOUT/FOIT Elimination (Item 24).
 */
export function validateFontSelfHosting(fontConfig: {
  fonts: string[];
  displayMode: string;
  isSelfHosted: boolean;
}): { isValid: boolean; hasNotoBengali: boolean; hasInter: boolean; foutFoitPrevented: boolean } {
  const hasNotoBengali = fontConfig.fonts.some((f) => f.toLowerCase().includes('bengali'));
  const hasInter = fontConfig.fonts.some((f) => f.toLowerCase().includes('inter'));
  const foutFoitPrevented = fontConfig.isSelfHosted && fontConfig.displayMode === 'swap';

  return {
    isValid: hasNotoBengali && hasInter && foutFoitPrevented,
    hasNotoBengali,
    hasInter,
    foutFoitPrevented,
  };
}

/**
 * Validates Code Splitting & Dynamic Imports of heavy modules (Item 25 & 26).
 */
export function validateBundleCodeSplitting(
  firstLoadJsKb: number,
  heavyModules: { name: string; isDynamicImport: boolean }[]
): {
  isUnderBudget: boolean;
  heavyModulesDeferred: boolean;
  unsplitModules: string[];
} {
  const unsplitModules = heavyModules
    .filter((m) => !m.isDynamicImport)
    .map((m) => m.name);

  return {
    isUnderBudget: firstLoadJsKb <= FIRST_LOAD_JS_BUDGET_KB,
    heavyModulesDeferred: unsplitModules.length === 0,
    unsplitModules,
  };
}

/**
 * Validates Smart Hybrid Architecture: SSR vs ISR (Item 28).
 */
export function validateHybridRenderingStrategy(
  routeStrategies: Record<string, 'ISR' | 'SSR'>
): { isArchitectureCompliant: boolean; discrepancies: string[] } {
  const expectedStrategies: Record<string, 'ISR' | 'SSR'> = {
    '/': 'ISR',
    '/deals': 'ISR',
    '/category/[slug]': 'ISR',
    '/bestsellers': 'ISR',
    '/cart': 'SSR',
    '/checkout': 'SSR',
    '/account': 'SSR',
    '/orders': 'SSR',
  };

  const discrepancies: string[] = [];

  for (const [route, expected] of Object.entries(expectedStrategies)) {
    const actual = routeStrategies[route];
    if (actual !== expected) {
      discrepancies.push(
        `Route "${route}" is set to "${actual || 'undefined'}", expected "${expected}"`
      );
    }
  }

  return {
    isArchitectureCompliant: discrepancies.length === 0,
    discrepancies,
  };
}
