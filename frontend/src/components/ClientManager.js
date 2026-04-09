import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

const ClientManager = ({ token }) => {
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    company_name: "",
    billing_address: "",
    notes: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false); // Added for dynamic color feedback

  const apiConfig = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // 1. Fetch Clients from Backend
  const fetchClients = useCallback(async () => {
    try {
      const response = await axios.get("/api/clients", apiConfig);
      setClients(response.data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  }, [token]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 2. CREATE & UPDATE Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(
          `/api/clients/${editingId}`,
          formData,
          apiConfig
        );
        setMessage("Client updated successfully!");
        setIsError(false);
      } else {
        await axios.post(
          "/api/clients",
          formData,
          apiConfig
        );
        setMessage("Client added successfully!");
        setIsError(false);
      }
      
      // Reset Form
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        company_name: "",
        billing_address: "",
        notes: "",
      });
      setEditingId(null);
      fetchClients();
    } catch (error) {
      console.error("Submission error:", error);
      setMessage("Error saving client. Please check backend logs.");
      setIsError(true);
    }
  };

  const handleEdit = (client) => {
    setFormData({
      first_name: client.first_name,
      last_name: client.last_name,
      email: client.email,
      company_name: client.company_name || "",
      billing_address: client.billing_address || "",
      notes: client.notes || "",
    });
    setEditingId(client.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure? This will also delete all projects for this client.")) {
      try {
        await axios.delete(`/api/clients/${id}`, apiConfig);
        setMessage("Client deleted.");
        setIsError(false);
        fetchClients();
      } catch (error) {
        setMessage("Error deleting client.");
        setIsError(true);
      }
    }
  };

  return (
    <div style={styles.container}>
      <h2>Client Management</h2>
      
      {/* Dynamic message color: Red for errors, Green for success */}
      {message && (
        <p style={{ ...styles.message, color: isError ? "#dc3545" : "#28a745" }}>
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.grid}>
          <input
            type="text"
            name="first_name"
            placeholder="First Name"
            value={formData.first_name}
            onChange={handleInputChange}
            required
            style={styles.input}
          />
          <input
            type="text"
            name="last_name"
            placeholder="Last Name"
            value={formData.last_name}
            onChange={handleInputChange}
            required
            style={styles.input}
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleInputChange}
            required
            style={styles.input}
          />
          <input
            type="text"
            name="company_name"
            placeholder="Company Name"
            value={formData.company_name}
            onChange={handleInputChange}
            style={styles.input}
          />
        </div>
        <textarea
          name="billing_address"
          placeholder="Billing Address"
          value={formData.billing_address}
          onChange={handleInputChange}
          style={styles.textarea}
        />
        <textarea
          name="notes"
          placeholder="Private Notes"
          value={formData.notes}
          onChange={handleInputChange}
          style={styles.textarea}
        />
        <button type="submit" style={styles.button}>
          {editingId ? "Update Client Profile" : "Add New Client"}
        </button>
        
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setFormData({ first_name: "", last_name: "", email: "", company_name: "", billing_address: "", notes: "" });
            }}
            style={styles.cancelButton}
          >
            Cancel Edit
          </button>
        )}
      </form>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Company</th>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.length === 0 ? (
            <tr><td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>No clients found. Add one above!</td></tr>
          ) : (
            clients.map((client) => (
              <tr key={client.id}>
                <td style={styles.td}>{client.first_name} {client.last_name}</td>
                <td style={styles.td}>{client.company_name || "-"}</td>
                <td style={styles.td}>{client.email}</td>
                <td style={styles.td}>
                  <button onClick={() => handleEdit(client)} style={styles.editBtn}>Edit</button>
                  <button onClick={() => handleDelete(client.id)} style={styles.deleteBtn}>Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

const styles = {
  container: { padding: "20px", maxWidth: "900px", margin: "0 auto", fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif" },
  message: { padding: "10px", borderRadius: "4px", backgroundColor: "#f8f9fa", textAlign: "center" },
  form: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "30px", padding: "20px", border: "1px solid #eee", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" },
  input: { padding: "10px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px" },
  textarea: { padding: "10px", border: "1px solid #ddd", borderRadius: "4px", minHeight: "80px", fontSize: "14px" },
  button: { padding: "12px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" },
  cancelButton: { padding: "10px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", marginTop: "5px" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: "10px" },
  th: { backgroundColor: "#f8f9fa", padding: "12px", borderBottom: "2px solid #dee2e6", textAlign: "left" },
  td: { padding: "12px", borderBottom: "1px solid #eee" },
  editBtn: { backgroundColor: "#007bff", color: "white", border: "none", padding: "6px 12px", marginRight: "8px", cursor: "pointer", borderRadius: "4px" },
  deleteBtn: { backgroundColor: "#dc3545", color: "white", border: "none", padding: "6px 12px", cursor: "pointer", borderRadius: "4px" },
};

export default ClientManager;