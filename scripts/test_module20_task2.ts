import manifest from '../src/app/manifest';
import {
  pwaManifestConfig,
  pwaSplashConfig,
  pwaShortcuts,
  validatePwaInstallability,
} from '../src/lib/services/pwaManifestService';

console.log('🧪 Starting Module 20 Task 2 Test Suite: Web App Manifest & App Shortcuts Engine...');

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
}

try {
  // Test 1: Next.js MetadataRoute Manifest Invocation
  const generatedManifest = manifest();
  assert(
    generatedManifest.name === 'M.M Book House Malda | উত্তরবঙ্গের নির্ভরযোগ্য বইয়ের দোকান',
    'Manifest generates correct full Bengali brand name'
  );
  assert(
    generatedManifest.short_name === 'MM Books',
    'Manifest provides clean short_name "MM Books"'
  );

  // Test 2: Display Mode and Theme (Items 2 & 9)
  assert(
    generatedManifest.display === 'standalone',
    'Manifest display mode is set to "standalone" for full mobile app look'
  );
  assert(
    generatedManifest.theme_color === '#131921',
    'Manifest theme_color is Amazon Navy (#131921)'
  );
  assert(
    generatedManifest.background_color === '#FFFFFF',
    'Manifest background_color is clean white (#FFFFFF)'
  );

  // Test 3: Icon Configuration (192x192 & 512x512 maskable/any)
  const has192Maskable = generatedManifest.icons?.some(
    (icon) => icon.sizes === '192x192' && icon.purpose === 'maskable'
  );
  const has512Maskable = generatedManifest.icons?.some(
    (icon) => icon.sizes === '512x512' && icon.purpose === 'maskable'
  );
  const has512Any = generatedManifest.icons?.some(
    (icon) => icon.sizes === '512x512' && icon.purpose === 'any'
  );

  assert(Boolean(has192Maskable), '192x192 maskable icon is properly declared');
  assert(Boolean(has512Maskable), '512x512 maskable icon is properly declared');
  assert(Boolean(has512Any), '512x512 any icon is properly declared');

  // Test 4: 3 App Shortcuts for Home Screen Long-Press (Item 7)
  const shortcuts = generatedManifest.shortcuts || [];
  assert(shortcuts.length === 3, 'Manifest defines exactly 3 quick app shortcuts');

  const trackShortcut = shortcuts.find((s) => s.url === '/orders?action=track');
  const searchShortcut = shortcuts.find((s) => s.url === '/search?focus=true');
  const dealsShortcut = shortcuts.find((s) => s.url === '/deals?flash=true');

  assert(
    Boolean(trackShortcut && trackShortcut.short_name === 'Track Order'),
    'App shortcut 1: "📦 Track Order" configured with direct deep link'
  );
  assert(
    Boolean(searchShortcut && searchShortcut.short_name === 'Search Books'),
    'App shortcut 2: "🔍 Search Books" configured with auto-focus search link'
  );
  assert(
    Boolean(dealsShortcut && dealsShortcut.short_name === 'Deal of the Day'),
    'App shortcut 3: "⚡ Deal of the Day" configured with flash deals deep link'
  );

  // Test 5: Splash Screen Config (Item 9)
  assert(
    pwaSplashConfig.backgroundColor === '#131921',
    'Splash screen background is #131921 Navy'
  );
  assert(
    pwaSplashConfig.themeColor === '#febd69',
    'Splash screen accent is #febd69 Gold'
  );
  assert(
    pwaSplashConfig.durationMs === 1000,
    'Splash screen duration is exactly 1 second (1000ms)'
  );
  assert(
    pwaSplashConfig.taglineBengali === 'উত্তরবঙ্গের নির্ভরযোগ্য বইয়ের দোকান',
    'Splash screen features authentic Bengali tagline'
  );

  // Test 6: Google PWA Installability Validation
  const audit = validatePwaInstallability(pwaManifestConfig);
  assert(audit.isInstallable, 'PWA Manifest passes 100% of Google PWA installability criteria');
  assert(audit.checks.length >= 7, 'All 7 criteria verified successfully');

} catch (err: unknown) {
  console.error('Fatal error during Task 2 tests:', err);
  failed++;
}

console.log(`\n========================================`);
console.log(`Task 2 Tests Completed: ${passed} Passed, ${failed} Failed`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
}
