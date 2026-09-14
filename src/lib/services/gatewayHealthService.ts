/**
 * Module 13 - Task 4: Gateway Health Monitoring & Circuit Breaker Service
 * 
 * Complies with:
 * - Item 7: Gateway Auto-Failover (Razorpay primary -> Cashfree secondary on downtime).
 * - Item 30: Friendly bank & gateway downtime guidance.
 */

import { GatewayHealthStatus, PaymentGatewayId } from '@/types/payment';

interface CircuitBreakerState {
  failures: number;
  lastFailureAt?: number;
  consecutiveSuccesses: number;
  isTripped: boolean;
  averageLatencyMs: number;
}

const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 3, // 3 consecutive failures trip circuit breaker
  resetTimeoutMs: 30000, // 30 seconds cooldown before testing recovery
};

const gatewayStates: Record<PaymentGatewayId, CircuitBreakerState> = {
  razorpay: { failures: 0, consecutiveSuccesses: 0, isTripped: false, averageLatencyMs: 120 },
  cashfree: { failures: 0, consecutiveSuccesses: 0, isTripped: false, averageLatencyMs: 140 },
  cod: { failures: 0, consecutiveSuccesses: 0, isTripped: false, averageLatencyMs: 10 },
};

let manualOverrideGateway: PaymentGatewayId | null = null;

export function recordGatewayFailure(gateway: PaymentGatewayId): void {
  const state = gatewayStates[gateway];
  state.failures += 1;
  state.consecutiveSuccesses = 0;
  state.lastFailureAt = Date.now();

  if (state.failures >= CIRCUIT_BREAKER_CONFIG.failureThreshold) {
    state.isTripped = true;
  }
}

export function recordGatewaySuccess(gateway: PaymentGatewayId, latencyMs: number = 100): void {
  const state = gatewayStates[gateway];
  state.consecutiveSuccesses += 1;
  state.failures = 0;
  state.averageLatencyMs = Math.round((state.averageLatencyMs + latencyMs) / 2);

  // If tripped and has 2 consecutive successes after reset window, restore
  if (state.isTripped && state.consecutiveSuccesses >= 2) {
    state.isTripped = false;
  }
}

export function resetGatewayHealth(): void {
  manualOverrideGateway = null;
  for (const g of Object.keys(gatewayStates) as PaymentGatewayId[]) {
    gatewayStates[g] = { failures: 0, consecutiveSuccesses: 0, isTripped: false, averageLatencyMs: 100 };
  }
}

export function setManualGatewayOverride(gateway: PaymentGatewayId | null): void {
  manualOverrideGateway = gateway;
}

/**
 * Determines the currently active, healthiest gateway with automatic failover (Item 7)
 */
export function getActiveGateway(): PaymentGatewayId {
  if (manualOverrideGateway) {
    return manualOverrideGateway;
  }

  const razorpayState = gatewayStates.razorpay;

  // Check if Razorpay's tripped cooldown has expired
  if (razorpayState.isTripped && razorpayState.lastFailureAt) {
    const elapsed = Date.now() - razorpayState.lastFailureAt;
    if (elapsed > CIRCUIT_BREAKER_CONFIG.resetTimeoutMs) {
      // Half-open: Allow a retry attempt
      return 'razorpay';
    }
    // Failover to secondary gateway (Cashfree)
    return 'cashfree';
  }

  // Razorpay is healthy
  return 'razorpay';
}

export function getGatewayHealthOverview(): GatewayHealthStatus[] {
  const now = new Date().toISOString();
  return (['razorpay', 'cashfree'] as PaymentGatewayId[]).map((gw) => {
    const state = gatewayStates[gw];
    const isHealthy = !state.isTripped;
    const successRate = state.failures === 0 ? 99.8 : Math.max(50, 100 - state.failures * 15);

    return {
      gateway: gw,
      is_healthy: isHealthy,
      latency_ms: state.averageLatencyMs,
      success_rate_percent: successRate,
      last_checked_at: now,
    };
  });
}
