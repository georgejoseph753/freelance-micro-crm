import React, { useState, useEffect, useCallback } from "react"; 
import axios from "axios";

const ProjectManager = ({ token }) => {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    client_id: "",
    title: "",
    description: "", // Added: Matches backend requirement
    status: "Lead",
    deadline: "",
    total_amount: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false); // Added for visual feedback

  const apiConfig = { headers: { Authorization: `Bearer ${token}` } };

  const fetchData = useCallback(async () => {
    try {
      const [projectsRes, clientsRes] = await Promise.all([
        axios.get("/api/projects", apiConfig),
        axios.get("/api/clients", apiConfig),
      ]);
      setProjects(projectsRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [token]); 

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(
          `/api/projects/${editingId}`,
          formData,
          apiConfig
        );
        setMessage("Project updated successfully!");
      } else {
        await axios.post(
          "/api/projects",
          formData,
          apiConfig
        );
        setMessage("Project added successfully!");
      }
      setIsError(false);
      
      // Reset form including description
      setFormData({
        client_id: "",
        title: "",
        description: "",
        status: "Lead",
        deadline: "",
        total_amount: "",
      });
      setEditingId(null);
      fetchData();
    } catch (error) {
      console.error("Save error:", error);
      setMessage("Error saving project. Check if all fields are filled.");
      setIsError(true);
    }
  };

  const handleEdit = (project) => {
    const formattedDate = project.deadline
      ? new Date(project.deadline).toISOString().split("T")[0]
      : "";
    setFormData({ 
      ...project, 
      deadline: formattedDate,
      description: project.description || "" // Ensure description is loaded
    });
    setEditingId(project.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure?")) {
      try {
        await axios.delete(`/api/projects/${id}`, apiConfig);
        setMessage("Project deleted.");
        setIsError(false);
        fetchData();
      } catch (error) {
        setMessage("Error deleting project.");
        setIsError(true);
      }
    }
  };

  const handleDownloadInvoice = async (id, title) => {
    try {
      setMessage("Generating invoice...");
      setIsError(false);
      const response = await axios.get(
        `/api/projects/${id}/invoice`,
        { ...apiConfig, responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Invoice_${title.replace(/\s+/g, "_")}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setMessage("Invoice downloaded!");
    } catch (error) {
      setMessage("Error generating invoice.");
      setIsError(true);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Project Management</h2>
      {message && (
        <p style={{ ...styles.message, color: isError ? "#dc3545" : "#28a745" }}>
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.grid}>
          <input
            name="title"
            placeholder="Project Title"
            value={formData.title}
            onChange={handleInputChange}
            required
            style={styles.input}
          />

          <select
            name="client_id"
            value={formData.client_id}
            onChange={handleInputChange}
            required
            style={styles.input}
          >
            <option value="" disabled>Select a Client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.first_name} {client.last_name}
              </option>
            ))}
          </select>

          <select name="status" value={formData.status} onChange={handleInputChange} style={styles.input}>
            <option value="Lead">Lead</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
          </select>

          <input type="date" name="deadline" value={formData.deadline} onChange={handleInputChange} required style={styles.input} />
          
          <input
            type="number"
            name="total_amount"
            placeholder="Total Amount (€)"
            value={formData.total_amount}
            onChange={handleInputChange}
            required
            step="0.01"
            style={styles.input}
          />

          <input
            name="description"
            placeholder="Project Description (Required)"
            value={formData.description}
            onChange={handleInputChange}
            required
            style={styles.input}
          />
        </div>

        <button type="submit" style={styles.button}>
          {editingId ? "Update Project" : "Add New Project"}
        </button>
      </form>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Title</th>
            <th style={styles.th}>Client</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Amount</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              <td style={styles.td}>{project.title}</td>
              <td style={styles.td}>{project.first_name} {project.last_name}</td>
              <td style={styles.td}>
                <span style={{ ...styles.badge, backgroundColor: project.status === "Completed" ? "#28a745" : "#007bff" }}>
                  {project.status}
                </span>
              </td>
              <td style={styles.td}>€{project.total_amount}</td>
              <td style={styles.td}>
                <button onClick={() => handleEdit(project)} style={styles.editBtn}>Edit</button>
                <button onClick={() => handleDelete(project.id)} style={styles.deleteBtn}>Delete</button>
                {project.status === "Completed" && (
                  <button onClick={() => handleDownloadInvoice(project.id, project.title)} style={styles.invoiceBtn}>
                    Invoice
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
  container: { padding: "20px", maxWidth: "1000px", margin: "0 auto", fontFamily: "Arial, sans-serif" },
  message: { fontWeight: "bold", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "4px", textAlign: "center" },
  form: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "30px", padding: "15px", border: "1px solid #ddd", borderRadius: "5px" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  input: { padding: "8px", border: "1px solid #ccc", borderRadius: "4px" },
  button: { padding: "10px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { backgroundColor: "#f4f4f4", padding: "10px", border: "1px solid #ddd", textAlign: "left" },
  td: { padding: "10px", border: "1px solid #ddd" },
  badge: { padding: "4px 8px", borderRadius: "12px", color: "white", fontSize: "0.85rem" },
  editBtn: { backgroundColor: "#007bff", color: "white", border: "none", padding: "5px 10px", marginRight: "5px", borderRadius: "3px" },
  deleteBtn: { backgroundColor: "#dc3545", color: "white", border: "none", padding: "5px 10px", borderRadius: "3px" },
  invoiceBtn: { backgroundColor: "#17a2b8", color: "white", border: "none", padding: "5px 10px", marginLeft: "5px", borderRadius: "3px" },
};

export default ProjectManager;