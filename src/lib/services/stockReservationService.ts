/**
 * MM Book House - Module 12: 5-Minute Dedicated Stock Reservation Engine
 * 
 * Implements:
 * - 5-Minute Inventory Hold Lock on Step 3 (Item 31)
 * - Automatic Expiration & Lock Release past 5 minutes (Item 32)
 * - Server-side Last-Mile Stock Concurrency Guard (Item 36)
 * - High-concurrency Race Condition Prevention for scarce exam books
 */

import { StockReservation } from '@/types/checkout';

// 5 Minutes in Milliseconds (Item 31)
export const STOCK_RESERVATION_TTL_MS = 5 * 60 * 1000;

// In-Memory store for active stock reservations
const activeReservations = new Map<string, StockReservation>();

/**
 * Purges expired reservations older than 5 minutes (Item 32)
 */
export function cleanExpiredReservations(): number {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [id, res] of activeReservations.entries()) {
    if (!res.orderPlaced && now > res.expiresAt) {
      activeReservations.delete(id);
      cleanedCount++;
    }
  }

  return cleanedCount;
}

/**
 * Calculates currently locked/reserved quantity for a given book across active sessions
 */
export function getCurrentlyReservedQuantity(bookId: string): number {
  cleanExpiredReservations();
  const now = Date.now();
  let totalReserved = 0;

  for (const res of activeReservations.values()) {
    if (res.bookId === bookId && !res.released && !res.orderPlaced && now <= res.expiresAt) {
      totalReserved += res.quantity;
    }
  }

  return totalReserved;
}

/**
 * Reserves stock for 5 minutes during Step 3 of checkout (Item 31, 36)
 */
export function reserveStock({
  sessionId,
  bookId,
  quantity,
  availableStock,
}: {
  sessionId: string;
  bookId: string;
  quantity: number;
  availableStock: number;
}): {
  success: boolean;
  reservationId?: string;
  expiresAt?: number;
  remainingAvailableStock: number;
  error?: string;
  errorBn?: string;
} {
  cleanExpiredReservations();
  const now = Date.now();
  const currentlyReserved = getCurrentlyReservedQuantity(bookId);
  const effectiveAvailable = Math.max(0, availableStock - currentlyReserved);

  if (effectiveAvailable < quantity) {
    return {
      success: false,
      remainingAvailableStock: effectiveAvailable,
      error: `Only ${effectiveAvailable} copies available. Another customer is completing payment.`,
      errorBn: `বইটির মাত্র ${effectiveAvailable} কপি অবশিষ্ট রয়েছে। অন্য একজন শিক্ষার্থী বর্তমানে পেমেন্ট করছেন।`,
    };
  }

  const reservationId = `resv_${bookId}_${sessionId}`;
  const expiresAt = now + STOCK_RESERVATION_TTL_MS;

  const reservation: StockReservation = {
    reservationId,
    sessionId,
    bookId,
    quantity,
    reservedAt: now,
    expiresAt,
    released: false,
    orderPlaced: false,
  };

  activeReservations.set(reservationId, reservation);

  return {
    success: true,
    reservationId,
    expiresAt,
    remainingAvailableStock: effectiveAvailable - quantity,
  };
}

/**
 * Releases a specific reservation if checkout abandoned or payment failed (Item 32)
 */
export function releaseStockReservation(reservationId: string): boolean {
  const res = activeReservations.get(reservationId);
  if (res) {
    res.released = true;
    activeReservations.delete(reservationId);
    return true;
  }
  for (const [id, item] of activeReservations.entries()) {
    if (id.startsWith(reservationId) || id === reservationId) {
      item.released = true;
      activeReservations.delete(id);
      return true;
    }
  }
  return false;
}

/**
 * Releases all reservations associated with a session
 */
export function releaseSessionReservations(sessionId: string): number {
  let count = 0;
  for (const [id, res] of activeReservations.entries()) {
    if (res.sessionId === sessionId) {
      res.released = true;
      activeReservations.delete(id);
      count++;
    }
  }
  return count;
}

/**
 * Commits stock reservation permanently upon successful order placement (Item 40)
 */
export function commitStockReservation(reservationId: string): boolean {
  const res = activeReservations.get(reservationId);
  if (res) {
    res.orderPlaced = true;
    activeReservations.delete(reservationId);
    return true;
  }
  for (const [id, item] of activeReservations.entries()) {
    if (id.startsWith(reservationId) || id === reservationId) {
      item.orderPlaced = true;
      activeReservations.delete(id);
      return true;
    }
  }
  return false;
}

/**
 * Helper to get active reservation count (used for testing and monitoring)
 */
export function getActiveReservationsCount(): number {
  cleanExpiredReservations();
  return activeReservations.size;
}

/**
 * Clears all reservations (used for test teardown)
 */
export function resetStockReservationsForTesting(): void {
  activeReservations.clear();
}
