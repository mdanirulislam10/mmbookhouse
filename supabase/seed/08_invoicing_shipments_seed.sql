-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 1: Database & Entity Relationship Schema Design
-- Part 7: Seed Data for GST Invoicing, Shipments, COGS & Returns
-- Database Engine: Supabase (PostgreSQL 16)
-- Seed File: 08_invoicing_shipments_seed.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SEED WHOLESALE COST PRICES (For Profit Margin & COGS Analytics)
-- ------------------------------------------------------------------------------
-- Bharater Itihas (Paperback New): MRP 480, Selling 360, Cost 250 (Gross Profit: 110 INR / 30.56%)
UPDATE book_variants 
SET cost_price = 250.00 
WHERE id = '55555555-5555-5555-5555-555555555501';

-- Bharater Itihas (Hardcover New): MRP 650, Selling 520, Cost 360 (Gross Profit: 160 INR / 30.77%)
UPDATE book_variants 
SET cost_price = 360.00 
WHERE id = '55555555-5555-5555-5555-555555555502';

-- Bharater Itihas (Used): MRP 480, Selling 240, Cost 120 (Gross Profit: 120 INR / 50.00%)
UPDATE book_variants 
SET cost_price = 120.00 
WHERE id = '55555555-5555-5555-5555-555555555503';

-- Chhaya WBCS Manual 2026: MRP 1150, Selling 805, Cost 575 (Gross Profit: 230 INR / 28.57%)
UPDATE book_variants 
SET cost_price = 575.00 
WHERE id = '55555555-5555-5555-5555-555555555511';

-- Sei Somoy (Hardcover): MRP 800, Selling 640, Cost 440 (Gross Profit: 200 INR / 31.25%)
UPDATE book_variants 
SET cost_price = 440.00 
WHERE id = '55555555-5555-5555-5555-555555555521';

-- Sei Somoy (Paperback): MRP 600, Selling 450, Cost 310 (Gross Profit: 140 INR / 31.11%)
UPDATE book_variants 
SET cost_price = 310.00 
WHERE id = '55555555-5555-5555-5555-555555555522';

-- Set realistic cost prices across bulk books (typically 65% of MRP / 35% publisher discount)
UPDATE book_variants
SET cost_price = ROUND((mrp * 0.65), 2)
WHERE cost_price IS NULL;

-- ------------------------------------------------------------------------------
-- 2. SEED OFFICIAL TAX INVOICE FOR DELIVERED ORDER
-- ------------------------------------------------------------------------------
INSERT INTO invoices (
    id, order_id, invoice_number, invoice_date, financial_year,
    subtotal, discount_total, delivery_charges, taxable_amount,
    cgst_amount, sgst_amount, igst_amount, grand_total,
    hsn_sac_summary, invoice_pdf_url
)
VALUES
    (
        'ffffffff-ffff-ffff-ffff-ffffffffff01',
        '88888888-8888-8888-8888-888888888801',
        'MMB-INV-2026-00001',
        '2026-09-05',
        '2026-2027',
        360.00,
        0.00,
        40.00,
        400.00,
        3.60,
        3.60,
        0.00,
        400.00,
        '[
            {"hsn": "4901", "description": "Printed Books (Exempt)", "rate": "0%", "taxable": 360.00, "tax": 0.00},
            {"sac": "9968", "description": "Postal Delivery & Handling", "rate": "18%", "taxable": 40.00, "tax": 7.20}
        ]'::jsonb,
        'https://cdn.mmbookhouse.com/invoices/MMB-INV-2026-00001.pdf'
    )
ON CONFLICT (order_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. SEED SHIPMENT & AWB TRACKING
-- ------------------------------------------------------------------------------
INSERT INTO shipments (
    id, order_id, shipment_number, courier_name, awb_code,
    tracking_url, status, shipped_at, delivered_at, label_pdf_url
)
VALUES
    (
        'ffffffff-ffff-ffff-ffff-ffffffffff11',
        '88888888-8888-8888-8888-888888888801',
        'MMB-SHP-01001-1',
        'India Post Speed Post',
        'EW892019281IN',
        'https://www.indiapost.gov.in/_layouts/15/dpt.cpt.integration/uc_speedposttracking.aspx?ArticleId=EW892019281IN',
        'delivered',
        '2026-09-05 11:30:00+05:30',
        '2026-09-06 14:15:00+05:30',
        'https://cdn.mmbookhouse.com/shipping-labels/EW892019281IN.pdf'
    )
ON CONFLICT (order_id, shipment_number) DO NOTHING;

INSERT INTO shipment_items (
    id, shipment_id, order_item_id, quantity
)
VALUES
    (
        'ffffffff-ffff-ffff-ffff-ffffffffff21',
        'ffffffff-ffff-ffff-ffff-ffffffffff11',
        '88888888-8888-8888-8888-888888888811',
        1
    )
ON CONFLICT (shipment_id, order_item_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. SEED SAMPLE RETURN REQUEST
-- ------------------------------------------------------------------------------
INSERT INTO order_returns (
    id, order_id, order_item_id, user_id, return_number, quantity,
    reason_code, reason_details, pickup_status, refund_status, refund_amount
)
VALUES
    (
        'ffffffff-ffff-ffff-ffff-ffffffffff31',
        '88888888-8888-8888-8888-888888888801',
        '88888888-8888-8888-8888-888888888811',
        '99999999-9999-9999-9999-999999999903',
        'MMB-RET-2026-0001',
        1,
        'defective_printing',
        'Page 120-125 are upside down in binding',
        'received_at_store',
        'pending',
        360.00
    )
ON CONFLICT (return_number) DO NOTHING;
