-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 8: Pincode & Core Geo-Serviceability Engine (Part 1: Tasks 1 to 10)
-- Migration: 20260910000021_module8_pincode_serviceability.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TASK 9: PINCODE SERVICEABILITY TABLE
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pincode_serviceability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pincode VARCHAR(6) UNIQUE NOT NULL,
    post_office TEXT NOT NULL,
    district TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'West Bengal',
    delivery_zone TEXT NOT NULL CHECK (delivery_zone IN ('local_malda', 'regional_north_bengal', 'south_bengal', 'national')),
    estimated_delivery_days INT NOT NULL DEFAULT 3 CHECK (estimated_delivery_days > 0),
    is_cod_available BOOLEAN NOT NULL DEFAULT TRUE,
    cod_handling_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (cod_handling_fee >= 0),
    is_express_available BOOLEAN NOT NULL DEFAULT FALSE,
    min_order_free_shipping NUMERIC(10, 2) NOT NULL DEFAULT 499.00 CHECK (min_order_free_shipping >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_pincode_format CHECK (pincode ~ '^[1-9][0-9]{5}$')
);

COMMENT ON TABLE pincode_serviceability IS 'Geo-serviceability lookup table for postal pin codes, delivery speed, COD options, and shipping rules';
COMMENT ON COLUMN pincode_serviceability.delivery_zone IS 'Tier classification: local_malda (same day/1-2 days), regional_north_bengal (1-2 days), south_bengal (2-3 days), national (3-5 days)';

-- Indices for rapid query lookups (<10ms)
CREATE INDEX IF NOT EXISTS idx_pincode_serviceability_pincode ON pincode_serviceability(pincode);
CREATE INDEX IF NOT EXISTS idx_pincode_serviceability_zone ON pincode_serviceability(delivery_zone);
CREATE INDEX IF NOT EXISTS idx_pincode_serviceability_district ON pincode_serviceability(district);

-- Automated updated_at trigger
CREATE OR REPLACE FUNCTION update_pincode_serviceability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pincode_serviceability_updated_at ON pincode_serviceability;
CREATE TRIGGER trigger_pincode_serviceability_updated_at
    BEFORE UPDATE ON pincode_serviceability
    FOR EACH ROW
    EXECUTE FUNCTION update_pincode_serviceability_updated_at();

-- ------------------------------------------------------------------------------
-- SECURITY & ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE pincode_serviceability ENABLE ROW LEVEL SECURITY;

-- Public Read Policy (Anyone can query pincode serviceability)
DROP POLICY IF EXISTS "Allow public read on pincode_serviceability" ON pincode_serviceability;
CREATE POLICY "Allow public read on pincode_serviceability"
    ON pincode_serviceability
    FOR SELECT
    USING (true);

-- Admin / Service-Role Management Policy
DROP POLICY IF EXISTS "Allow admin modify pincode_serviceability" ON pincode_serviceability;
CREATE POLICY "Allow admin modify pincode_serviceability"
    ON pincode_serviceability
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'merchant')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'merchant')
        )
    );

-- ------------------------------------------------------------------------------
-- SEED DATA: MALDA, DINAJPUR, MURSHIDABAD, KOLKATA, SILIGURI & MAJOR HUBS
-- ------------------------------------------------------------------------------
INSERT INTO pincode_serviceability (
    pincode,
    post_office,
    district,
    state,
    delivery_zone,
    estimated_delivery_days,
    is_cod_available,
    cod_handling_fee,
    is_express_available,
    min_order_free_shipping
) VALUES
    -- 1. Malda Hubs (local_malda)
    ('732101', 'English Bazar (Malda Town H.O.)', 'Malda', 'West Bengal', 'local_malda', 1, TRUE, 0.00, TRUE, 499.00),
    ('732102', 'Old Malda S.O.', 'Malda', 'West Bengal', 'local_malda', 1, TRUE, 0.00, TRUE, 499.00),
    ('732103', 'Mangalbari S.O.', 'Malda', 'West Bengal', 'local_malda', 1, TRUE, 0.00, TRUE, 499.00),
    ('732124', 'Chanchal S.O.', 'Malda', 'West Bengal', 'local_malda', 2, TRUE, 0.00, FALSE, 499.00),
    ('732125', 'Gazole S.O.', 'Malda', 'West Bengal', 'local_malda', 2, TRUE, 0.00, FALSE, 499.00),
    ('732126', 'Harischandrapur S.O.', 'Malda', 'West Bengal', 'local_malda', 2, TRUE, 0.00, FALSE, 499.00),
    ('732128', 'Sujapur S.O.', 'Malda', 'West Bengal', 'local_malda', 1, TRUE, 0.00, TRUE, 499.00),
    ('732138', 'Ratua S.O.', 'Malda', 'West Bengal', 'local_malda', 2, TRUE, 0.00, FALSE, 499.00),
    ('732141', 'Bhaluka S.O.', 'Malda', 'West Bengal', 'local_malda', 2, TRUE, 0.00, FALSE, 499.00),
    ('732142', 'Samsi S.O.', 'Malda', 'West Bengal', 'local_malda', 2, TRUE, 0.00, FALSE, 499.00),
    ('732201', 'Kaliachak S.O.', 'Malda', 'West Bengal', 'local_malda', 2, TRUE, 0.00, FALSE, 499.00),
    ('732202', 'Baishnabnagar S.O.', 'Malda', 'West Bengal', 'local_malda', 2, TRUE, 0.00, FALSE, 499.00),
    ('732203', 'Manikchak S.O.', 'Malda', 'West Bengal', 'local_malda', 2, TRUE, 0.00, FALSE, 499.00),

    -- 2. Dinajpur (regional_north_bengal)
    ('733129', 'Raiganj Town H.O.', 'Uttar Dinajpur', 'West Bengal', 'regional_north_bengal', 2, TRUE, 0.00, FALSE, 499.00),
    ('733134', 'Balurghat Town H.O.', 'Dakshin Dinajpur', 'West Bengal', 'regional_north_bengal', 2, TRUE, 0.00, FALSE, 499.00),

    -- 3. Siliguri / Darjeeling (regional_north_bengal)
    ('734001', 'Siliguri Town H.O.', 'Darjeeling', 'West Bengal', 'regional_north_bengal', 2, TRUE, 0.00, FALSE, 499.00),

    -- 4. Murshidabad (south_bengal)
    ('742101', 'Berhampore Town H.O.', 'Murshidabad', 'West Bengal', 'south_bengal', 2, TRUE, 0.00, FALSE, 499.00),

    -- 5. Kolkata Metro & Boipara (south_bengal)
    ('700001', 'Kolkata G.P.O.', 'Kolkata', 'West Bengal', 'south_bengal', 3, TRUE, 0.00, FALSE, 499.00),
    ('700073', 'College Street (Boipara) S.O.', 'Kolkata', 'West Bengal', 'south_bengal', 2, TRUE, 0.00, TRUE, 499.00),

    -- 6. Additional Major West Bengal Hubs
    ('713201', 'Durgapur City Centre', 'Paschim Bardhaman', 'West Bengal', 'south_bengal', 3, TRUE, 0.00, FALSE, 499.00),
    ('713301', 'Asansol H.O.', 'Paschim Bardhaman', 'West Bengal', 'south_bengal', 3, TRUE, 0.00, FALSE, 499.00),
    ('711101', 'Howrah H.O.', 'Howrah', 'West Bengal', 'south_bengal', 3, TRUE, 0.00, FALSE, 499.00),
    ('721301', 'Kharagpur Town', 'Paschim Medinipur', 'West Bengal', 'south_bengal', 3, TRUE, 0.00, FALSE, 499.00),
    ('735101', 'Jalpaiguri H.O.', 'Jalpaiguri', 'West Bengal', 'regional_north_bengal', 2, TRUE, 0.00, FALSE, 499.00),
    ('736101', 'Cooch Behar H.O.', 'Cooch Behar', 'West Bengal', 'regional_north_bengal', 3, TRUE, 0.00, FALSE, 499.00)
ON CONFLICT (pincode) DO UPDATE SET
    post_office = EXCLUDED.post_office,
    district = EXCLUDED.district,
    state = EXCLUDED.state,
    delivery_zone = EXCLUDED.delivery_zone,
    estimated_delivery_days = EXCLUDED.estimated_delivery_days,
    is_cod_available = EXCLUDED.is_cod_available,
    cod_handling_fee = EXCLUDED.cod_handling_fee,
    is_express_available = EXCLUDED.is_express_available,
    min_order_free_shipping = EXCLUDED.min_order_free_shipping,
    updated_at = NOW();
