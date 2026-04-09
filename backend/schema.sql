-- Enable UUID extension for secure, non-sequential IDs
CREATE EXTENSION
IF NOT EXISTS "uuid-ossp";

-- Table: Users (Targets FR1 and NFR2: Security)
CREATE TABLE users
(
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  -- To store bcrypt hashes (min cost 12)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Clients (Targets FR2: Client Profiles) [cite: 36]
CREATE TABLE clients
(
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  billing_address TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Projects (Targets FR3: Project Tracking) [cite: 36]
CREATE TABLE projects
(
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) CHECK (status IN ('Lead', 'Active', 'Completed')) DEFAULT 'Lead',
  deadline DATE,
  total_amount DECIMAL(12, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);