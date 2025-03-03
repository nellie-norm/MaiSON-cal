const express = require("express");
const cors = require("cors");
const db = require("./index"); // Import the database connection

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json()); // For parsing JSON requests
app.use(cors()); // Enable CORS if needed

// Simple Test Route
app.get("/", (req, res) => {
  res.send("🚀 Server is running!");
});

// Get all properties (Example Route)
app.get("/api/properties", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM properties");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});