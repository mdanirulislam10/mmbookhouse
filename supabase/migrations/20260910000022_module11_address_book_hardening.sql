-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 11: Customer Address Book & Delivery Intelligence Engine
-- Migration: 20260910000022_module11_address_book_hardening.sql
--
-- Fixes the schema drift discovered during the Module 11 chief-architect audit:
--   1. Adds `deleted_at` so soft-delete (Item 38) actually persists and the
--      historical order/invoice foreign-key integrity is preserved.
--   2. Adds `delivery_preferences JSONB` (Items 13-17, 33) so delivery
--      instructions (call before delivery, weekend lock, gate notes, time slot,
--      leave-with-neighbor) are stored per address and can be frozen into the
--      immutable order snapshot.
--   3. Adds a partial index for fast active-address lookups.
-- ==============================================================================

ALTER TABLE customer_addresses
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE customer_addresses
    ADD COLUMN IF NOT EXISTS delivery_preferences JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN customer_addresses.deleted_at IS
    'Soft-delete timestamp; address rows are never hard-deleted so order and invoice foreign keys remain valid';
COMMENT ON COLUMN customer_addresses.delivery_preferences IS
    'JSONB delivery instructions: callBeforeDelivery, leaveWithSecurity, doNotRingBell, isWeekendClosed, specialInstructions, preferredTimeSlot, leaveWithNeighbor';

-- High-performance partial index for active (non-deleted) address queries
CREATE INDEX IF NOT EXISTS idx_customer_addresses_active
    ON customer_addresses(user_id)
    WHERE deleted_at IS NULL;
