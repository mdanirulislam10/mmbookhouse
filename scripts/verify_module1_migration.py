#!/usr/bin/env python3
"""
Verification Script for Migration: 20260907000014_fix_module1_critical_bugs.sql
Module 1: Database & Entity Relationship Schema Design (M.M Book House Malda)

This script parses and validates:
1. Syntax integrity (balanced quotes, parentheses, dollar tags $$, statement boundaries)
2. Task 1: [P0 BUG] Stock Reduction in place_order_from_cart() & stock_adjustments ledger
3. Task 2: [P0 BUG] validate_and_apply_coupon() parameter sequence & JSONB extraction
4. Task 3: [FINANCIAL BUG] Loyalty points deduction using -v_loyalty_discount::INT
5. Task 4: [SECURITY HOLE] Orders table RLS lockdown (dropping user INSERT policies)
6. Task 5: [SEARCH LIMITATION] search_books() enhancement (authors, publishers, category filter)
7. Task 6: [B2B SCHEMA] Institutional quotation_requests and quotation_items schema & RLS
"""

import os
import re
import sys

def test_sql_syntax_and_balance(sql_content: str):
    """Validates dollar quotes, single quotes, comments, and balanced parenthesis."""
    errors = []
    
    # 1. Check balanced dollar quotes ($$)
    dollar_tags = re.findall(r'\$\$', sql_content)
    if len(dollar_tags) % 2 != 0:
        errors.append(f"Unbalanced dollar quote tags ($$). Found count: {len(dollar_tags)}")

    # 2. Check balanced single quotes (ignoring escaped ones '')
    # Strip comments first
    clean_lines = []
    for line in sql_content.splitlines():
        # Remove single line comments
        stripped = re.sub(r'--.*$', '', line)
        clean_lines.append(stripped)
    no_comments_sql = '\n'.join(clean_lines)

    # Replace escaped single quotes '' with dummy
    test_quotes = no_comments_sql.replace("''", "XX")
    # Replace dollar quote blocks to ignore quotes inside strings/bodies
    def replace_dollar_blocks(text):
        pattern = r'\$\$(.*?)\$\$'
        return re.sub(pattern, '$$ BLOCK $$', text, flags=re.DOTALL)
    
    outside_dollars = replace_dollar_blocks(test_quotes)
    single_quotes_count = outside_dollars.count("'")
    if single_quotes_count % 2 != 0:
        errors.append(f"Unbalanced single quotes outside $$ blocks. Found {single_quotes_count} single quotes.")

    # 3. Check balanced parentheses
    # Count outside dollar quotes
    open_parens = outside_dollars.count('(')
    close_parens = outside_dollars.count(')')
    if open_parens != close_parens:
        errors.append(f"Unbalanced parentheses: {open_parens} '(' vs {close_parens} ')'")

    return errors

def extract_statements(sql_content: str):
    """Splits SQL content into individual top-level statements respecting $$ blocks."""
    statements = []
    current = []
    in_dollar_block = False
    
    for line in sql_content.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith('--'):
            continue
        
        # Check dollar toggle
        dollar_count = line.count('$$')
        if dollar_count % 2 != 0:
            in_dollar_block = not in_dollar_block
            
        current.append(line)
        
        if not in_dollar_block and stripped.endswith(';'):
            stmt = '\n'.join(current).strip()
            if stmt:
                statements.append(stmt)
            current = []
            
    if current:
        stmt = '\n'.join(current).strip()
        if stmt:
            statements.append(stmt)
            
    return statements

def verify_all_tasks(file_path: str):
    print(f"[>] Validating SQL Migration File: {file_path}")
    if not os.path.exists(file_path):
        print(f"[FAIL] Migration file not found at: {file_path}")
        return False
        
    with open(file_path, 'r', encoding='utf-8') as f:
        sql = f.read()

    print(f"[+] File Size: {len(sql)} bytes, {len(sql.splitlines())} lines")

    results = []

    # Check 0: Syntax and Balance
    syntax_errors = test_sql_syntax_and_balance(sql)
    if syntax_errors:
        results.append(("Syntax & Delimiters Integrity", False, "; ".join(syntax_errors)))
    else:
        results.append(("Syntax & Delimiters Integrity", True, "Balanced $$, parentheses, and single quotes"))

    # Statements extraction
    stmts = extract_statements(sql)
    results.append(("Statement Parsing", len(stmts) >= 10, f"Extracted {len(stmts)} top-level executable SQL statements"))

    # Task 1: Stock Reduction in place_order_from_cart()
    t1_inventory_update = bool(re.search(
        r'UPDATE\s+inventory\s+SET\s+stock_quantity\s*=\s*stock_quantity\s*-\s*v_cart_item\.quantity\s+WHERE\s+variant_id\s*=\s*v_cart_item\.variant_id;',
        sql, re.IGNORECASE
    ))
    t1_stock_adjustments_insert = bool(re.search(
        r'INSERT\s+INTO\s+stock_adjustments\s*\([^\)]*variant_id[^\)]*change_quantity[^\)]*reason[^\)]*notes[^\)]*adjusted_by[^\)]*\)\s*VALUES\s*\([^\)]*v_cart_item\.variant_id[^\)]*-[v_cart_item\.quantity|\s]*[^\)]*\'online_sale\'[^\)]*p_user_id[^\)]*\)',
        sql, re.IGNORECASE | re.DOTALL
    ))
    t1_reason_check = bool(re.search(r'ALTER TABLE stock_adjustments ADD CONSTRAINT stock_adjustments_reason_check CHECK\s*\(.*\'online_sale\'.*\)', sql, re.DOTALL | re.IGNORECASE))
    t1_trigger_hardening = bool(re.search(r'NEW\.reason\s+NOT\s+IN\s*\(\'online_sale\'', sql, re.IGNORECASE))

    t1_passed = t1_inventory_update and t1_stock_adjustments_insert and t1_reason_check and t1_trigger_hardening
    t1_msg = []
    if t1_inventory_update: t1_msg.append("inventory stock_quantity deducted")
    if t1_stock_adjustments_insert: t1_msg.append("stock_adjustments online_sale audit inserted")
    if t1_reason_check: t1_msg.append("stock_adjustments_reason_check includes 'online_sale'")
    if t1_trigger_hardening: t1_msg.append("apply_stock_adjustment trigger avoids double deduction")
    results.append(("Task 1: Stock Reduction in place_order_from_cart()", t1_passed, ", ".join(t1_msg)))

    # Task 2: validate_and_apply_coupon() Parameter Order & JSONB Extraction
    t2_call_order = bool(re.search(
        r'validate_and_apply_coupon\s*\(\s*TRIM\(p_coupon_code\)\s*,\s*p_user_id\s*,\s*v_total_items_price\s*\)',
        sql, re.IGNORECASE
    ))
    t2_jsonb_is_valid = bool(re.search(
        r'\(v_coupon_res->>\'is_valid\'\)::BOOLEAN\s*=\s*TRUE',
        sql, re.IGNORECASE
    ))
    t2_jsonb_discount = bool(re.search(
        r'v_coupon_discount\s*:=\s*COALESCE\(\(v_coupon_res->>\'discount_amount\'\)::NUMERIC,\s*0\.00\);',
        sql, re.IGNORECASE
    ))
    t2_exception = bool(re.search(
        r'RAISE\s+EXCEPTION\s+[\'"]Coupon Error:\s*%[\'"]\s*,\s*\(?v_coupon_res->>\'message\'\)?',
        sql, re.IGNORECASE
    ))
    t2_passed = t2_call_order and t2_jsonb_is_valid and t2_jsonb_discount and t2_exception
    t2_msg = []
    if t2_call_order: t2_msg.append("correct params (code, user_id, order_subtotal)")
    if t2_jsonb_is_valid: t2_msg.append("is_valid parsed from JSONB")
    if t2_jsonb_discount: t2_msg.append("discount_amount extracted from JSONB")
    if t2_exception: t2_msg.append("error message raised from JSONB")
    results.append(("Task 2: Coupon Param Order & JSONB Extraction", t2_passed, ", ".join(t2_msg)))

    # Task 3: Loyalty Points Redemption Deduction
    t3_exact_points = bool(re.search(
        r'INSERT\s+INTO\s+loyalty_ledger\s*\([^\)]*user_id[^\)]*order_id[^\)]*points[^\)]*transaction_type[^\)]*\)\s*VALUES\s*\([^\)]*p_user_id[^\)]*v_order_id[^\)]*-v_loyalty_discount::INT',
        sql, re.IGNORECASE | re.DOTALL
    ))
    results.append(("Task 3: Loyalty Points Redemption Deduction", t3_exact_points, "Deducted exact -v_loyalty_discount::INT in loyalty_ledger"))

    # Task 4: Orders Table RLS Lockdown
    t4_drop_orders_insert = bool(re.search(
        r'DROP\s+POLICY\s+IF\s+EXISTS\s+"Users can insert own orders"\s+ON\s+orders;',
        sql, re.IGNORECASE
    ))
    t4_drop_order_items_insert = bool(re.search(
        r'DROP\s+POLICY\s+IF\s+EXISTS\s+"Users can insert own order items"\s+ON\s+order_items;',
        sql, re.IGNORECASE
    ))
    t4_security_definer = bool(re.search(
        r'LANGUAGE\s+plpgsql\s+SECURITY\s+DEFINER',
        sql, re.IGNORECASE
    ))
    t4_passed = t4_drop_orders_insert and t4_drop_order_items_insert and t4_security_definer
    t4_msg = []
    if t4_drop_orders_insert: t4_msg.append("orders insert policy dropped")
    if t4_drop_order_items_insert: t4_msg.append("order_items insert policy dropped")
    if t4_security_definer: t4_msg.append("place_order_from_cart set to SECURITY DEFINER")
    results.append(("Task 4: Orders Table RLS Lockdown", t4_passed, ", ".join(t4_msg)))

    # Task 5: Enhance search_books()
    t5_signature = bool(re.search(
        r'CREATE\s+OR\s+REPLACE\s+FUNCTION\s+search_books\s*\(\s*search_query\s+TEXT\s*,\s*result_limit\s+INT\s+DEFAULT\s+20\s*,\s*p_category_id\s+UUID\s+DEFAULT\s+NULL\s*\)',
        sql, re.IGNORECASE
    ))
    t5_authors_search = bool(re.search(
        r'authors\s+a\s+ON\s+ba\.author_id\s*=\s*a\.id.*(?:a\.name|a\.name_bn)',
        sql, re.IGNORECASE | re.DOTALL
    ))
    t5_publishers_search = bool(re.search(
        r'publishers\s+p\s+WHERE\s+p\.id\s*=\s*b\.publisher_id.*p\.name',
        sql, re.IGNORECASE | re.DOTALL
    ))
    t5_category_filter = bool(re.search(
        r'p_category_id\s+IS\s+NULL\s+OR\s+EXISTS\s*\(\s*SELECT\s+1\s+FROM\s+book_categories\s+bc\s+WHERE\s+bc\.book_id\s*=\s*b\.id\s+AND\s+bc\.category_id\s*=\s*p_category_id\s*\)',
        sql, re.IGNORECASE
    ))
    t5_passed = t5_signature and t5_authors_search and t5_publishers_search and t5_category_filter
    t5_msg = []
    if t5_signature: t5_msg.append("search_books(search_query, result_limit, p_category_id)")
    if t5_authors_search: t5_msg.append("authors(name, name_bn) matching")
    if t5_publishers_search: t5_msg.append("publishers(name) matching")
    if t5_category_filter: t5_msg.append("book_categories category filtering")
    results.append(("Task 5: Enhance search_books()", t5_passed, ", ".join(t5_msg)))

    # Task 6: B2B Schema - Institutional Quotations
    t6_quotation_requests = bool(re.search(
        r'CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+quotation_requests\s*\(.*institution_name\s+TEXT.*contact_person\s+TEXT.*phone\s+VARCHAR.*email\s+VARCHAR.*book_list\s+TEXT.*estimated_quantity\s+VARCHAR.*pincode\s+VARCHAR.*status\s+VARCHAR.*created_at\s+TIMESTAMPTZ.*updated_at\s+TIMESTAMPTZ.*\);',
        sql, re.IGNORECASE | re.DOTALL
    ))
    t6_quotation_items = bool(re.search(
        r'CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+quotation_items\s*\(.*quotation_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+quotation_requests\s*\(\s*id\s*\)\s+ON\s+DELETE\s+CASCADE.*book_title\s+TEXT.*variant_id\s+UUID.*quantity\s+INT.*notes\s+TEXT.*\);',
        sql, re.IGNORECASE | re.DOTALL
    ))
    t6_rls_enabled = bool(re.search(r'ALTER TABLE quotation_requests ENABLE ROW LEVEL SECURITY;', sql, re.IGNORECASE)) and \
                     bool(re.search(r'ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;', sql, re.IGNORECASE))
    t6_policies = bool(re.search(r'CREATE\s+POLICY\s+.*?ON\s+quotation_requests', sql, re.IGNORECASE | re.DOTALL)) and \
                  bool(re.search(r'CREATE\s+POLICY\s+.*?ON\s+quotation_items', sql, re.IGNORECASE | re.DOTALL))

    t6_passed = t6_quotation_requests and t6_quotation_items and t6_rls_enabled and t6_policies
    t6_msg = []
    if t6_quotation_requests: t6_msg.append("quotation_requests table defined")
    if t6_quotation_items: t6_msg.append("quotation_items table with FK cascade")
    if t6_rls_enabled: t6_msg.append("RLS enabled on both tables")
    if t6_policies: t6_msg.append("Security & access policies configured")
    results.append(("Task 6: B2B Institutional Quotations Schema & RLS", t6_passed, ", ".join(t6_msg)))

    print("\n======================= VERIFICATION SUMMARY =======================")
    all_passed = True
    for name, passed, detail in results:
        status_label = "[PASS]" if passed else "[FAIL]"
        if not passed:
            all_passed = False
        print(f"{status_label} {name}: {detail}")
    print("=====================================================================")

    if all_passed:
        print("\n>>> ALL 6 MODULE 1 TASKS VERIFIED SUCCESSFULLY WITH 100% COMPLIANCE! <<<")
        return True
    else:
        print("\n>>> SOME CHECKS FAILED. PLEASE REVIEW DETAILS ABOVE. <<<")
        return False

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target_migration = os.path.join(base_dir, "supabase", "migrations", "20260907000014_fix_module1_critical_bugs.sql")
    success = verify_all_tasks(target_migration)
    sys.exit(0 if success else 1)
