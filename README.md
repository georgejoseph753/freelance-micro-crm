# The Freelancer's Micro-CRM

A lightweight, cloud-hosted Customer Relationship Management (CRM) system designed specifically for solo freelancers to streamline client management, monitor project lifecycles, and generate automated PDF invoices.

## 🚀 Overview
Digital transformation often leaves solo practitioners with bloated, expensive tools. This project provides a hyper-focused, Dockerized full-stack solution. It strictly enforces multi-tenant security, tracking leads and generating professional PDF invoices with a single click in a clean UI.

## ✨ Key Features
- **Secure Authentication:** User registration and login protected by JSON Web Tokens (JWT) and bcrypt password hashing. Middleware strictly validates database presence preventing ghost-token usage.
- **Client Management:** Full CRUD operations for client profiles (billing info, private notes) completely segregated by user.
- **Project Tracking:** Attach projects directly to clients and seamlessly slide lifecycle statuses from 'Lead', to 'Active', down to 'Completed'.
- **Automated Invoicing:** Highly scalable one-click PDF invoice synthesis powered by pdfmake. 
- **Dockerized Ready:** Single-command local deployment with reverse proxy via NGINX mapping seamlessly to the internal Node.js backend.

## 🛠️ Architecture & Tech Stack
- **Frontend (UI & State):** React.js + Axios
- **Frontend Server (Proxy & Hosted Build):** NGINX Alpine
- **Backend Framework:** Node.js & Express.js
- **Database:** PostgreSQL with `uuid-ossp` extensions
- **DevOps & Containers:** Docker & Docker Compose

---

## ⚙️ Installation & Deployment

This project requires **Docker** and **Docker Compose** installed on your system. You don't actually need Node.js or PostgreSQL installed natively!

### 1. Provision the Environment
```bash
# Clone the repository
git clone https://github.com/georgejoseph753/freelance-micro-crm.git
cd freelance-micro-crm

# Build and start all services via Docker
sudo docker-compose up --build -d
```

### 2. Access the Application
- Open your browser to `http://localhost:3000`
- The PostgreSQL database will seamlessly boot and run its local `schema.sql` migrations instantly!

*(Note: If you run `docker-compose down -v` to delete and wipe your database containers entirely, remember to "Logout" in your browser before trying to test again, as your browser's persistent JWT token will no longer align with the fresh database!)*

## 🛡️ Security Overview
This application enforces strict database-level referential integrity using PostgreSQL Foreign Keys (`ON DELETE CASCADE`) to naturally prevent data lingering. 
The API is specifically patched against malicious Cross-Account Data Modification by actively intercepting all routing requests and asserting `$user_id` ownership constraints natively through the `pg` pool.