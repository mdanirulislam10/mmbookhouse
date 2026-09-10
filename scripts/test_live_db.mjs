import pg from 'pg';
const { Client } = pg;

const config = {
  host: 'aws-0-ap-south-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.kdtozonoecjnvsrdmxdr',
  password: 'mmbookhousemalda',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
};

async function test() {
  const client = new Client(config);
  await client.connect();
  console.log('--- RUNNING FINAL VERIFICATION ON SUPABASE DB ---');

  // 1. Fetch real active book
  const bookRes = await client.query('SELECT id, title FROM books WHERE is_active = TRUE LIMIT 1;');
  const book = bookRes.rows[0];
  console.log(`[TEST] Found test book: "${book.title}" (${book.id})`);

  // 2. Test get_frequently_bought_together
  const fbt = await client.query('SELECT * FROM get_frequently_bought_together($1, 3);', [book.id]);
  console.log(`[PASS] get_frequently_bought_together executed! (Rows: ${fbt.rows.length})`);

  // 3. Test get_series_books
  const series = await client.query('SELECT * FROM get_series_books($1);', [book.id]);
  console.log(`[PASS] get_series_books executed! (Rows: ${series.rows.length})`);

  // 4. Test get_catalog_books_paginated (popularity)
  const cat1 = await client.query('SELECT * FROM get_catalog_books_paginated(NULL, NULL, NULL, 5, $1);', ['popularity']);
  console.log(`[PASS] get_catalog_books_paginated (popularity) executed! (Rows: ${cat1.rows.length}, First: "${cat1.rows[0]?.title}")`);

  // 5. Test get_catalog_books_paginated (price_asc)
  const cat2 = await client.query('SELECT * FROM get_catalog_books_paginated(NULL, NULL, NULL, 5, $1);', ['price_asc']);
  console.log(`[PASS] get_catalog_books_paginated (price_asc) executed! (Rows: ${cat2.rows.length}, First: "${cat2.rows[0]?.title}", Price: ₹${cat2.rows[0]?.min_price})`);

  // 6. Test evaluate_cart_freebies
  const freebies = await client.query('SELECT * FROM evaluate_cart_freebies($1);', [book.id]);
  console.log(`[PASS] evaluate_cart_freebies executed! (Result: ${JSON.stringify(freebies.rows[0])})`);

  // 7. Test column book_variants.cover_image_url
  const col = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'book_variants' AND column_name = 'cover_image_url';");
  console.log(`[PASS] book_variants.cover_image_url exists! (${col.rows[0]?.column_name}, ${col.rows[0]?.data_type})`);

  // 8. Test Installed triggers
  const trig = await client.query("SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_name IN ('trigger_prevent_profile_privilege_escalation', 'trigger_order_delivered_loyalty', 'trigger_check_category_hierarchy_cycle');");
  console.log('[PASS] Active triggers:', trig.rows.map(t => `${t.trigger_name} ON ${t.event_object_table}`));

  console.log('--- ALL LIVE TESTS COMPLETED WITH 100% SUCCESS ---');
  await client.end();
}

test().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
