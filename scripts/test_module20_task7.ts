import { GET } from '../src/app/api/health/route';
import { checkSystemHealth } from '../src/lib/services/systemHealthService';
import {
  captureExceptionAndAlert,
  getRecentErrorAlerts,
  clearErrorAlertsForTesting,
} from '../src/lib/services/errorMonitoringService';

console.log('🧪 Starting Module 20 Task 7 Test Suite: System Health Check & Sentry Error Monitoring...');

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
    // Test 1: Direct System Health Check Evaluation (Item 39)
    const health = await checkSystemHealth();
    assert(health.status === 'healthy', 'Overall system health status is "healthy"');
    assert(health.services.length === 3, 'Health monitor audits all 3 core services (DB, Cache, Notifications)');

    const dbService = health.services.find((s) => s.serviceName.includes('Supabase'));
    assert(
      Boolean(dbService && dbService.status === 'ok' && dbService.latencyMs < 100),
      'Supabase Database connection is active with low latency'
    );

    const cacheService = health.services.find((s) => s.serviceName.includes('Rate Limiter'));
    assert(Boolean(cacheService && cacheService.status === 'ok'), 'Rate limiter & edge cache service is active');

    const notificationService = health.services.find((s) => s.serviceName.includes('Notification'));
    assert(Boolean(notificationService && notificationService.status === 'ok'), 'Notification pipeline is active');

    assert(health.uptimeSeconds >= 0, 'Server uptime reported accurately');
    assert(health.memoryUsageMb > 0, 'Process heap memory usage metric provided');
    assert(health.activePoolConnections > 0, 'Active Supavisor connection pool reported (Item 27)');

    // Test 2: Next.js API Route GET Response
    const response = await GET();
    assert(response.status === 200, '/api/health returns HTTP 200 OK');
    assert(
      response.headers.get('Cache-Control') === 'no-store, max-age=0',
      'Health endpoint response is strictly un-cached (no-store)'
    );

    // Test 3: Sentry / Telegram Emergency Telemetry Service (Item 38)
    clearErrorAlertsForTesting();
    const testError = new Error('Database connection reset during peak checkout');
    const alert = captureExceptionAndAlert(testError, {
      endpoint: '/api/payment/verify',
      userId: 'usr_malda_9981',
      severity: 'critical',
    });

    assert(alert.errorId.startsWith('ERR_'), 'Error alerting engine generates unique error tracking ID');
    assert(alert.severity === 'critical', 'Critical severity properly logged');
    assert(alert.endpoint === '/api/payment/verify', 'Originating endpoint captured in context');
    assert(alert.stackTrace !== undefined, 'Stack trace captured for developer diagnosis');

    const recent = getRecentErrorAlerts();
    assert(recent.length === 1 && recent[0].errorId === alert.errorId, 'Error logged to recent telemetry queue');

  } catch (err: unknown) {
    console.error('Fatal error during Task 7 tests:', err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Task 7 Tests Completed: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
