-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 1: Database & Entity Relationship Schema Design
-- Part 10 (Tasks 46 to 50): Security Audit, Soft Deletes, DPDP Act 2023 & DR
-- Database Engine: Supabase (PostgreSQL 16)
-- Migration: 20260907000012_security_audit_disaster_recovery.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TASK 46: SOFT DELETES & FILTERING SYSTEM
-- ------------------------------------------------------------------------------
ALTER TABLE books ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE book_variants ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE publishers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- High-performance partial indexes for active (non-deleted) queries
CREATE INDEX IF NOT EXISTS idx_books_deleted_at ON books(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_book_variants_deleted_at ON book_variants(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_publishers_deleted_at ON publishers(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_authors_deleted_at ON authors(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON categories(deleted_at) WHERE deleted_at IS NULL;

-- RPC Function: Safely soft-delete a book and all its active variants
CREATE OR REPLACE FUNCTION soft_delete_book(p_book_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE books
    SET deleted_at = NOW(),
        updated_at = NOW()
    WHERE id = p_book_id;

    UPDATE book_variants
    SET deleted_at = NOW(),
        updated_at = NOW()
    WHERE book_id = p_book_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC Function: Restore a soft-deleted book and its variants
CREATE OR REPLACE FUNCTION restore_book(p_book_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE books
    SET deleted_at = NULL,
        updated_at = NOW()
    WHERE id = p_book_id;

    UPDATE book_variants
    SET deleted_at = NULL,
        updated_at = NOW()
    WHERE book_id = p_book_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- TASK 47: IMMUTABLE AUDIT TRAIL LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'Append-only forensic audit trail for sensitive administrative and catalog actions';

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- Security Trigger: Guarantee immutability (disallow any UPDATE or DELETE)
CREATE OR REPLACE FUNCTION prevent_audit_log_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Security Violation: Audit logs are strictly immutable and cannot be modified or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_audit_log_tampering ON audit_logs;
CREATE TRIGGER trigger_prevent_audit_log_tampering
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_tampering();

-- Helper Function: Log administrative audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_user_id UUID,
    p_user_role VARCHAR,
    p_action VARCHAR,
    p_entity_type VARCHAR,
    p_entity_id UUID,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        user_id, user_role, action, entity_type, entity_id,
        old_values, new_values, ip_address, user_agent
    )
    VALUES (
        p_user_id, p_user_role, p_action, p_entity_type, p_entity_id,
        p_old_values, p_new_values, p_ip, p_user_agent
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- TASK 48: INDIA DPDP ACT 2023 USER ANONYMIZATION COMPLIANCE
-- ------------------------------------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_anonymized BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMPTZ DEFAULT NULL;

-- Function: Anonymize customer data while retaining GST accounting compliance
CREATE OR REPLACE FUNCTION anonymize_user_data(
    p_user_id UUID,
    p_admin_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_masked_name VARCHAR;
    v_masked_email VARCHAR;
BEGIN
    -- Check if already anonymized
    IF EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND is_anonymized = TRUE) THEN
        RETURN;
    END IF;

    v_masked_name := 'Anonymized Customer ' || SUBSTRING(p_user_id::text, 1, 8);
    v_masked_email := 'redacted_' || MD5(p_user_id::text) || '@anonymized.mmbookhouse.com';

    -- 1. Anonymize customer profile PII
    UPDATE profiles
    SET full_name = v_masked_name,
        full_name_bn = 'নাম অপ্রকাশিত গ্রাহক',
        email = v_masked_email,
        phone_number = '+910000000000',
        avatar_url = NULL,
        loyalty_points_balance = 0,
        is_anonymized = TRUE,
        anonymized_at = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;

    -- 2. Clear customer active sessions and shopping carts
    DELETE FROM cart_items WHERE user_id = p_user_id;
    DELETE FROM wishlist_items WHERE user_id = p_user_id;
    DELETE FROM user_alerts WHERE user_id = p_user_id;
    DELETE FROM author_followers WHERE user_id = p_user_id;

    -- 3. Redact address book details
    UPDATE customer_addresses
    SET recipient_name = 'Redacted Customer',
        recipient_phone = '+910000000000',
        alternate_phone = NULL,
        street_address = 'Address Redacted as per DPDP Act 2023',
        landmark = NULL
    WHERE user_id = p_user_id;

    -- 4. Redact snapshot PII in historical orders while preserving State/Pincode for GST audit
    UPDATE orders
    SET shipping_address_snapshot = jsonb_set(
            jsonb_set(shipping_address_snapshot, '{recipient_name}', '"Redacted Customer"'),
            '{recipient_phone}', '"+910000000000"'
        )
    WHERE user_id = p_user_id;

    -- 5. Audit Log the compliance deletion
    PERFORM log_audit_event(
        p_admin_id,
        'system_compliance',
        'USER_ANONYMIZED_DPDP_ACT_2023',
        'profiles',
        p_user_id,
        jsonb_build_object('event', 'Right to Erasure invoked'),
        jsonb_build_object('masked_name', v_masked_name, 'anonymized_at', NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION anonymize_user_data IS 'India DPDP Act 2023 compliance function redaction of PII while preserving legal GST 6-year tax audit records';

-- ------------------------------------------------------------------------------
-- TASK 49: DATABASE-LEVEL RATE LIMITING & ANTI-SCRAPING
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_identifier VARCHAR(255) NOT NULL,
    endpoint_action VARCHAR(100) NOT NULL,
    request_count INT NOT NULL DEFAULT 1 CHECK (request_count >= 1),
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    blocked_until TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE api_rate_limits IS 'Database-level sliding window rate limiting for public endpoints and search';

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_lookup 
    ON api_rate_limits(client_identifier, endpoint_action, window_start);

-- RPC Function: Check and increment rate limit window
CREATE OR REPLACE FUNCTION check_and_increment_rate_limit(
    p_client_id VARCHAR,
    p_action VARCHAR,
    p_max_requests INT DEFAULT 60,
    p_window_seconds INT DEFAULT 60
)
RETURNS TABLE (
    is_allowed BOOLEAN,
    current_count INT,
    remaining_requests INT,
    retry_after_seconds INT
) AS $$
DECLARE
    v_now TIMESTAMPTZ := NOW();
    v_window_start TIMESTAMPTZ;
    v_row api_rate_limits%ROWTYPE;
BEGIN
    -- Check if client is currently blocked
    SELECT * INTO v_row
    FROM api_rate_limits
    WHERE client_identifier = p_client_id
      AND endpoint_action = p_action
      AND blocked_until IS NOT NULL
      AND blocked_until > v_now
    ORDER BY created_at DESC
    LIMIT 1;

    IF FOUND THEN
        RETURN QUERY SELECT 
            FALSE, 
            v_row.request_count, 
            0, 
            EXTRACT(EPOCH FROM (v_row.blocked_until - v_now))::INT;
        RETURN;
    END IF;

    -- Look for existing active window
    SELECT * INTO v_row
    FROM api_rate_limits
    WHERE client_identifier = p_client_id
      AND endpoint_action = p_action
      AND window_start > (v_now - (p_window_seconds || ' seconds')::INTERVAL)
    ORDER BY window_start DESC
    LIMIT 1;

    IF NOT FOUND THEN
        -- Start new window
        INSERT INTO api_rate_limits (client_identifier, endpoint_action, request_count, window_start)
        VALUES (p_client_id, p_action, 1, v_now);

        RETURN QUERY SELECT TRUE, 1, (p_max_requests - 1), 0;
        RETURN;
    END IF;

    -- Increment existing window
    IF v_row.request_count >= p_max_requests THEN
        -- Exceeded limit: Block client for 15 minutes
        UPDATE api_rate_limits
        SET blocked_until = v_now + INTERVAL '15 minutes'
        WHERE id = v_row.id;

        RETURN QUERY SELECT FALSE, v_row.request_count + 1, 0, 900;
        RETURN;
    ELSE
        UPDATE api_rate_limits
        SET request_count = request_count + 1
        WHERE id = v_row.id;

        RETURN QUERY SELECT TRUE, v_row.request_count + 1, (p_max_requests - (v_row.request_count + 1)), 0;
        RETURN;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- TASK 50: POINT-IN-TIME RECOVERY (PITR) & DISASTER RECOVERY REGISTRY
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS disaster_recovery_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type VARCHAR(50) NOT NULL CHECK (backup_type IN ('pitr_wal_archive', 'daily_logical_dump', 'cross_region_replica')),
    target_retention_days INT NOT NULL DEFAULT 30,
    rpo_target_minutes INT NOT NULL DEFAULT 5,
    rto_target_hours INT NOT NULL DEFAULT 1,
    last_backup_verified_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'healthy' CHECK (status IN ('healthy', 'degraded', 'failed', 'under_drill')),
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE disaster_recovery_configs IS 'Disaster Recovery and continuous PITR backup verification registry';

-- Function: Record DR drill verification
CREATE OR REPLACE FUNCTION record_dr_backup_verification(
    p_backup_type VARCHAR,
    p_status VARCHAR,
    p_notes TEXT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO disaster_recovery_configs (
        backup_type, last_backup_verified_at, status, notes, updated_at
    )
    VALUES (
        p_backup_type, NOW(), p_status, p_notes, NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- HELPER: IS_ADMIN FUNCTION
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ------------------------------------------------------------------------------
-- RLS POLICIES FOR PART 10 TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Audit logs viewable by admin only" ON audit_logs;
CREATE POLICY "Audit logs viewable by admin only" 
    ON audit_logs FOR SELECT 
    USING (public.is_admin());

ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Rate limits viewable by admin only" ON api_rate_limits;
CREATE POLICY "Rate limits viewable by admin only" 
    ON api_rate_limits FOR ALL 
    USING (public.is_admin_or_staff());

ALTER TABLE disaster_recovery_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "DR configs viewable by admin only" ON disaster_recovery_configs;
CREATE POLICY "DR configs viewable by admin only" 
    ON disaster_recovery_configs FOR ALL 
    USING (public.is_admin());
