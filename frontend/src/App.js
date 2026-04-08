import React, { useState } from "react";
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";
import Register from "./components/Register";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import ClientManager from "./components/ClientManager";
import ProjectManager from "./components/ProjectManager";

function App() {
  // Check if a token is already saved in the browser from a previous session
  const [token, setToken] = useState(localStorage.getItem("token"));

  // Logout function clears the token and forces the user back to Login
  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("token");
  };

  // A simple navigation bar that only shows if the user is logged in
  const NavBar = () => (
    <nav style={styles.nav}>
      <h2 style={{ margin: 0 }}>Freelance CRM</h2>
      <div>
        <Link to="/" style={styles.link}>
          Dashboard
        </Link>
        <Link to="/clients" style={styles.link}>
          Clients
        </Link>
        <Link to="/projects" style={styles.link}>
          Projects
        </Link>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </div>
    </nav>
  );

  return (
    <Router>
      <div style={{ fontFamily: "Arial, sans-serif" }}>
        {/* Only show the NavBar if we have a valid token */}
        {token && <NavBar />}

        <div style={{ padding: "20px" }}>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                !token ? <Login setToken={setToken} /> : <Navigate to="/" />
              }
            />
            <Route
              path="/register"
              element={!token ? <Register /> : <Navigate to="/" />}
            />

            {/* Protected Routes: Only accessible if 'token' exists */}
            <Route
              path="/"
              element={
                token ? <Dashboard token={token} /> : <Navigate to="/login" />
              }
            />
            <Route
              path="/clients"
              element={
                token ? (
                  <ClientManager token={token} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/projects"
              element={
                token ? (
                  <ProjectManager token={token} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 30px",
    backgroundColor: "#333",
    color: "white",
  },
  link: {
    color: "white",
    textDecoration: "none",
    marginRight: "20px",
    fontWeight: "bold",
  },
  logoutBtn: {
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    padding: "8px 15px",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default App;
