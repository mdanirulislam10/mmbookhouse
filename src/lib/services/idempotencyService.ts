/**
 * MM Book House - Module 12: Order Placement Idempotency Engine
 * 
 * Implements:
 * - Double-Click & Replay Protection (Item 33)
 * - In-Flight Request Deduplication
 * - Cached Idempotent Response Return for Network Retries
 * - 24-Hour TTL Expiration
 */

import { PlaceOrderResult } from '@/types/checkout';

interface IdempotencyRecord {
  key: string;
  payloadHash?: string;
  status: 'IN_FLIGHT' | 'COMPLETED';
  response?: PlaceOrderResult;
  createdAt: number;
  expiresAt: number; // 24 hours
}

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
const idempotencyStore = new Map<string, IdempotencyRecord>();

/**
 * Purges records older than 24 hours
 */
function purgeExpiredRecords(): void {
  const now = Date.now();
  for (const [key, record] of idempotencyStore.entries()) {
    if (now > record.expiresAt) {
      idempotencyStore.delete(key);
    }
  }
}

/**
 * Checks or registers an idempotency key.
 * If key is already IN_FLIGHT, rejects duplicate concurrent clicks.
 * If key is already COMPLETED, returns previous cached order response.
 * If key is NEW, registers it as IN_FLIGHT.
 */
export function checkOrRegisterIdempotency(
  key: string,
  payloadHash?: string
): {
  allowed: boolean;
  status: 'NEW' | 'IN_FLIGHT' | 'COMPLETED';
  cachedResponse?: PlaceOrderResult;
  error?: string;
  errorBn?: string;
} {
  purgeExpiredRecords();
  const now = Date.now();
  const record = idempotencyStore.get(key);

  if (record) {
    if (record.status === 'IN_FLIGHT') {
      return {
        allowed: false,
        status: 'IN_FLIGHT',
        error: 'Order is already being processed. Please do not click repeatedly.',
        errorBn: 'আপনার অর্ডারটি বর্তমানে প্রক্রিয়াকরণ চলছে। অনুগ্রহ করে বারবার ক্লিক করবেন না।',
      };
    }

    if (record.status === 'COMPLETED' && record.response) {
      return {
        allowed: false,
        status: 'COMPLETED',
        cachedResponse: record.response,
      };
    }
  }

  // Register new in-flight record
  idempotencyStore.set(key, {
    key,
    payloadHash,
    status: 'IN_FLIGHT',
    createdAt: now,
    expiresAt: now + IDEMPOTENCY_TTL_MS,
  });

  return {
    allowed: true,
    status: 'NEW',
  };
}

/**
 * Marks request as completed and caches the result for safe replays
 */
export function markIdempotencyCompleted(key: string, response: PlaceOrderResult): void {
  const record = idempotencyStore.get(key);
  if (record) {
    record.status = 'COMPLETED';
    record.response = response;
  }
}

/**
 * Releases or clears an in-flight key if an unexpected transaction error occurred
 */
export function releaseIdempotencyKey(key: string): void {
  idempotencyStore.delete(key);
}

/**
 * Helper to reset store during testing
 */
export function resetIdempotencyStoreForTesting(): void {
  idempotencyStore.clear();
}
