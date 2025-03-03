const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  user: 'postgres',
  password: 'ThisIsAHard1!', 
  host: 'localhost',
  port: 5432,
  database: 'property_viewings',
});

async function runMigrations() {
  const client = await pool.connect();
  try {
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get list of migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();

    // Get already applied migrations
    const { rows: appliedMigrations } = await client.query('SELECT name FROM migrations');
    const appliedMigrationNames = appliedMigrations.map(m => m.name);

    for (const migrationFile of migrationFiles) {
      if (!appliedMigrationNames.includes(migrationFile)) {
        console.log(`Applying migration: ${migrationFile}`);
        
        const migration = require(path.join(migrationsDir, migrationFile));
        
        await client.query('BEGIN');
        try {
          await migration.up(client);
          await client.query('INSERT INTO migrations (name) VALUES ($1)', [migrationFile]);
          await client.query('COMMIT');
          console.log(`Migration applied: ${migrationFile}`);
        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`Error applying migration ${migrationFile}:`, error);
          throw error;
        }
      } else {
        console.log(`Migration already applied: ${migrationFile}`);
      }
    }

    console.log('All migrations applied successfully');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});