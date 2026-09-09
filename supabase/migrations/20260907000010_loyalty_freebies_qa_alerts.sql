-- ==============================================================================
-- M.M Book House Malda - E-Commerce Platform
-- Module 1: Database & Entity Relationship Schema Design
-- Part 8 (Tasks 36 to 40): Loyalty Ledger, Freebies, Bayesian Rating, Q&A & Alerts
-- Database Engine: Supabase (PostgreSQL 16)
-- Migration: 20260907000010_loyalty_freebies_qa_alerts.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TASK 36: CUSTOMER LOYALTY REWARDS LEDGER & PROFILE BALANCE
-- ------------------------------------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS loyalty_points_balance INT NOT NULL DEFAULT 0 CHECK (loyalty_points_balance >= 0);

CREATE TABLE IF NOT EXISTS loyalty_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    points INT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
        'earned_purchase', 'redeemed_checkout', 'bonus_signup', 
        'admin_adjustment', 'refund_reversal', 'expired'
    )),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE loyalty_ledger IS 'Double-entry bookkeeping ledger tracking customer reward points';

CREATE INDEX IF NOT EXISTS idx_loyalty_ledger_user ON loyalty_ledger(user_id);

-- Trigger: Automatically synchronize profile loyalty balance
CREATE OR REPLACE FUNCTION sync_loyalty_balance()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_balance INT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_user_id := OLD.user_id;
    ELSE
        v_user_id := NEW.user_id;
    END IF;

    SELECT COALESCE(SUM(points), 0) INTO v_balance
    FROM loyalty_ledger
    WHERE user_id = v_user_id;

    UPDATE profiles
    SET loyalty_points_balance = GREATEST(0, v_balance),
        updated_at = NOW()
    WHERE id = v_user_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_loyalty_balance ON loyalty_ledger;
CREATE TRIGGER trigger_sync_loyalty_balance
    AFTER INSERT OR UPDATE OR DELETE ON loyalty_ledger
    FOR EACH ROW
    EXECUTE FUNCTION sync_loyalty_balance();

-- Function: Award 5 loyalty points per 100 INR spent on delivered order
CREATE OR REPLACE FUNCTION award_order_loyalty_points(p_order_id UUID)
RETURNS INT AS $$
DECLARE
    v_order orders%ROWTYPE;
    v_points INT := 0;
BEGIN
    SELECT * INTO v_order FROM orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % not found', p_order_id;
    END IF;

    IF v_order.user_id IS NULL THEN
        RETURN 0;
    END IF;

    -- Avoid double crediting
    IF EXISTS (
        SELECT 1 FROM loyalty_ledger 
        WHERE order_id = p_order_id AND transaction_type = 'earned_purchase'
    ) THEN
        RETURN 0;
    END IF;

    -- 5 points per 100 INR spent
    v_points := FLOOR(v_order.total_payable_amount / 100.0) * 5;

    IF v_points > 0 THEN
        INSERT INTO loyalty_ledger (
            user_id, order_id, points, transaction_type, notes
        )
        VALUES (
            v_order.user_id,
            p_order_id,
            v_points,
            'earned_purchase',
            'Earned ' || v_points || ' points for Order #' || v_order.order_number
        );
    END IF;

    RETURN v_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- TASK 37: PROMOTIONAL FREEBIES & GIFTS ENGINE
-- ------------------------------------------------------------------------------
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS is_freebie BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS is_freebie BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS promotional_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('freebie_with_product', 'freebie_above_amount', 'bundle_discount')),
    trigger_book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    trigger_min_amount NUMERIC(10, 2),
    gift_variant_id UUID NOT NULL REFERENCES book_variants(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE promotional_rules IS 'Promotional rule engine for free bookmarks, OMR sheets, or free gifts';

CREATE INDEX IF NOT EXISTS idx_promotional_rules_trigger_book ON promotional_rules(trigger_book_id) WHERE is_active = TRUE;

-- ------------------------------------------------------------------------------
-- TASK 38: REVIEW HELPFUL VOTES & BAYESIAN WEIGHTED RATING
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS review_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN ('helpful', 'unhelpful')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_review_user_vote UNIQUE(review_id, user_id)
);

COMMENT ON TABLE review_votes IS 'Customer helpful votes on book reviews';

-- Trigger to sync helpful vote counts on reviews table
CREATE OR REPLACE FUNCTION sync_review_helpful_votes()
RETURNS TRIGGER AS $$
DECLARE
    v_rev_id UUID;
    v_count INT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_rev_id := OLD.review_id;
    ELSE
        v_rev_id := NEW.review_id;
    END IF;

    SELECT COUNT(*) INTO v_count
    FROM review_votes
    WHERE review_id = v_rev_id AND vote_type = 'helpful';

    UPDATE reviews
    SET helpful_votes_count = v_count,
        updated_at = NOW()
    WHERE id = v_rev_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_review_helpful_votes ON review_votes;
CREATE TRIGGER trigger_sync_review_helpful_votes
    AFTER INSERT OR UPDATE OR DELETE ON review_votes
    FOR EACH ROW
    EXECUTE FUNCTION sync_review_helpful_votes();

-- Bayesian Weighted Average Rating calculation
CREATE OR REPLACE FUNCTION calculate_bayesian_rating(p_book_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_c CONSTANT NUMERIC := 3.0;   -- Prior confidence count
    v_m CONSTANT NUMERIC := 4.0;   -- Prior average rating mean
    v_weighted_sum NUMERIC := 0.0;
    v_total_weight NUMERIC := 0.0;
    v_rec RECORD;
BEGIN
    FOR v_rec IN 
        SELECT 
            rating, 
            CASE WHEN is_verified_purchase THEN 2.0 ELSE 1.0 END AS base_weight,
            LEAST(helpful_votes_count * 0.1, 1.0) AS helpful_bonus
        FROM reviews
        WHERE book_id = p_book_id AND is_approved = TRUE
    LOOP
        v_weighted_sum := v_weighted_sum + ((v_rec.base_weight + v_rec.helpful_bonus) * v_rec.rating);
        v_total_weight := v_total_weight + (v_rec.base_weight + v_rec.helpful_bonus);
    END LOOP;

    IF v_total_weight = 0 THEN
        RETURN 0.00;
    END IF;

    -- Bayesian Formula: ((C * m) + sum(w * r)) / (C + sum(w))
    RETURN ROUND((((v_c * v_m) + v_weighted_sum) / (v_c + v_total_weight)), 2);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_bayesian_rating IS 'Anti-spam Bayesian weighted rating giving higher credibility to verified buyers';

-- ------------------------------------------------------------------------------
-- TASK 39: PRODUCT QUESTIONS & ANSWERS (Q&A) PLATFORM
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    is_approved BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE product_questions IS 'Customer questions about specific books, syllabus editions, and paperbacks';

CREATE INDEX IF NOT EXISTS idx_product_questions_book ON product_questions(book_id) WHERE is_approved = TRUE;

CREATE TABLE IF NOT EXISTS product_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES product_questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    is_staff_answer BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified_buyer BOOLEAN NOT NULL DEFAULT FALSE,
    is_approved BOOLEAN NOT NULL DEFAULT TRUE,
    helpful_votes INT NOT NULL DEFAULT 0 CHECK (helpful_votes >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE product_answers IS 'Answers from bookstore staff or verified customers with credibility badges';

CREATE INDEX IF NOT EXISTS idx_product_answers_question ON product_answers(question_id) WHERE is_approved = TRUE;

-- ------------------------------------------------------------------------------
-- TASK 40: PRICE DROP & BACK-IN-STOCK USER ALERTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES book_variants(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('price_drop', 'back_in_stock', 'preorder_release')),
    target_price NUMERIC(10, 2),
    is_triggered BOOLEAN NOT NULL DEFAULT FALSE,
    triggered_at TIMESTAMPTZ,
    notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE user_alerts IS 'Customer alert subscriptions for price drops and restocked books';

CREATE INDEX IF NOT EXISTS idx_user_alerts_variant ON user_alerts(variant_id) WHERE is_triggered = FALSE;

-- Trigger: Check Price Drop Alerts on variant price update
CREATE OR REPLACE FUNCTION check_price_drop_alerts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.selling_price < OLD.selling_price THEN
        UPDATE user_alerts
        SET is_triggered = TRUE,
            triggered_at = NOW()
        WHERE variant_id = NEW.id 
          AND alert_type = 'price_drop'
          AND is_triggered = FALSE
          AND (target_price IS NULL OR target_price >= NEW.selling_price);

        -- Send realtime postgres notification
        PERFORM pg_notify(
            'price_drop_channel',
            jsonb_build_object('variant_id', NEW.id, 'old_price', OLD.selling_price, 'new_price', NEW.selling_price)::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_price_drop_alerts ON book_variants;
CREATE TRIGGER trigger_check_price_drop_alerts
    AFTER UPDATE OF selling_price ON book_variants
    FOR EACH ROW
    EXECUTE FUNCTION check_price_drop_alerts();

-- Trigger: Check Back-In-Stock Alerts on inventory restock
CREATE OR REPLACE FUNCTION check_back_in_stock_alerts()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.stock_quantity - OLD.reserved_quantity) <= 0 AND (NEW.stock_quantity - NEW.reserved_quantity) > 0 THEN
        UPDATE user_alerts
        SET is_triggered = TRUE,
            triggered_at = NOW()
        WHERE variant_id = NEW.variant_id 
          AND alert_type = 'back_in_stock'
          AND is_triggered = FALSE;

        PERFORM pg_notify(
            'back_in_stock_channel',
            jsonb_build_object('variant_id', NEW.variant_id, 'new_stock', (NEW.stock_quantity - NEW.reserved_quantity))::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_back_in_stock_alerts ON inventory;
CREATE TRIGGER trigger_check_back_in_stock_alerts
    AFTER UPDATE OF stock_quantity, reserved_quantity ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION check_back_in_stock_alerts();

-- ------------------------------------------------------------------------------
-- RLS POLICIES FOR PART 8 TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE loyalty_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own loyalty ledger" ON loyalty_ledger;
CREATE POLICY "Users can view own loyalty ledger" 
    ON loyalty_ledger FOR SELECT 
    USING (auth.uid() = user_id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "Loyalty ledger modifiable by admin only" ON loyalty_ledger;
CREATE POLICY "Loyalty ledger modifiable by admin only" 
    ON loyalty_ledger FOR ALL 
    USING (public.is_admin_or_staff());

ALTER TABLE promotional_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active rules viewable by public" ON promotional_rules;
CREATE POLICY "Active rules viewable by public" 
    ON promotional_rules FOR SELECT 
    USING (is_active = TRUE OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "Rules modifiable by admin only" ON promotional_rules;
CREATE POLICY "Rules modifiable by admin only" 
    ON promotional_rules FOR ALL 
    USING (public.is_admin_or_staff());

ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Review votes viewable by everyone" ON review_votes;
CREATE POLICY "Review votes viewable by everyone" 
    ON review_votes FOR SELECT 
    USING (TRUE);

DROP POLICY IF EXISTS "Users can vote on reviews" ON review_votes;
CREATE POLICY "Users can vote on reviews" 
    ON review_votes FOR ALL 
    USING (auth.uid() = user_id OR public.is_admin_or_staff())
    WITH CHECK (auth.uid() = user_id OR public.is_admin_or_staff());

ALTER TABLE product_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Approved questions viewable by everyone" ON product_questions;
CREATE POLICY "Approved questions viewable by everyone" 
    ON product_questions FOR SELECT 
    USING (is_approved = TRUE OR auth.uid() = user_id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "Users can ask questions" ON product_questions;
CREATE POLICY "Users can ask questions" 
    ON product_questions FOR INSERT 
    WITH CHECK (auth.uid() = user_id OR public.is_admin_or_staff());

ALTER TABLE product_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Approved answers viewable by everyone" ON product_answers;
CREATE POLICY "Approved answers viewable by everyone" 
    ON product_answers FOR SELECT 
    USING (is_approved = TRUE OR auth.uid() = user_id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "Users can post answers" ON product_answers;
CREATE POLICY "Users can post answers" 
    ON product_answers FOR INSERT 
    WITH CHECK (auth.uid() = user_id OR public.is_admin_or_staff());

ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own alerts" ON user_alerts;
CREATE POLICY "Users can manage own alerts" 
    ON user_alerts FOR ALL 
    USING (auth.uid() = user_id OR public.is_admin_or_staff())
    WITH CHECK (auth.uid() = user_id OR public.is_admin_or_staff());
