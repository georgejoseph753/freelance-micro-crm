const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const PdfPrinter = require("pdfmake");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

// ==========================================
// 1. MIDDLEWARE & DATABASE SETUP
// ==========================================
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test Route to ensure server is alive
app.get("/api/health", (req, res) => {
  res
    .status(200)
    .json({ status: "UP", message: "Micro-CRM API is operational" });
});

// ==========================================
// 2. PUBLIC ROUTES (AUTHENTICATION)
// ==========================================

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
    const newUser = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
      [email, hashedPassword],
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
      [email],
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
      { expiresIn: "8h" },
    );
    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error during login." });
  }
});

// ==========================================
// 3. SECURITY GATEWAY (JWT VERIFIER)
// ==========================================
// Any route below this line requires a valid token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res.status(401).json({ error: "Access denied. No token." });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token." });
    req.user = user;
    next();
  });
};

// ==========================================
// 4. PROTECTED ROUTES: CLIENTS
// ==========================================

// Create Client
app.post("/api/clients", authenticateToken, async (req, res) => {
  const { first_name, last_name, email, company_name, billing_address, notes } =
    req.body;
  try {
    const newClient = await pool.query(
      `INSERT INTO clients (user_id, first_name, last_name, email, company_name, billing_address, notes) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        req.user.id,
        first_name,
        last_name,
        email,
        company_name,
        billing_address,
        notes,
      ],
    );
    res.status(201).json(newClient.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error creating client." });
  }
});

// Get Clients
app.get("/api/clients", authenticateToken, async (req, res) => {
  try {
    const clients = await pool.query(
      "SELECT * FROM clients WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id],
    );
    res.json(clients.rows);
  } catch (err) {
    res.status(500).json({ error: "Error fetching clients." });
  }
});

// Update Client
app.put("/api/clients/:id", authenticateToken, async (req, res) => {
  const { first_name, last_name, email, company_name, billing_address, notes } =
    req.body;
  try {
    const update = await pool.query(
      `UPDATE clients SET first_name = $1, last_name = $2, email = $3, company_name = $4, billing_address = $5, notes = $6 
             WHERE id = $7 AND user_id = $8 RETURNING *`,
      [
        first_name,
        last_name,
        email,
        company_name,
        billing_address,
        notes,
        req.params.id,
        req.user.id,
      ],
    );
    if (update.rows.length === 0)
      return res.status(404).json({ error: "Not found." });
    res.json(update.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error updating client." });
  }
});

// Delete Client
app.delete("/api/clients/:id", authenticateToken, async (req, res) => {
  try {
    const del = await pool.query(
      "DELETE FROM clients WHERE id = $1 AND user_id = $2 RETURNING *",
      [req.params.id, req.user.id],
    );
    if (del.rows.length === 0)
      return res.status(404).json({ error: "Not found." });
    res.json({ message: "Deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Error deleting client." });
  }
});

// ==========================================
// 5. PROTECTED ROUTES: PROJECTS
// ==========================================

// Create Project
app.post("/api/projects", authenticateToken, async (req, res) => {
  const { client_id, title, status, deadline, total_amount } = req.body;
  try {
    const clientCheck = await pool.query(
      "SELECT id FROM clients WHERE id = $1 AND user_id = $2",
      [client_id, req.user.id],
    );
    if (clientCheck.rows.length === 0)
      return res.status(403).json({ error: "Unauthorized client." });

    const newProj = await pool.query(
      `INSERT INTO projects (client_id, title, status, deadline, total_amount) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [client_id, title, status || "Lead", deadline, total_amount || 0],
    );
    res.status(201).json(newProj.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error creating project." });
  }
});

// Get Projects
app.get("/api/projects", authenticateToken, async (req, res) => {
  try {
    const projects = await pool.query(
      `SELECT p.*, c.first_name, c.last_name, c.company_name 
             FROM projects p JOIN clients c ON p.client_id = c.id 
             WHERE c.user_id = $1 ORDER BY p.created_at DESC`,
      [req.user.id],
    );
    res.json(projects.rows);
  } catch (err) {
    res.status(500).json({ error: "Error fetching projects." });
  }
});

// Update Project
app.put("/api/projects/:id", authenticateToken, async (req, res) => {
  const { title, status, deadline, total_amount } = req.body;
  try {
    const update = await pool.query(
      `UPDATE projects p SET title = $1, status = $2, deadline = $3, total_amount = $4 
             FROM clients c WHERE p.client_id = c.id AND p.id = $5 AND c.user_id = $6 RETURNING p.*`,
      [title, status, deadline, total_amount, req.params.id, req.user.id],
    );
    if (update.rows.length === 0)
      return res.status(404).json({ error: "Not found." });
    res.json(update.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error updating project." });
  }
});

// Delete Project
app.delete("/api/projects/:id", authenticateToken, async (req, res) => {
  try {
    const del = await pool.query(
      `DELETE FROM projects p USING clients c WHERE p.client_id = c.id AND p.id = $1 AND c.user_id = $2 RETURNING p.*`,
      [req.params.id, req.user.id],
    );
    if (del.rows.length === 0)
      return res.status(404).json({ error: "Not found." });
    res.json({ message: "Deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Error deleting project." });
  }
});
// Generate PDF Invoice for a Project
app.get("/api/projects/:id/invoice", authenticateToken, async (req, res) => {
  try {
    // 1. Fetch project AND client data using a SQL JOIN
    const projectQuery = await pool.query(
      `SELECT p.*, c.first_name, c.last_name, c.company_name, c.billing_address, c.email
             FROM projects p
             JOIN clients c ON p.client_id = c.id
             WHERE p.id = $1 AND c.user_id = $2`,
      [req.params.id, req.user.id],
    );

    if (projectQuery.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Project not found or unauthorized." });
    }

    const project = projectQuery.rows[0];

    // 2. Configure the PDF Printer using standard web fonts
    const fonts = {
      Helvetica: {
        normal: "Helvetica",
        bold: "Helvetica-Bold",
        italics: "Helvetica-Oblique",
        bolditalics: "Helvetica-BoldOblique",
      },
    };
    const printer = new PdfPrinter(fonts);

    // 3. Design the Invoice Layout (The "Document Definition")
    const docDefinition = {
      defaultStyle: { font: "Helvetica" },
      content: [
        {
          text: "INVOICE",
          fontSize: 28,
          bold: true,
          alignment: "right",
          margin: [0, 0, 0, 20],
        },
        {
          text: "From: Freelancer Micro-CRM",
          color: "gray",
          margin: [0, 0, 0, 30],
        },
        {
          columns: [
            {
              width: "50%",
              text: [
                { text: "Billed To:\n", bold: true, fontSize: 14 },
                `${project.first_name} ${project.last_name}\n`,
                `${project.company_name || ""}\n`,
                `${project.billing_address || "No address provided"}\n`,
                `${project.email}`,
              ],
            },
            {
              width: "50%",
              alignment: "right",
              text: [
                {
                  text: `Invoice Number: INV-${project.id}00${project.id}\n`,
                  bold: true,
                },
                { text: `Date: ${new Date().toLocaleDateString()}\n` },
                {
                  text: `Project Status: ${project.status}\n`,
                  color: project.status === "Completed" ? "green" : "black",
                },
              ],
            },
          ],
        },
        {
          text: "Services Rendered",
          fontSize: 16,
          bold: true,
          margin: [0, 40, 0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: ["*", "auto"],
            body: [
              [
                { text: "Description", bold: true, fillColor: "#f8f9fa" },
                { text: "Amount", bold: true, fillColor: "#f8f9fa" },
              ],
              [
                project.title,
                `$${parseFloat(project.total_amount).toFixed(2)}`,
              ],
            ],
          },
          layout: "lightHorizontalLines",
        },
        {
          text: `Total Due: $${parseFloat(project.total_amount).toFixed(2)}`,
          fontSize: 18,
          bold: true,
          alignment: "right",
          margin: [0, 30, 0, 0],
        },
      ],
    };

    // 4. Generate the PDF and stream it to the user's browser
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Invoice_${project.title.replace(/\s+/g, "_")}.pdf"`,
    );

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (err) {
    console.error("PDF Error:", err.message);
    res.status(500).json({ error: "Server error while generating PDF." });
  }
});
// ==========================================
// 6. START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running perfectly on port ${PORT}`);
});
