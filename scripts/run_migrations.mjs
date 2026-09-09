import fs from 'fs';
import path from 'path';
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

async function run() {
  const client = new Client(config);
  await client.connect();
  console.log('Connected to Supabase PostgreSQL database.');

  await client.query(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      version text PRIMARY KEY,
      applied_at timestamptz DEFAULT now()
    );
  `);

  const appliedRes = await client.query('SELECT version FROM _schema_migrations;');
  const appliedSet = new Set(appliedRes.rows.map(r => r.version));

  const migrationsDir = path.resolve('supabase/migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  console.log('Found ' + files.length + ' migration files.');

  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log('Skipping already applied: ' + file);
      continue;
    }

    console.log('Applying migration: ' + file + '...');
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    
    try {
      await client.query('BEGIN;');
      await client.query(sql);
      await client.query('INSERT INTO _schema_migrations (version) VALUES ($1);', [file]);
      await client.query('COMMIT;');
      console.log('SUCCESS: ' + file);
    } catch (err) {
      await client.query('ROLLBACK;');
      console.error('ERROR in ' + file + ':', err.message);
      process.exit(1);
    }
  }

  console.log('All migrations applied successfully!');
  await client.end();
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
