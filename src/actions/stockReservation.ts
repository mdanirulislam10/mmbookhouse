'use server';

/**
 * Module 12: Server Action for 5-Minute Dedicated Stock Reservation (Item 31, 32, 36)
 */
import {
  reserveStock,
  releaseSessionReservations,
} from '@/lib/services/stockReservationService';

export async function reserveStockAction({
  sessionId,
  items,
}: {
  sessionId: string;
  items: Array<{ bookId: string; quantity: number; maxQuantity?: number }>;
}) {
  try {
    for (const item of items) {
      const res = reserveStock({
        sessionId,
        bookId: item.bookId,
        quantity: item.quantity,
        availableStock: item.maxQuantity || 10,
      });
      if (!res.success) {
        return res;
      }
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message };
  }
}

export async function releaseStockAction(sessionId: string) {
  try {
    releaseSessionReservations(sessionId);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message };
  }
}
