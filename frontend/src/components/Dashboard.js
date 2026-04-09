import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import axios from "axios";

const Dashboard = ({ token }) => {
  // 1. Initialize the navigate function
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalClients: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const apiConfig = { headers: { Authorization: `Bearer ${token}` } };

        // Fetching both clients and projects to aggregate data for the overview
        const clientsRes = await axios.get(
          "http://localhost:5000/api/clients",
          apiConfig,
        );
        const projectsRes = await axios.get(
          "http://localhost:5000/api/projects",
          apiConfig,
        );

        const clients = clientsRes.data;
        const projects = projectsRes.data;

        // Calculate Metrics
        const activeCount = projects.filter(
          (p) => p.status === "Active",
        ).length;
        const completedCount = projects.filter(
          (p) => p.status === "Completed",
        ).length;

        // Sum the total amount of completed projects for the Revenue widget
        const revenue = projects
          .filter((p) => p.status === "Completed")
          .reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0);

        setStats({
          totalClients: clients.length,
          activeProjects: activeCount,
          completedProjects: completedCount,
          totalRevenue: revenue.toFixed(2),
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  if (loading) return <div style={styles.loading}>Loading Dashboard...</div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Welcome to your Micro-CRM</h2>
      <p style={styles.subtext}>
        Here is the overview of your freelance business.
      </p>

      <div style={styles.grid}>
        {/* Metric Card 1: Clients */}
        <div
          onClick={() => navigate("/clients")}
          style={{ ...styles.card, cursor: "pointer" }}
        >
          <h3 style={styles.cardTitle}>Total Clients</h3>
          <p style={styles.cardNumber}>{stats.totalClients}</p>
        </div>

        {/* Metric Card 2: Active Projects */}
        <div
          onClick={() => navigate("/projects")}
          style={{ ...styles.card, cursor: "pointer" }}
        >
          <h3 style={styles.cardTitle}>Active Projects</h3>
          <p style={styles.cardNumber}>{stats.activeProjects}</p>
        </div>

        {/* Metric Card 3: Completed Projects */}
        <div
          onClick={() => navigate("/projects")}
          style={{ ...styles.card, cursor: "pointer" }}
        >
          <h3 style={styles.cardTitle}>Completed Projects</h3>
          <p style={styles.cardNumber}>{stats.completedProjects}</p>
        </div>

        {/* Metric Card 4: Revenue (Also goes to projects, updated to Euro) */}
        <div
          onClick={() => navigate("/projects")}
          style={{ ...styles.card, cursor: "pointer" }}
        >
          <h3 style={styles.cardTitle}>Total Revenue</h3>
          <p style={styles.cardNumber}>€{stats.totalRevenue}</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "30px",
    maxWidth: "1000px",
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
  },
  header: { color: "#333", marginBottom: "5px" },
  subtext: { color: "#666", marginBottom: "30px" },
  loading: {
    textAlign: "center",
    marginTop: "50px",
    fontSize: "1.2rem",
    color: "#555",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
  },
  card: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    borderLeft: "5px solid #007bff",
    textAlign: "center",

    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  cardTitle: {
    margin: "0 0 10px 0",
    fontSize: "1rem",
    color: "#555",
    textTransform: "uppercase",
  },
  cardNumber: {
    margin: "0",
    fontSize: "2.5rem",
    fontWeight: "bold",
    color: "#222",
  },
};

export default Dashboard;
