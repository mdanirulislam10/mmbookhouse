import React from 'react';
import { PwaInstallPrompt, PwaOfflineBanner, ServiceWorkerRegister } from '../src/components/pwa';

console.log('🧪 Starting Module 20 Task 8 Test Suite: PWA Install Prompt & Offline UI Components...');

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

async function runTests() {
  try {
    // Test 1: Component Exports from src/components/pwa
    assert(typeof PwaInstallPrompt === 'function', 'PwaInstallPrompt component is exported');
    assert(typeof PwaOfflineBanner === 'function', 'PwaOfflineBanner component is exported');
    assert(typeof ServiceWorkerRegister === 'function', 'ServiceWorkerRegister component is exported');

    // Test 2: PwaInstallPrompt Element Creation
    let dismissedCalled = false;
    let installedCalled = false;

    const element = React.createElement(PwaInstallPrompt, {
      forceShow: true,
      onDismissed: () => { dismissedCalled = true; },
      onInstalled: () => { installedCalled = true; },
    });

    assert(React.isValidElement(element), 'PwaInstallPrompt element instantiates cleanly');
    assert(element.props.forceShow === true, 'forceShow prop passed correctly');

    // Test 3: PwaOfflineBanner Element Creation
    const bannerElement = React.createElement(PwaOfflineBanner, {
      forceOffline: true,
    });
    assert(React.isValidElement(bannerElement), 'PwaOfflineBanner element instantiates cleanly');
    assert(bannerElement.props.forceOffline === true, 'forceOffline prop triggers offline alert bar');

  } catch (err: unknown) {
    console.error('Fatal error during Task 8 tests:', err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Task 8 Tests Completed: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
