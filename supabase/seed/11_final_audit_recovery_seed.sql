-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 1: Database & Entity Relationship Schema Design
-- Part 10 (Tasks 46 to 50): Sample Seed Data for Security Audit, Rate Limits & DR
-- Database Engine: Supabase (PostgreSQL 16)
-- Seed File: 11_final_audit_recovery_seed.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SEED SAMPLE AUDIT TRAIL LOGS (Task 47)
-- ------------------------------------------------------------------------------
INSERT INTO audit_logs (
    id, user_id, user_role, action, entity_type, entity_id,
    old_values, new_values, ip_address, user_agent, created_at
)
VALUES
    (
        '61616161-6161-6161-6161-616161616101',
        '99999999-9999-9999-9999-999999999901',
        'admin',
        'PRICE_CHANGE',
        'book_variants',
        '55555555-5555-5555-5555-555555555501',
        '{"selling_price": 380.00, "mrp": 480.00}'::jsonb,
        '{"selling_price": 360.00, "mrp": 480.00}'::jsonb,
        '103.102.14.88'::inet,
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36',
        NOW() - INTERVAL '2 hours'
    ),
    (
        '61616161-6161-6161-6161-616161616102',
        '99999999-9999-9999-9999-999999999901',
        'admin',
        'ORDER_STATUS_OVERRIDE',
        'orders',
        '88888888-8888-8888-8888-888888888801',
        '{"status": "shipped"}'::jsonb,
        '{"status": "delivered"}'::jsonb,
        '103.102.14.88'::inet,
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36',
        NOW() - INTERVAL '1 hour'
    )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. SEED API RATE LIMITING WINDOW (Task 49)
-- ------------------------------------------------------------------------------
INSERT INTO api_rate_limits (
    id, client_identifier, endpoint_action, request_count, window_start, blocked_until
)
VALUES
    (
        '71717171-7171-7171-7171-717171717101',
        '103.102.14.99',
        'search_books',
        15,
        NOW() - INTERVAL '20 seconds',
        NULL
    )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. SEED DISASTER RECOVERY & BACKUP CONFIGS (Task 50)
-- ------------------------------------------------------------------------------
INSERT INTO disaster_recovery_configs (
    id, backup_type, target_retention_days, rpo_target_minutes, rto_target_hours,
    last_backup_verified_at, status, notes
)
VALUES
    (
        '81818181-8181-8181-8181-818181818101',
        'pitr_wal_archive',
        30,
        5,
        1,
        NOW() - INTERVAL '15 minutes',
        'healthy',
        'Continuous WAL archiving enabled via Supabase Physical Backup storage. Recovery point is sub-5 minutes.'
    ),
    (
        '81818181-8181-8181-8181-818181818102',
        'daily_logical_dump',
        14,
        1440,
        2,
        NOW() - INTERVAL '6 hours',
        'healthy',
        'Daily pg_dump encrypted snapshot stored in encrypted geo-redundant S3/GCS bucket.'
    ),
    (
        '81818181-8181-8181-8181-818181818103',
        'cross_region_replica',
        30,
        1,
        1,
        NOW() - INTERVAL '10 minutes',
        'healthy',
        'Async read-replica standby in secondary availability zone for high availability failover.'
    )
ON CONFLICT (id) DO NOTHING;
