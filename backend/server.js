const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Essential for FR1-FR3 data handling [cite: 59]

// Database Configuration (Targets NFR3: Availability) [cite: 38]
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// TEST ROUTE: Verify Server is running (Targets NFR2: Performance)
app.get("/api/health", (req, res) => {
  res
    .status(200)
    .json({ status: "UP", message: "Micro-CRM API is operational" });
});

// FR1: User Registration (Includes bcrypt hashing for NFR2: Security) [cite: 59, 130]
app.post("/api/auth/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 12); // Cost factor 12
    const newUser = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
      [email, hashedPassword],
    );
    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

// FR2: Get Client Profiles [cite: 59, 130]
app.get("/api/clients", async (req, res) => {
  try {
    const allClients = await pool.query("SELECT * FROM clients");
    res.json(allClients.rows);
  } catch (err) {
    res.status(500).json({ error: "Database query failed" });
  }
});

// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
