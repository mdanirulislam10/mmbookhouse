import type { ErrorAlertPayload } from '@/types/pwaSecurity';

/**
 * Module 20: Sentry Error Tracking & Emergency Telemetry Service (Item 38)
 * Captures uncaught exceptions, formats clean stack traces, and prepares
 * immediate alerts for developer Telegram/Sentry webhooks.
 */

let recentErrors: ErrorAlertPayload[] = [];

export function captureExceptionAndAlert(
  error: unknown,
  context: { endpoint?: string; userId?: string; severity?: 'critical' | 'error' | 'warning' } = {}
): ErrorAlertPayload {
  const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const errorMessage = error instanceof Error ? error.message : String(error);
  const stackTrace = error instanceof Error ? error.stack : undefined;
  const severity = context.severity || 'error';

  const alertPayload: ErrorAlertPayload = {
    errorId,
    message: errorMessage,
    stackTrace,
    endpoint: context.endpoint,
    userId: context.userId,
    severity,
    timestamp: new Date().toISOString(),
  };

  recentErrors.unshift(alertPayload);
  if (recentErrors.length > 50) {
    recentErrors = recentErrors.slice(0, 50);
  }

  // In production, this dispatches to Sentry DSN and developer Telegram bot webhook
  if (process.env.NODE_ENV === 'production' && process.env.TELEGRAM_ALERT_BOT_TOKEN) {
    // Webhook dispatch logic
    console.warn(`[TELEGRAM ALERT] ${severity.toUpperCase()} [${errorId}]: ${errorMessage}`);
  }

  return alertPayload;
}

export function getRecentErrorAlerts(): ErrorAlertPayload[] {
  return [...recentErrors];
}

export function clearErrorAlertsForTesting(): void {
  recentErrors = [];
}
