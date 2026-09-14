/**
 * In-memory store of processed WhatsApp COD responses for testing/audit.
 * Decoupled from route handlers to strictly adhere to Next.js 15 App Router route type rules.
 */

export interface InboundButtonResponse {
  from: string;
  payload: string;
  action: 'CONFIRM_COD' | 'CANCEL_COD' | 'OTHER';
  order_id?: string;
  timestamp: string;
}

export const inboundButtonResponses: InboundButtonResponse[] = [];
