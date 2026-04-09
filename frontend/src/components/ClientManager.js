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

  // Axios configuration to include the JWT token securely
  const apiConfig = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // 1. Single declaration of fetchClients wrapped in useCallback
  const fetchClients = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/clients", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClients(response.data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  }, [token]); // token is the dependency for useCallback

  // 2. Single useEffect to trigger the fetch on load
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // CREATE & UPDATE: Handle form submission for both creating and updating clients
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update existing client
        await axios.put(
          `http://localhost:5000/api/clients/${editingId}`,
          formData,
          apiConfig,
        );
        setMessage("Client updated successfully!");
      } else {
        // Create new client
        await axios.post(
          "http://localhost:5000/api/clients",
          formData,
          apiConfig,
        );
        setMessage("Client added successfully!");
      }
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        company_name: "",
        billing_address: "",
        notes: "",
      });
      setEditingId(null);
      fetchClients(); // Refresh the list
    } catch (error) {
      setMessage("Error saving client.");
    }
  };

  // Prepare form for editing
  const handleEdit = (client) => {
    setFormData(client);
    setEditingId(client.id);
  };

  // DELETE: Remove a client
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this client?")) {
      try {
        await axios.delete(
          `http://localhost:5000/api/clients/${id}`,
          apiConfig,
        );
        setMessage("Client deleted.");
        fetchClients();
      } catch (error) {
        setMessage("Error deleting client.");
      }
    }
  };

  return (
    <div style={styles.container}>
      <h2>Client Management</h2>
      {message && <p style={styles.message}>{message}</p>}

      {/* The Form (Create/Update) */}
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
            placeholder="Email"
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
          placeholder="Notes"
          value={formData.notes}
          onChange={handleInputChange}
          style={styles.textarea}
        />
        <button type="submit" style={styles.button}>
          {editingId ? "Update Client" : "Add New Client"}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setFormData({
                first_name: "",
                last_name: "",
                email: "",
                company_name: "",
                billing_address: "",
                notes: "",
              });
            }}
            style={styles.cancelButton}
          >
            Cancel
          </button>
        )}
      </form>

      {/* The Data Table (Read/Delete) */}
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
          {clients.map((client) => (
            <tr key={client.id}>
              <td style={styles.td}>
                {client.first_name} {client.last_name}
              </td>
              <td style={styles.td}>{client.company_name}</td>
              <td style={styles.td}>{client.email}</td>
              <td style={styles.td}>
                <button
                  onClick={() => handleEdit(client)}
                  style={styles.editBtn}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(client.id)}
                  style={styles.deleteBtn}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    maxWidth: "800px",
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
  },
  message: { color: "green", fontWeight: "bold" },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "30px",
    padding: "15px",
    border: "1px solid #ddd",
    borderRadius: "5px",
  },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  input: { padding: "8px", border: "1px solid #ccc", borderRadius: "4px" },
  textarea: {
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    minHeight: "60px",
  },
  button: {
    padding: "10px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  cancelButton: {
    padding: "10px",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginTop: "5px",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    backgroundColor: "#f4f4f4",
    padding: "10px",
    border: "1px solid #ddd",
    textAlign: "left",
  },
  td: { padding: "10px", border: "1px solid #ddd" },
  editBtn: {
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    padding: "5px 10px",
    marginRight: "5px",
    cursor: "pointer",
    borderRadius: "3px",
  },
  deleteBtn: {
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    padding: "5px 10px",
    cursor: "pointer",
    borderRadius: "3px",
  },
};

export default ClientManager;
