# The Freelancer's Micro-CRM

A lightweight, containerized full-stack web application designed specifically for independent contractors to manage clients, track projects, and automate secure PDF invoice generation.

## 🏗️ System Architecture & Tech Stack

This application is built on a highly decoupled, three-tier microservice architecture:

### **Presentation Layer (Frontend)**

* React.js (Component-based UI)
* React Hooks
* Axios

### **Application Layer (Backend)**

* Node.js
* Express.js
* RESTful API
* JWT (stateless authentication)
* bcrypt (cryptographic hashing)
* pdfmake (server-side PDF generation)

### **Data Persistence Layer (Database)**

* PostgreSQL
* Relational schema with:

  * Foreign key constraints
  * UUID-based identifiers

### **DevOps & Infrastructure**

* Docker
* Docker Compose

---

## 🚀 Prerequisites

To ensure platform independence and prevent environmental inconsistencies, this application is fully containerized.

You **do NOT** need to install Node.js, npm, or PostgreSQL on your host machine.

### Required:

* [Docker Desktop / Docker Engine](https://docs.docker.com/get-docker/)
* [Docker Compose](https://docs.docker.com/compose/install/)

---

## 🛠️ Installation & Deployment

Follow these steps to run the full application locally:

### 1. Clone the Repository

```bash
git clone https://github.com/georgejoseph753/freelance-micro-crm.git
cd freelance-micro-crm
```

---

### 2. Configure Environment Variables

Create a `.env` file inside the `backend/` directory:

```bash
backend/.env
```

Add the following:

```env
DATABASE_URL=postgresql://postgres:ernestrutherfordium@db:5432/micro_crm
JWT_SECRET=super_secret_jwt_key_123
PORT=5000
```

---

### 3. Build and Run Containers

From the project root (where `docker-compose.yml` is located):

```bash
sudo docker-compose up --build -d
```

> 💡 **Windows users:** Run without `sudo`

---

### 4. Access the Application

* Frontend: http://localhost:3000
* Backend API: http://localhost:5000

---

## 🧪 Testing the Application

On first run, the PostgreSQL container automatically executes `schema.sql` to initialize the database.

The database starts empty to demonstrate full isolation.

### Steps to test:

1. Open: [http://localhost:3000](http://localhost:3000)
2. Register a new user
3. Log in
4. Go to **Dashboard**
5. Create a **Client**
6. Create a **Project** linked to that client
7. Mark project as **Completed**
8. Click **Download Invoice**

### Features demonstrated:

* Secure authentication (JWT + bcrypt)
* Relational data management
* Dynamic PDF invoice generation

---

## 🧹 Teardown & Cleanup

### Stop containers:

```bash
sudo docker-compose down
```

### Reset database (delete volume):

```bash
sudo docker-compose down -v
```

---

## 📄 License & Academic Integrity

This software was developed exclusively for academic evaluation purposes at IU International University of Applied Sciences.