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
  console.log('Connected to Supabase PostgreSQL database for seeding.');

  const seedsDir = path.resolve('supabase/seed');
  const files = fs.readdirSync(seedsDir).filter(f => f.endsWith('.sql')).sort();

  console.log('Found ' + files.length + ' seed files.');

  for (const file of files) {
    console.log('Applying seed file: ' + file + '...');
    const sql = fs.readFileSync(path.join(seedsDir, file), 'utf8');
    
    try {
      await client.query('BEGIN;');
      await client.query(sql);
      await client.query('COMMIT;');
      console.log('SUCCESS: ' + file);
    } catch (err) {
      await client.query('ROLLBACK;');
      console.warn('NOTICE in ' + file + ':', err.message);
    }
  }

  console.log('All seeds processing completed!');
  await client.end();
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
