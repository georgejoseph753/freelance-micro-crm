const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
require("dotenv").config();

// The stable Node.js import for pdfmake
const PdfPrinter = require("pdfmake");

const app = express();

// 1. MIDDLEWARE & DATABASE SETUP
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 2. AUTHENTICATION & SECURITY

// REGISTER
app.post("/api/auth/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (userCheck.rows.length > 0)
      return res.status(400).json({ error: "User already exists." });

    const hashedPassword = await bcrypt.hash(password, 12);
    await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
      [email, hashedPassword]
    );
    res.status(201).json({ message: "Registration successful." });
  } catch (err) {
    res.status(500).json({ error: "Server error during registration." });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (userResult.rows.length === 0)
      return res.status(401).json({ error: "Invalid credentials." });

    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(401).json({ error: "Invalid credentials." });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: "Server error during login." });
  }
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied." });

  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token." });
    try {
      const userCheck = await pool.query("SELECT id FROM users WHERE id = $1", [user.id]);
      if (userCheck.rows.length === 0) return res.status(401).json({ error: "User no longer exists. Please log out." });
      req.user = user;
      next();
    } catch (dbErr) {
      res.status(500).json({ error: "Database authentication error." });
    }
  });
};

// 3. CLIENT & PROJECT ROUTES (CRUD)

// GET ALL CLIENTS
app.get("/api/clients", authenticateToken, async (req, res) => {
  try {
    const clients = await pool.query(
      "SELECT * FROM clients WHERE user_id = $1",
      [req.user.id]
    );
    res.json(clients.rows);
  } catch (err) {
    res.status(500).json({ error: "Error fetching clients." });
  }
});

// ADD NEW CLIENT (POST)
app.post("/api/clients", authenticateToken, async (req, res) => {
  const { first_name, last_name, email, company_name, billing_address, notes } = req.body;
  
  try {
    await pool.query(
      `INSERT INTO clients (user_id, first_name, last_name, email, company_name, billing_address, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user.id,
        first_name,
        last_name,
        email,
        company_name,
        billing_address,
        notes
      ]
    );
    res.status(201).json({ message: "Client added successfully." });
  } catch (err) {
    console.error("Error adding client:", err);
    res.status(500).json({ error: "Error adding client." });
  }
});

// EDIT CLIENT (PUT)
app.put("/api/clients/:id", authenticateToken, async (req, res) => {
  const { first_name, last_name, email, company_name, billing_address, notes } = req.body;
  
  try {
    await pool.query(
      `UPDATE clients 
       SET first_name = $1, last_name = $2, email = $3, company_name = $4, billing_address = $5, notes = $6 
       WHERE id = $7 AND user_id = $8`,
      [
        first_name,
        last_name,
        email,
        company_name,
        billing_address,
        notes,
        req.params.id,
        req.user.id
      ]
    );
    res.json({ message: "Client updated successfully." });
  } catch (err) {
    console.error("Error updating client:", err);
    res.status(500).json({ error: "Error updating client." });
  }
});

// DELETE CLIENT
app.delete("/api/clients/:id", authenticateToken, async (req, res) => {
  try {
    await pool.query("DELETE FROM clients WHERE id = $1 AND user_id = $2", [
      req.params.id,
      req.user.id,
    ]);

    res.json({
      message: "Client and associated projects deleted successfully.",
    });
  } catch (err) {
    console.error("Delete client error:", err);
    res.status(500).json({ error: "Error deleting client." });
  }
});

// PROJECTS

// GET ALL PROJECTS
app.get("/api/projects", authenticateToken, async (req, res) => {
  try {
    const projects = await pool.query(
      `SELECT p.*, c.first_name, c.last_name, c.company_name 
       FROM projects p JOIN clients c ON p.client_id = c.id 
       WHERE c.user_id = $1`,
      [req.user.id]
    );
    res.json(projects.rows);
  } catch (err) {
    res.status(500).json({ error: "Error fetching projects." });
  }
});

// ADD NEW PROJECT (POST)
app.post("/api/projects", authenticateToken, async (req, res) => {
  const { client_id, title, description, status, deadline, total_amount } = req.body;
  try {
    // Ensure client belongs to authenticated user
    const clientCheck = await pool.query(
      "SELECT id FROM clients WHERE id = $1 AND user_id = $2",
      [client_id, req.user.id]
    );

    if (clientCheck.rows.length === 0) {
      return res.status(403).json({ error: "Unauthorized or client not found." });
    }

    await pool.query(
      `INSERT INTO projects (client_id, title, description, status, deadline, total_amount) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [client_id, title, description, status, deadline, total_amount]
    );
    res.status(201).json({ message: "Project added successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error adding project." });
  }
});

// EDIT PROJECT (PUT)
app.put("/api/projects/:id", authenticateToken, async (req, res) => {
  const { title, description, status, deadline, total_amount } = req.body;
  try {
    await pool.query(
      `UPDATE projects 
       SET title = $1, description = $2, status = $3, deadline = $4, total_amount = $5 
       WHERE id = $6 AND client_id IN (SELECT id FROM clients WHERE user_id = $7)`,
      [
        title,
        description,
        status,
        deadline,
        total_amount,
        req.params.id,
        req.user.id,
      ]
    );
    res.json({ message: "Project updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error updating project." });
  }
});

// DELETE PROJECT
app.delete("/api/projects/:id", authenticateToken, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM projects 
       WHERE id = $1 AND client_id IN (SELECT id FROM clients WHERE user_id = $2)`,
      [req.params.id, req.user.id]
    );
    res.json({ message: "Project deleted successfully." });
  } catch (err) {
    console.error("Delete project error:", err);
    res.status(500).json({ error: "Error deleting project." });
  }
});

// 4. INVOICE GENERATOR SERVICE
app.get("/api/projects/:id/invoice", authenticateToken, async (req, res) => {
  try {
    const projectQuery = await pool.query(
      `SELECT p.*, c.first_name, c.last_name, c.company_name, c.billing_address, c.email
       FROM projects p JOIN clients c ON p.client_id = c.id
       WHERE p.id = $1 AND c.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (projectQuery.rows.length === 0)
      return res.status(404).json({ error: "Project not found." });

    const project = projectQuery.rows[0];

    const fonts = {
      Helvetica: {
        normal: "Helvetica",
        bold: "Helvetica-Bold",
        italics: "Helvetica-Oblique",
        bolditalics: "Helvetica-BoldOblique",
      },
    };

    const printer = new PdfPrinter(fonts);

    const docDefinition = {
      defaultStyle: { font: "Helvetica", fontSize: 10, color: "#333333" },
      content: [
        {
          columns: [
            { text: "Freelance Micro-CRM", fontSize: 20, bold: true, color: "#007bff" },
            { text: "INVOICE", fontSize: 28, bold: true, alignment: "right", color: "#222222" },
          ],
          margin: [0, 0, 0, 20],
        },
        {
          canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: "#dddddd" }],
          margin: [0, 0, 0, 20],
        },
        {
          columns: [
            {
              width: "50%",
              text: [
                { text: "BILLED TO:\n", bold: true, fontSize: 12, color: "#555555" },
                `${project.first_name} ${project.last_name}\n`,
                `${project.company_name || ""}\n`,
                `${project.billing_address || "No Billing Address Provided"}\n`,
                `${project.email}`,
              ],
            },
            {
              width: "50%",
              alignment: "right",
              text: [
                { text: `Invoice #: INV-${project.id.substring(0, 8).toUpperCase()}\n`, bold: true },
                `Date: ${new Date().toLocaleDateString()}\n`,
                { text: `Status: ${project.status}`, color: "#28a745", bold: true },
              ],
            },
          ],
          margin: [0, 0, 0, 30],
        },
        {
          table: {
            headerRows: 1,
            widths: ["*", "auto"],
            body: [
              [
                { text: "PROJECT DESCRIPTION", bold: true, fillColor: "#f4f4f4", border: [false, true, false, true], margin: [5, 5, 5, 5] },
                { text: "AMOUNT", bold: true, fillColor: "#f4f4f4", border: [false, true, false, true], margin: [5, 5, 5, 5] },
              ],
              [
                { text: project.title, margin: [5, 10, 5, 10], border: [false, false, false, true] },
                { text: `€${parseFloat(project.total_amount).toFixed(2)}`, margin: [5, 10, 5, 10], border: [false, false, false, true] },
              ],
            ],
          },
        },
        {
          text: `TOTAL DUE: €${parseFloat(project.total_amount).toFixed(2)}`,
          bold: true,
          fontSize: 18,
          alignment: "right",
          margin: [0, 20, 0, 0],
          color: "#007bff",
        },
      ],
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Invoice_${project.id}.pdf"`
    );

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (err) {
    console.error("PDF Error:", err);
    res.status(500).json({ error: "Error generating PDF." });
  }
});

// 5. START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running perfectly on port ${PORT}`));