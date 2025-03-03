const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'ThisIsAHard1!', 
  host: 'localhost',
  port: 5432,
  database: 'property_viewings',
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};