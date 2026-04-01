import React, { useState, useEffect } from "react";
import axios from "axios";

const ProjectManager = ({ token }) => {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]); // Needed for the dropdown menu
  const [formData, setFormData] = useState({
    client_id: "",
    title: "",
    status: "Lead",
    deadline: "",
    total_amount: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const apiConfig = { headers: { Authorization: `Bearer ${token}` } };

  // Fetch both Projects and Clients when the page loads
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, clientsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/projects", apiConfig),
        axios.get("http://localhost:5000/api/clients", apiConfig),
      ]);
      setProjects(projectsRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(
          `http://localhost:5000/api/projects/${editingId}`,
          formData,
          apiConfig,
        );
        setMessage("Project updated successfully!");
      } else {
        await axios.post(
          "http://localhost:5000/api/projects",
          formData,
          apiConfig,
        );
        setMessage("Project added successfully!");
      }
      // Reset form
      setFormData({
        client_id: "",
        title: "",
        status: "Lead",
        deadline: "",
        total_amount: "",
      });
      setEditingId(null);
      fetchData();
    } catch (error) {
      setMessage("Error saving project.");
    }
  };

  const handleEdit = (project) => {
    // Format the date so it fits in the HTML date input
    const formattedDate = project.deadline
      ? new Date(project.deadline).toISOString().split("T")[0]
      : "";
    setFormData({ ...project, deadline: formattedDate });
    setEditingId(project.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await axios.delete(
          `http://localhost:5000/api/projects/${id}`,
          apiConfig,
        );
        setMessage("Project deleted.");
        fetchData();
      } catch (error) {
        setMessage("Error deleting project.");
      }
    }
  };

  // DOWNLOAD PDF: Fetch the blob and trigger browser download
  const handleDownloadInvoice = async (id, title) => {
    try {
      setMessage("Generating invoice..."); // Quick UI feedback
      const response = await axios.get(
        `http://localhost:5000/api/projects/${id}/invoice`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob", // CRITICAL: Tells React to expect a file, not JSON
        },
      );

      // Create a temporary hidden link to download the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Invoice_${title.replace(/\s+/g, "_")}.pdf`,
      );
      document.body.appendChild(link);
      link.click(); // Force the download
      link.parentNode.removeChild(link); // Clean up

      setMessage("Invoice downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      setMessage("Error generating invoice. Ensure project is complete.");
    }
  };

  return (
    <div style={styles.container}>
      <h2>Project Management</h2>
      {message && <p style={styles.message}>{message}</p>}

      {/* The Form */}
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.grid}>
          <input
            type="text"
            name="title"
            placeholder="Project Title"
            value={formData.title}
            onChange={handleInputChange}
            required
            style={styles.input}
          />

          {/* Relational Dropdown: Assign to a Client */}
          <select
            name="client_id"
            value={formData.client_id}
            onChange={handleInputChange}
            required
            style={styles.input}
          >
            <option value="" disabled>
              Select a Client
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.first_name} {client.last_name} ({client.company_name})
              </option>
            ))}
          </select>

          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            style={styles.input}
          >
            <option value="Lead">Lead</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
          </select>

          <input
            type="date"
            name="deadline"
            value={formData.deadline}
            onChange={handleInputChange}
            style={styles.input}
          />
          <input
            type="number"
            step="0.01"
            name="total_amount"
            placeholder="Total Amount ($)"
            value={formData.total_amount}
            onChange={handleInputChange}
            style={styles.input}
          />
        </div>

        <button type="submit" style={styles.button}>
          {editingId ? "Update Project" : "Add New Project"}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setFormData({
                client_id: "",
                title: "",
                status: "Lead",
                deadline: "",
                total_amount: "",
              });
            }}
            style={styles.cancelButton}
          >
            Cancel
          </button>
        )}
      </form>

      {/* The Data Table */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Project Title</th>
            <th style={styles.th}>Client</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Deadline</th>
            <th style={styles.th}>Amount</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              <td style={styles.td}>{project.title}</td>
              <td style={styles.td}>
                {project.first_name} {project.last_name}
              </td>
              <td style={styles.td}>
                <span
                  style={{
                    ...styles.badge,
                    backgroundColor:
                      project.status === "Completed"
                        ? "#28a745"
                        : project.status === "Active"
                          ? "#007bff"
                          : "#6c757d",
                  }}
                >
                  {project.status}
                </span>
              </td>
              <td style={styles.td}>
                {project.deadline
                  ? new Date(project.deadline).toLocaleDateString()
                  : "N/A"}
              </td>
              <td style={styles.td}>${project.total_amount}</td>
              <td style={styles.td}>
                <button
                  onClick={() => handleEdit(project)}
                  style={styles.editBtn}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  style={styles.deleteBtn}
                >
                  Delete
                </button>

                {/* Conditional Rendering: Only show if status is 'Completed' */}
                {project.status === "Completed" && (
                  <button
                    onClick={() =>
                      handleDownloadInvoice(project.id, project.title)
                    }
                    style={styles.invoiceBtn}
                  >
                    Download Invoice
                  </button>
                )}
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
    maxWidth: "1000px",
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
  button: {
    padding: "10px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginTop: "10px",
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
  badge: {
    padding: "4px 8px",
    borderRadius: "12px",
    color: "white",
    fontSize: "0.85rem",
  },
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
  invoiceBtn: {
    backgroundColor: "#17a2b8",
    color: "white",
    border: "none",
    padding: "5px 10px",
    cursor: "pointer",
    borderRadius: "3px",
    marginLeft: "5px",
  },
};

export default ProjectManager;
