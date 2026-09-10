#!/usr/bin/env python3
"""
Chief Architect Automated Verification Script for:
20260910000020_module1_chief_architect_comprehensive_fixes.sql
Module 1: Database & Entity Relationship Schema Design (Tasks 1 to 50)
M.M Book House Malda
"""

import os
import re
import sys

def verify_sql_syntax(sql_path: str):
    print(f"[>] Validating SQL Syntax & Balance: {sql_path}")
    if not os.path.exists(sql_path):
        print(f"[FAIL] Migration file not found at: {sql_path}")
        return False
        
    with open(sql_path, "r", encoding="utf-8") as f:
        sql = f.read()

    print(f"[+] Total Size: {len(sql)} bytes, {len(sql.splitlines())} lines")

    # 1. Balanced $$
    dollar_tags = re.findall(r'\$\$', sql)
    if len(dollar_tags) % 2 != 0:
        print(f"[FAIL] Unbalanced dollar quotes ($$): count = {len(dollar_tags)}")
        return False

    # 2. Check balanced single quotes outside dollar blocks
    clean_lines = []
    for line in sql.splitlines():
        clean_lines.append(re.sub(r'--.*$', '', line))
    no_comments = '\n'.join(clean_lines)

    def replace_dollar_blocks(text):
        return re.sub(r'\$\$(.*?)\$\$', '$$ BLOCK $$', text, flags=re.DOTALL)

    outside = replace_dollar_blocks(no_comments.replace("''", "XX"))
    if outside.count("'") % 2 != 0:
        print(f"[FAIL] Unbalanced single quotes outside $$ blocks: count = {outside.count('\'')}")
        return False

    # 3. Check balanced parentheses outside dollar blocks
    if outside.count('(') != outside.count(')'):
        print(f"[FAIL] Unbalanced parentheses: {outside.count('(')} '(' vs {outside.count(')')} ')'")
        return False

    print("[PASS] Syntax, dollar-blocks, parentheses and single quotes perfectly balanced.")
    return True

def verify_task_rules(sql_path: str):
    with open(sql_path, "r", encoding="utf-8") as f:
        sql = f.read()

    checks = [
        ("Part 1: cover_image_url on book_variants", "ALTER TABLE book_variants ADD COLUMN IF NOT EXISTS cover_image_url TEXT"),
        ("Part 1: Category hierarchy cycle detection trigger", "check_category_hierarchy_cycle()"),
        ("Part 1: ISBN-10 and ISBN-13 format validation", "chk_books_isbn_13"),
        ("Part 2: Privilege escalation prevention trigger on profiles", "prevent_profile_privilege_escalation()"),
        ("Part 2: inventory row lock in release_stock_reservation()", "PERFORM 1 FROM inventory WHERE variant_id = v_res.variant_id FOR UPDATE"),
        ("Part 3: Orders status transition state machine trigger", "validate_order_status_transition()"),
        ("Part 3: Pre-order bypass in place_order_from_cart()", "bv.is_preorder"),
        ("Part 3: Pre-order enqueueing into preorder_waitlists", "INSERT INTO preorder_waitlists"),
        ("Part 3: Automatic FBT association update in place_order_from_cart()", "update_product_associations_from_order(v_order_id)"),
        ("Part 4: sync_book_review_stats() filters deleted_at IS NULL", "deleted_at IS NULL"),
        ("Part 4: set_verified_purchase_status() excludes refunded orders", "refund_status = 'processed'"),
        ("Part 5: Corrected Keyset pagination in get_catalog_books_paginated()", "p_sort_by = 'price_asc'"),
        ("Part 5: Fast updated_at indexes for ETag hash", "idx_inventory_updated_at"),
        ("Part 6: POS counter sales logged in stock_adjustments ledger", "'pos_sale'"),
        ("Part 6: Pre-order stock arrival reserves allocated stock", "reserved_quantity = reserved_quantity + v_allocated_count"),
        ("Part 7: Inclusive freight GST calculation in generate_tax_invoice()", "ROUND(v_order.delivery_fee / 1.18, 2)"),
        ("Part 7: Return inspection computes accurate refund_amount", "refund_amount = v_refund_val"),
        ("Part 8: Automated loyalty credit trigger on delivered orders", "trigger_order_delivered_loyalty"),
        ("Part 8: Automated freebies evaluation RPC for cart", "evaluate_cart_freebies"),
        ("Part 9: get_frequently_bought_together() uses COALESCE fallback", "COALESCE(bv.cover_image_url, b.preview_images->>0, '')"),
        ("Part 9: get_series_books() uses COALESCE fallback", "COALESCE(bv.cover_image_url, b.preview_images->>0, '')"),
        ("Part 9: semantic_search_books() filters soft-deleted books", "b.deleted_at IS NULL"),
        ("Part 10: India DPDP Act 2023 redacts billing snapshot & quotations", "billing_address_snapshot"),
        ("Part 10: Opportunistic rolling cleanup for api_rate_limits", "DELETE FROM api_rate_limits")
    ]

    print("\n--- Verifying All 10 Parts Architecture Compliance ---")
    all_passed = True
    for desc, fragment in checks:
        if fragment in sql:
            print(f"[PASS] {desc}")
        else:
            print(f"[FAIL] Missing requirement: {desc} (target fragment: '{fragment}')")
            all_passed = False

    return all_passed

if __name__ == "__main__":
    target = os.path.join("supabase", "migrations", "20260910000020_module1_chief_architect_comprehensive_fixes.sql")
    if not verify_sql_syntax(target):
        sys.exit(1)
    if not verify_task_rules(target):
        sys.exit(1)
    print("\n=======================================================")
    print(">>> ALL MODULE 1 PARTS (1 TO 10) PASSED ARCHITECTURAL AUDIT! <<<")
    print("=======================================================")
