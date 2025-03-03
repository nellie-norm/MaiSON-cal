const express = require('express');
const cors = require('cors');
const db = require('../backend');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// Get availability for a property
app.get('/api/properties/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT a.*, s.name as seller_name
       FROM availability a
       JOIN sellers s ON a.seller_id = s.id
       WHERE a.property_id = $1
       ORDER BY a.start_time`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create availability
app.post('/api/availability', async (req, res) => {
  try {
    const { property_id, seller_id, start_time, end_time } = req.body;
    const result = await db.query(
      `INSERT INTO availability (property_id, seller_id, start_time, end_time)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [property_id, seller_id, start_time, end_time]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

console.log('Server running on port 3001');
