"""
M.M Book House Malda - Bulk Catalog Seeder Generator
Generates 1,000 realistic books with variants, categories, authors, and inventory
Outputs to supabase/seed/05_bulk_1000_books_seed.sql
"""
import uuid
import random

def generate_bulk_seed(output_path="c:/sabir/MM Enterprise/supabase/seed/05_bulk_1000_books_seed.sql"):
    print("Generating 1,000 books catalog seed SQL...")

    # Extra Publishers
    publishers = [
        ("11111111-1111-1111-1111-111111111101", "Ananda Publishers", "আনন্দ পাবলিশার্স", "ananda-publishers"),
        ("11111111-1111-1111-1111-111111111102", "Chhaya Prakashani", "ছায়া প্রকাশনী", "chhaya-prakashani"),
        ("11111111-1111-1111-1111-111111111103", "Deys Publishing", "দে’জ পাবলিশিং", "deys-publishing"),
        ("11111111-1111-1111-1111-111111111104", "Moulana Azad Academy", "মওলানা আজাদ অ্যাকাডেমি", "moulana-azad-academy"),
        ("11111111-1111-1111-1111-111111111105", "Santra Publication", "সাঁতরা পাবলিকেশন", "santra-publication"),
        ("11111111-1111-1111-1111-111111111106", "Mitra & Ghosh Publishers", "মিত্র ও ঘোষ পাবলিশার্স", "mitra-ghosh"),
        ("11111111-1111-1111-1111-111111111107", "Parul Prakashani", "পারুল প্রকাশনী", "parul-prakashani"),
        ("11111111-1111-1111-1111-111111111108", "Techno World", "টেকনো ওয়ার্ল্ড", "techno-world")
    ]

    # Extra Authors
    author_pool = [
        ("22222222-2222-2222-2222-222222222201", "Dr. Atul Chandra Roy", "ড. অতুল চন্দ্র রায়", "dr-atul-chandra-roy"),
        ("22222222-2222-2222-2222-222222222202", "Sunil Gangopadhyay", "সুনীল গঙ্গোপাধ্যায়", "sunil-gangopadhyay"),
        ("22222222-2222-2222-2222-222222222203", "Dr. Nitish Sengupta", "ড. নীতীশ সেনগুপ্ত", "dr-nitish-sengupta"),
        ("22222222-2222-2222-2222-222222222204", "Chhaya Editorial Board", "ছায়া সম্পাদকীয় মণ্ডলী", "chhaya-editorial-board"),
        ("22222222-2222-2222-2222-222222222205", "Rabindranath Tagore", "রবীন্দ্রনাথ ঠাকুর", "rabindranath-tagore"),
        ("22222222-2222-2222-2222-222222222206", "Sarat Chandra Chattopadhyay", "শরৎচন্দ্র চট্টোপাধ্যায়", "sarat-chandra-chattopadhyay"),
        ("22222222-2222-2222-2222-222222222207", "Bibhutibhushan Bandyopadhyay", "বিভূতিভূষণ বন্দ্যোপাধ্যায়", "bibhutibhushan-bandyopadhyay"),
        ("22222222-2222-2222-2222-222222222208", "Tarasankar Bandyopadhyay", "তারাশঙ্কর বন্দ্যোপাধ্যায়", "tarasankar-bandyopadhyay"),
        ("22222222-2222-2222-2222-222222222209", "Dr. Amalendu De", "ড. অমলেন্দু দে", "dr-amalendu-de"),
        ("22222222-2222-2222-2222-222222222210", "Samaresh Majumdar", "সমরেশ মজুমদার", "samaresh-majumdar"),
        ("22222222-2222-2222-2222-222222222211", "Shirshendu Mukhopadhyay", "শীর্ষেন্দু মুখোপাধ্যায়", "shirshendu-mukhopadhyay"),
        ("22222222-2222-2222-2222-222222222212", "Subhas Mukhopadhyay", "সুভাষ মুখোপাধ্যায়", "subhas-mukhopadhyay"),
        ("22222222-2222-2222-2222-222222222213", "Santra Academic Council", "সাঁতরা অ্যাকাডেমিক কাউন্সিল", "santra-academic-council"),
        ("22222222-2222-2222-2222-222222222214", "Dr. Nemai Sadhan Bose", "ড. নিমাইসাধন বসু", "dr-nemai-sadhan-bose"),
        ("22222222-2222-2222-2222-222222222215", "Kazi Nazrul Islam", "কাজী নজরুল ইসলাম", "kazi-nazrul-islam")
    ]

    # Categories Pool
    categories_pool = [
        ("33333333-3333-3333-3333-333333333301", "Competitive Examinations"),
        ("33333333-3333-3333-3333-333333333311", "WBCS Special"),
        ("33333333-3333-3333-3333-333333333312", "Primary TET & School Service"),
        ("33333333-3333-3333-3333-333333333302", "College & University Textbooks"),
        ("33333333-3333-3333-3333-333333333321", "History (Honours & General)"),
        ("33333333-3333-3333-3333-333333333303", "Bengali Literature & Fiction")
    ]

    subjects = [
        ("WBCS", ["General Studies", "Indian History", "Indian Economy", "Polity & Constitution", "Arithmetic & Reasoning", "General Science", "English Practice"]),
        ("Primary TET", ["Child Development & Pedagogy", "Bengali Grammar & Pedagogy", "Mathematics Pedagogy", "Environmental Studies (EVS)"]),
        ("College Honours", ["Modern Indian History", "Mughal Empire Studies", "Bengali Sahityer Itihas", "Comparative Literature", "Western Political Thought"]),
        ("Literature Classics", ["Galpoguchho", "Pather Panchali", "Aranyak", "Chander Pahar", "Gora", "Srikanta", "Padma Nadir Majhi", "Kalpurush", "Gronthaboli"]),
        ("WBPSC & Police", ["Police Constable Guide", "Sub-Inspector Prep", "Clerkship Practice Set", "Miscellaneous Exam Cracker"])
    ]

    sql_lines = [
        "-- ==============================================================================",
        "-- M.M Book House Malda - 1,000 Bulk Books Seeder",
        "-- Auto-generated for high-performance indexing & catalog scale testing",
        "-- ==============================================================================\n"
    ]

    # Insert extra publishers
    sql_lines.append("-- Extra Publishers")
    for pub in publishers[4:]:
        sql_lines.append(
            f"INSERT INTO publishers (id, name, name_bn, slug, is_active) "
            f"VALUES ('{pub[0]}', '{pub[1]}', '{pub[2]}', '{pub[3]}', true) "
            f"ON CONFLICT (slug) DO NOTHING;"
        )

    # Insert extra authors
    sql_lines.append("\n-- Extra Authors")
    for auth in author_pool[4:]:
        sql_lines.append(
            f"INSERT INTO authors (id, name, name_bn, slug, is_active) "
            f"VALUES ('{auth[0]}', '{auth[1]}', '{auth[2]}', '{auth[3]}', true) "
            f"ON CONFLICT (slug) DO NOTHING;"
        )

    sql_lines.append("\n-- 1,000 Books, Variants, Authors, Categories & Inventory")

    total_books = 1000
    random.seed(42)

    for i in range(1, total_books + 1):
        book_id = f"a0000000-0000-0000-0000-{i:012d}"
        domain, topic_list = random.choice(subjects)
        topic = random.choice(topic_list)
        pub = random.choice(publishers)
        auth = random.choice(author_pool)
        cat = random.choice(categories_pool)

        title_en = f"{domain}: {topic} (Vol. {i})"
        title_bn = f"{domain} - {topic} (খণ্ড {i})"
        slug = f"{domain.lower().replace(' ', '-')}-{topic.lower().replace(' ', '-').replace('&', 'and')}-{i}"
        year = random.randint(2020, 2026)
        pages = random.randint(180, 1150)
        edition = f"{random.choice(['1st', '2nd', '3rd', '4th', 'Revised'])} Edition {year}"

        keywords = f"ARRAY['{domain.lower()}', '{topic.lower()}', '{auth[1].lower()}', '{pub[1].lower()}']"

        sql_lines.append(
            f"INSERT INTO books (id, title, title_bn, slug, publisher_id, language, edition, pages, published_year, keywords, is_active) "
            f"VALUES ('{book_id}', '{title_en}', '{title_bn}', '{slug}', '{pub[0]}', 'bengali', '{edition}', {pages}, {year}, {keywords}, true) "
            f"ON CONFLICT (slug) DO NOTHING;"
        )

        # Link Author
        sql_lines.append(
            f"INSERT INTO book_authors (book_id, author_id, role, display_order) "
            f"VALUES ('{book_id}', '{auth[0]}', 'author', 1) "
            f"ON CONFLICT (book_id, author_id, role) DO NOTHING;"
        )

        # Link Category
        sql_lines.append(
            f"INSERT INTO book_categories (book_id, category_id, is_primary) "
            f"VALUES ('{book_id}', '{cat[0]}', true) "
            f"ON CONFLICT (book_id, category_id) DO NOTHING;"
        )

        # Create variant
        var_id_1 = f"b0000000-0000-0000-0000-{i:012d}"
        sku_1 = f"MMB-{domain[:3].upper()}-{i:04d}-PB"
        mrp_1 = random.choice([250.00, 320.00, 450.00, 580.00, 750.00, 920.00, 1100.00])
        disc_rate = random.choice([0.15, 0.20, 0.25, 0.30])
        selling_1 = round(mrp_1 * (1.0 - disc_rate), 2)
        stock_1 = random.randint(5, 80)

        sql_lines.append(
            f"INSERT INTO book_variants (id, book_id, sku, binding, condition, mrp, selling_price, weight_grams, is_active) "
            f"VALUES ('{var_id_1}', '{book_id}', '{sku_1}', 'paperback', 'new', {mrp_1:.2f}, {selling_1:.2f}, 450, true) "
            f"ON CONFLICT (sku) DO NOTHING;"
        )

        # Seed inventory for variant 1
        sql_lines.append(
            f"INSERT INTO inventory (variant_id, stock_quantity, reserved_quantity, low_stock_threshold) "
            f"VALUES ('{var_id_1}', {stock_1}, 0, 5) "
            f"ON CONFLICT (variant_id) DO UPDATE SET stock_quantity = EXCLUDED.stock_quantity;"
        )

    content = "\n".join(sql_lines)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"Successfully generated 1,000 books catalog in {output_path}!")

if __name__ == "__main__":
    generate_bulk_seed()
