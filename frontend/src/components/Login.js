import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const Login = ({ setToken }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password,
        },
      );

      // Store token and clear errors
      setToken(response.data.token);
      localStorage.setItem("token", response.data.token);
      setError("");
      alert("Login successful!");
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2>Freelancer Micro-CRM Login</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          Login
        </button>
        <p style={{ textAlign: "center", marginTop: "15px" }}>
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </form>
    </div>
  );
};

const styles = {
  container: { display: "flex", justifyContent: "center", marginTop: "100px" },
  form: {
    display: "flex",
    flexDirection: "column",
    width: "300px",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "8px",
  },
  input: { marginBottom: "10px", padding: "8px" },
  button: {
    padding: "10px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default Login;
