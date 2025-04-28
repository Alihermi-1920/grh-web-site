// src/pages/ProjectListPage.js
import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  IconButton,
  Divider,
  Menu,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Tabs,
  Tab,
  Chip,
  LinearProgress,
  Tooltip,
  Paper,
  Container,
  Fab,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  FormControlLabel,
  Switch,
  Checkbox,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Toolbar,
  alpha,
  useTheme,
  Stack,
  Breadcrumbs,
  Link,
  ListItemIcon,
  ListItemButton,
  Collapse,
  InputAdornment,
  Drawer,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Rating,
  Backdrop,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from "@mui/material";
import {
  Assignment,
  MoreVert,
  PictureAsPdf,
  Add,
  Search,
  FilterList,
  CheckCircle,
  Schedule,
  Flag,
  Group,
  AssignmentTurnedIn,
  InsertChart,
  AddTask,
  Person,
  Delete,
  Edit,
  Refresh,
  ExpandMore,
  ExpandLess,
  AttachFile,
  Comment,
  PlayArrow,
  Pause,
  Done,
  Close,
  Home,
  Download,
  FileUpload,
  FileDownload,
  Description,
  AccessTime,
  CalendarToday,
  SupervisorAccount,
  DeleteSweep,
  SelectAll,
  MoreHoriz,
  Info,
  Star,
  StarBorder,
  ArrowBack,
  ArrowForward,
  CloudUpload,
  CloudDownload,
  Visibility,
  VisibilityOff,
  ViewList,
  ViewModule,
  TableChart,
  InsertDriveFile,
  Block,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AuthContext } from "../context/AuthContext";

const ProjectListPage = () => {
  // Navigation
  const navigate = useNavigate();

  // Theme
  const theme = useTheme();

  // User context from AuthContext
  const { user } = useContext(AuthContext);
  const [userRole, setUserRole] = useState("admin"); // admin, projectLeader, employee
  const [currentUser, setCurrentUser] = useState(null);

  // Main state
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showMyProjects, setShowMyProjects] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid or table

  // Selection state for mass actions
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Project detail view state
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedProjectDetail, setSelectedProjectDetail] = useState(null);

  // File upload and comments state
  const [fileUploadOpen, setFileUploadOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [projectComments, setProjectComments] = useState([]);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState("");

  // Context menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const menuOpen = Boolean(anchorEl);

  // Task dialog state
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    deadline: "",
    priority: "medium",
  });

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editedProject, setEditedProject] = useState({
    projectName: "",
    description: "",
    deadline: "",
    priority: "",
    status: "",
    budget: "",
  });

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Team management dialog
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [employees, setEmployees] = useState([]);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // Set user role and current user based on authenticated user
  useEffect(() => {
    if (user) {
      setUserRole(user.role === "Chef" ? "projectLeader" : user.role === "Admin" ? "admin" : "employee");
      setCurrentUser({
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        photo: user.photo
      });
    }
  }, [user]);

  // Function to fetch projects
  const fetchProjects = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      let projectData;

      // Fetch projects based on user role
      if (userRole === "projectLeader") {
        // For chef, fetch only their projects
        try {
          const projectResponse = await fetch(`http://localhost:5000/api/projects/employee/${currentUser.id}`);
          if (!projectResponse.ok) {
            console.warn(`Warning: Unable to fetch chef projects, falling back to all projects`);
            // Fallback to all projects if endpoint fails
            const fallbackResponse = await fetch("http://localhost:5000/api/projects");
            if (!fallbackResponse.ok) {
              throw new Error(`Error ${fallbackResponse.status}: Unable to fetch projects`);
            }
            projectData = await fallbackResponse.json();
            // Filter projects where this chef is the project leader
            projectData = projectData.filter(project =>
              project.projectLeader &&
              (project.projectLeader._id === currentUser.id ||
               project.projectLeader._id.toString() === currentUser.id)
            );
          } else {
            projectData = await projectResponse.json();
          }
        } catch (error) {
          console.error("Error fetching chef projects:", error);
          // Fallback to all projects
          const fallbackResponse = await fetch("http://localhost:5000/api/projects");
          if (!fallbackResponse.ok) {
            throw new Error(`Error ${fallbackResponse.status}: Unable to fetch projects`);
          }
          projectData = await fallbackResponse.json();
          // Filter projects where this chef is the project leader
          projectData = projectData.filter(project =>
            project.projectLeader &&
            (project.projectLeader._id === currentUser.id ||
             project.projectLeader._id.toString() === currentUser.id)
          );
        }
      } else {
        // For admin, fetch all projects
        const projectResponse = await fetch("http://localhost:5000/api/projects");
        if (!projectResponse.ok) {
          throw new Error(`Error ${projectResponse.status}: Unable to fetch projects`);
        }
        projectData = await projectResponse.json();
      }

      setProjects(projectData);
      setFilteredProjects(projectData);

    } catch (err) {
      setError(err.message);
      console.error("Error fetching projects:", err);
      setSnackbar({
        open: true,
        message: `Erreur: ${err.message}`,
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch projects and employees
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      setLoading(true);
      try {
        // First fetch projects
        await fetchProjects();

        // Then fetch employees

        // Fetch employees for task assignment
        try {
          // For chef, fetch only their employees
          const employeeUrl = userRole === "projectLeader"
            ? `http://localhost:5000/api/employees/chef/${currentUser.id}`
            : "http://localhost:5000/api/employees";

          console.log("Fetching employees from:", employeeUrl);

          const employeeResponse = await fetch(employeeUrl);
          if (!employeeResponse.ok) {
            console.warn(`Warning: Unable to fetch employees from ${employeeUrl}, falling back to all employees`);
            // Fallback to all employees
            const fallbackResponse = await fetch("http://localhost:5000/api/employees");
            if (!fallbackResponse.ok) {
              throw new Error(`Error ${fallbackResponse.status}: Unable to fetch employees`);
            }
            const allEmployees = await fallbackResponse.json();

            // If chef, filter employees that have this chef as chefId
            if (userRole === "projectLeader") {
              const filteredEmployees = allEmployees.filter(emp =>
                emp.chefId && emp.chefId.toString() === currentUser.id
              );
              console.log("Filtered employees:", filteredEmployees);
              setEmployees(filteredEmployees.length > 0 ? filteredEmployees : allEmployees);
            } else {
              setEmployees(allEmployees);
            }
          } else {
            const employeeData = await employeeResponse.json();
            setEmployees(employeeData);
          }
        } catch (error) {
          console.error("Error fetching employees:", error);
          // Fallback to all employees
          const fallbackResponse = await fetch("http://localhost:5000/api/employees");
          if (!fallbackResponse.ok) {
            throw new Error(`Error ${fallbackResponse.status}: Unable to fetch employees`);
          }
          const employeeData = await fallbackResponse.json();
          setEmployees(employeeData);
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, userRole]);

  // Apply filters when filter state changes
  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterPriority, filterStatus, showMyProjects, tabValue, projects]);

  // Filter projects based on current filters
  const applyFilters = () => {
    let filtered = [...projects];

    // Filter by tab
    if (tabValue === 1) {
      filtered = filtered.filter(p => p.status === "in-progress");
    } else if (tabValue === 2) {
      filtered = filtered.filter(p => p.status === "completed");
    } else if (tabValue === 3) {
      filtered = filtered.filter(p => p.status === "on-hold" || p.status === "planning");
    } else if (tabValue === 4) {
      filtered = filtered.filter(p => p.status === "rejected");
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.projectName.toLowerCase().includes(term) ||
          (p.description && p.description.toLowerCase().includes(term))
      );
    }

    // Filter by priority
    if (filterPriority) {
      filtered = filtered.filter(p => p.priority === filterPriority);
    }

    // Filter by status
    if (filterStatus) {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    // Filter by user's projects
    if (showMyProjects) {
      if (userRole === "projectLeader") {
        filtered = filtered.filter(p => p.projectLeader && p.projectLeader._id === currentUser.id);
      } else if (userRole === "employee") {
        filtered = filtered.filter(p =>
          p.team && p.team.some(member => member._id === currentUser.id)
        );
      }
    }

    setFilteredProjects(filtered);
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Non définie";
    return new Date(dateString).toLocaleDateString();
  };

  // Get status chip based on project status
  const getStatusChip = (status) => {
    let color = "default";
    let label = "Inconnu";

    switch (status) {
      case "planning":
        color = "error";
        label = "En attente";
        break;
      case "in-progress":
        color = "warning";
        label = "En cours";
        break;
      case "completed":
        color = "success";
        label = "Terminé";
        break;
      case "on-hold":
        color = "error";
        label = "En attente";
        break;
      case "rejected":
        color = "default";
        label = "Refusé";
        break;
      default:
        break;
    }

    return <Chip label={label} color={color} size="small" />;
  };

  // CONTEXT MENU HANDLERS
  const handleMenuClick = (event, project) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // EDIT PROJECT HANDLERS
  const handleEditModalOpen = () => {
    if (!selectedProject) return;

    setEditedProject({
      projectName: selectedProject.projectName || "",
      description: selectedProject.description || "",
      deadline: selectedProject.deadline
        ? new Date(selectedProject.deadline).toISOString().split("T")[0]
        : "",
      priority: selectedProject.priority || "",
      status: selectedProject.status || "",
      budget: selectedProject.budget || "",
    });

    setEditOpen(true);
    handleMenuClose();
  };

  const handleEditModalClose = () => {
    setEditOpen(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditedProject((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditSave = async () => {
    if (!editedProject.projectName.trim()) {
      setSnackbar({
        open: true,
        message: "Le nom du projet est obligatoire",
        severity: "error",
      });
      return;
    }

    try {
      const updatedProject = { ...selectedProject, ...editedProject };
      const response = await fetch(
        `http://localhost:5000/api/projects/${selectedProject._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedProject),
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: Modification impossible`);
      }

      const data = await response.json();

      // Update local state
      setProjects((prevProjects) =>
        prevProjects.map((proj) => (proj._id === selectedProject._id ? data : proj))
      );

      setSnackbar({
        open: true,
        message: "Projet modifié avec succès",
        severity: "success",
      });

      handleEditModalClose();
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: "error",
      });
    }
  };

  // PROJECT STATUS MANAGEMENT
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [statusComment, setStatusComment] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [acceptRejectOpen, setAcceptRejectOpen] = useState(false);
  const [acceptRejectAction, setAcceptRejectAction] = useState("");

  const handleStatusUpdateOpen = (status) => {
    if (!selectedProject) return;
    setNewStatus(status);
    setStatusComment("");
    setStatusUpdateOpen(true);
    handleMenuClose();
  };

  const handleStatusUpdateClose = () => {
    setStatusUpdateOpen(false);
  };

  const handleAcceptRejectOpen = (action) => {
    if (!selectedProject) return;
    setAcceptRejectAction(action);
    setStatusComment("");
    setAcceptRejectOpen(true);
    handleMenuClose();
  };

  const handleAcceptRejectClose = () => {
    setAcceptRejectOpen(false);
  };

  const handleAcceptRejectConfirm = async () => {
    // For reject action, require a comment
    if (acceptRejectAction === "reject" && !statusComment.trim()) {
      setSnackbar({
        open: true,
        message: "Veuillez expliquer la raison du refus",
        severity: "error",
      });
      return;
    }

    try {
      // When accepting, change status to in-progress
      // When rejecting, change status to rejected
      const newStatus = acceptRejectAction === "accept" ? "in-progress" : "rejected";

      const updatedProject = {
        ...selectedProject,
        status: newStatus,
      };

      const response = await fetch(
        `http://localhost:5000/api/projects/${selectedProject._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedProject),
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: Mise à jour du statut impossible`);
      }

      const data = await response.json();

      // Add comment
      const commentData = {
        projectId: selectedProject._id,
        userId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        text: statusComment || (acceptRejectAction === "accept"
          ? "Projet accepté et démarré"
          : "Projet refusé"),
        type: "status_change",
        oldStatus: selectedProject.status,
        newStatus: newStatus,
        timestamp: new Date()
      };

      // In a real app, you would save this to the database
      // Here we'll just update the local state
      setProjectComments(prev => [...prev, commentData]);

      // Update local state
      setProjects((prevProjects) =>
        prevProjects.map((proj) => (proj._id === selectedProject._id ? data : proj))
      );

      setSnackbar({
        open: true,
        message: acceptRejectAction === "accept"
          ? "Projet accepté et démarré avec succès"
          : "Projet refusé",
        severity: acceptRejectAction === "accept" ? "success" : "error",
      });

      handleAcceptRejectClose();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: "error",
      });
    }
  };

  const handleStatusUpdateConfirm = async () => {
    try {
      const updatedProject = {
        ...selectedProject,
        status: newStatus,
      };

      const response = await fetch(
        `http://localhost:5000/api/projects/${selectedProject._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedProject),
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: Mise à jour du statut impossible`);
      }

      const data = await response.json();

      // Add comment if provided
      if (statusComment.trim()) {
        const commentData = {
          projectId: selectedProject._id,
          userId: currentUser.id,
          userName: currentUser.name,
          text: statusComment,
          type: "status_change",
          oldStatus: selectedProject.status,
          newStatus: newStatus,
          timestamp: new Date()
        };

        // In a real app, you would save this to the database
        // Here we'll just update the local state
        setProjectComments(prev => [...prev, commentData]);
      }

      // Update local state
      setProjects((prevProjects) =>
        prevProjects.map((proj) => (proj._id === selectedProject._id ? data : proj))
      );

      let statusText = "";
      switch(newStatus) {
        case "in-progress": statusText = "En cours"; break;
        case "on-hold": statusText = "En attente"; break;
        case "planning": statusText = "En attente"; break;
        case "completed": statusText = "Terminé"; break;
        case "rejected": statusText = "Refusé"; break;
        default: statusText = "En attente";
      }

      setSnackbar({
        open: true,
        message: `Statut du projet mis à jour: ${statusText}`,
        severity: "success",
      });

      handleStatusUpdateClose();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: "error",
      });
    }
  };

  // DELETE PROJECT HANDLERS
  const handleDeleteModalOpen = () => {
    setDeleteOpen(true);
    handleMenuClose();
  };

  const handleDeleteModalClose = () => {
    setDeleteOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProject) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/projects/${selectedProject._id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: Suppression impossible`);
      }

      // Update local state
      setProjects((prevProjects) =>
        prevProjects.filter((proj) => proj._id !== selectedProject._id)
      );

      setSnackbar({
        open: true,
        message: "Projet supprimé avec succès",
        severity: "success",
      });

      handleDeleteModalClose();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: "error",
      });
    }
  };

  // MASS SELECTION HANDLERS
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = filteredProjects.map((n) => n._id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleSelectClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  // MASS DELETE HANDLER
  const [massDeleteOpen, setMassDeleteOpen] = useState(false);

  const handleMassDeleteOpen = () => {
    if (selected.length === 0) {
      setSnackbar({
        open: true,
        message: "Veuillez sélectionner au moins un projet",
        severity: "warning",
      });
      return;
    }
    setMassDeleteOpen(true);
  };

  const handleMassDeleteClose = () => {
    setMassDeleteOpen(false);
  };

  const handleMassDeleteConfirm = async () => {
    try {
      // In a real app, you might want to use a batch delete endpoint
      // Here we'll delete them one by one
      const deletePromises = selected.map(id =>
        fetch(`http://localhost:5000/api/projects/${id}`, { method: "DELETE" })
      );

      const results = await Promise.allSettled(deletePromises);

      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
      const failCount = selected.length - successCount;

      // Update local state
      setProjects(prevProjects =>
        prevProjects.filter(proj => !selected.includes(proj._id))
      );

      setSnackbar({
        open: true,
        message: `${successCount} projet(s) supprimé(s) avec succès${failCount > 0 ? `, ${failCount} échec(s)` : ''}`,
        severity: failCount > 0 ? "warning" : "success",
      });

      setSelected([]);
      handleMassDeleteClose();
    } catch (error) {
      console.error("Erreur lors de la suppression en masse:", error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: "error",
      });
    }
  };

  // TEAM MANAGEMENT HANDLERS
  const handleTeamDialogOpen = () => {
    setTeamDialogOpen(true);
    handleMenuClose();

    // If chef, fetch their employees
    if (userRole === "projectLeader" && currentUser) {
      fetchChefEmployees();
    }
  };

  const handleTeamDialogClose = () => {
    setTeamDialogOpen(false);
  };

  // Fetch employees that belong to the chef
  const [chefEmployees, setChefEmployees] = useState([]);
  const [loadingChefEmployees, setLoadingChefEmployees] = useState(false);

  const fetchChefEmployees = async () => {
    if (!currentUser || userRole !== "projectLeader") return;

    setLoadingChefEmployees(true);
    try {
      // Try to fetch employees by chef endpoint
      try {
        const response = await fetch(`http://localhost:5000/api/employees/chef/${currentUser.id}`);
        if (!response.ok) {
          throw new Error(`Error ${response.status}: Unable to fetch chef's employees`);
        }
        const data = await response.json();
        setChefEmployees(data);
      } catch (error) {
        console.warn("Error fetching chef's employees, falling back to filtering all employees:", error);

        // Fallback: fetch all employees and filter
        const allResponse = await fetch(`http://localhost:5000/api/employees`);
        if (!allResponse.ok) {
          throw new Error(`Error ${allResponse.status}: Unable to fetch employees`);
        }

        const allEmployees = await allResponse.json();
        // Filter employees that have this chef as chefId
        const filteredEmployees = allEmployees.filter(emp =>
          emp.chefId && emp.chefId.toString() === currentUser.id
        );

        console.log("Filtered chef employees:", filteredEmployees);
        setChefEmployees(filteredEmployees.length > 0 ? filteredEmployees : allEmployees);
      }
    } catch (error) {
      console.error("Error fetching chef's employees:", error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: "error",
      });
    } finally {
      setLoadingChefEmployees(false);
    }
  };

  const handleTeamUpdate = async (newTeam) => {
    try {
      const updatedProject = {
        ...selectedProject,
        team: newTeam.map(emp => emp._id)
      };

      const response = await fetch(
        `http://localhost:5000/api/projects/${selectedProject._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedProject),
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: Mise à jour de l'équipe impossible`);
      }

      const data = await response.json();

      // Update local state
      setProjects((prevProjects) =>
        prevProjects.map((proj) => (proj._id === selectedProject._id ? data : proj))
      );

      setSnackbar({
        open: true,
        message: "Équipe mise à jour avec succès",
        severity: "success",
      });

      handleTeamDialogClose();
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'équipe:", error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: "error",
      });
    }
  };

  // TASK MANAGEMENT HANDLERS
  const handleTaskDialogOpen = () => {
    setTaskForm({
      title: "",
      description: "",
      assignedTo: "",
      deadline: "",
      priority: "medium",
    });
    setTaskDialogOpen(true);
    handleMenuClose();
  };

  const handleTaskDialogClose = () => {
    setTaskDialogOpen(false);
  };

  const handleTaskChange = (e) => {
    const { name, value } = e.target;
    setTaskForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTaskSubmit = async () => {
    if (!taskForm.title.trim()) {
      setSnackbar({
        open: true,
        message: "Le titre de la tâche est obligatoire",
        severity: "error",
      });
      return;
    }

    try {
      const newTask = {
        ...taskForm,
        projectId: selectedProject._id,
      };

      const response = await fetch("http://localhost:5000/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: Création de tâche impossible`);
      }

      const data = await response.json();

      // Update project with new task reference
      const updatedProject = {
        ...selectedProject,
        tasks: [...(selectedProject.tasks || []), data._id],
      };

      await fetch(`http://localhost:5000/api/projects/${selectedProject._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProject),
      });

      // Update local state
      setProjects((prevProjects) =>
        prevProjects.map((proj) =>
          proj._id === selectedProject._id
            ? { ...proj, tasks: [...(proj.tasks || []), data] }
            : proj
        )
      );

      setSnackbar({
        open: true,
        message: "Tâche créée avec succès",
        severity: "success",
      });

      handleTaskDialogClose();
    } catch (error) {
      console.error("Erreur lors de la création de la tâche:", error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: "error",
      });
    }
  };

  // EXPORT TO PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("Liste des Projets", 14, 22);
    doc.setFontSize(11);
    doc.text(`Généré le ${new Date().toLocaleDateString()}`, 14, 30);

    // Table data
    const tableColumn = ["Nom du projet", "Responsable", "Statut", "Priorité", "Échéance", "Progression"];
    const tableRows = filteredProjects.map((project) => [
      project.projectName,
      project.projectLeader ? project.projectLeader.name : "Non assigné",
      project.status || "Non défini",
      project.priority || "Non défini",
      formatDate(project.deadline),
      `${project.progress || 0}%`,
    ]);

    // Generate table
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    // Save document
    doc.save("projets.pdf");
    handleMenuClose();
  };

  // NAVIGATION HANDLERS
  const handleProjectClick = (project) => {
    setSelectedProjectDetail(project);
    setDetailDrawerOpen(true);
  };

  const handleCreateProject = () => {
    navigate("/projects/new");
  };

  // PROJECT DETAIL HANDLERS
  const handleDetailDrawerClose = () => {
    setDetailDrawerOpen(false);
  };

  // FILE UPLOAD HANDLERS
  const [fileUploadProject, setFileUploadProject] = useState(null);

  const handleFileUploadOpen = (project) => {
    setFileUploadProject(project);
    setFileUploadOpen(true);
    handleMenuClose();
  };

  const handleFileUploadClose = () => {
    setFileUploadOpen(false);
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0 || !fileUploadProject) return;

    try {
      // Show loading state
      setSnackbar({
        open: true,
        message: "Téléchargement des fichiers en cours...",
        severity: "info"
      });

      // Create FormData object
      const formData = new FormData();

      // Add all files to the form data
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      // Add user info
      formData.append('userId', currentUser.id);
      formData.append('userName', `${currentUser.firstName} ${currentUser.lastName}`);

      console.log("Uploading files to project:", fileUploadProject._id);
      console.log("Files:", Array.from(files).map(f => f.name));

      // Send the files to the server using the existing projects route
      const response = await fetch(
        `http://localhost:5000/api/projects/${fileUploadProject._id}/documents`,
        {
          method: "POST",
          body: formData,
          // Don't set Content-Type header when using FormData
          // The browser will set it automatically with the correct boundary
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload error response:", errorText);
        throw new Error(`Error ${response.status}: ${errorText || "Unable to upload files"}`);
      }

      const data = await response.json();
      console.log("Upload success response:", data);

      // Refresh project data to get the updated documents
      try {
        await fetchProjects();
      } catch (error) {
        console.error("Error refreshing projects after file upload:", error);
        // Continue execution even if refresh fails
      }

      setSnackbar({
        open: true,
        message: `${files.length} fichier(s) ajouté(s) avec succès`,
        severity: "success"
      });

      // Reset and close dialog
      handleFileUploadClose();
    } catch (error) {
      console.error("Erreur lors du téléchargement des fichiers:", error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: "error"
      });
    }
  };

  // Get project files
  const getProjectFiles = (projectId) => {
    if (!projectId) return [];

    // First check if the project has documents in its data
    const project = projects.find(p => p._id === projectId);
    if (project && project.documents && project.documents.length > 0) {
      return project.documents;
    }

    // Fallback to uploadedFiles if no documents in project data
    return uploadedFiles.filter(file => file.projectId === projectId);
  };

  // Get project comments
  const getProjectComments = (projectId) => {
    if (!projectId) return [];

    // Find the project by ID
    const project = projects.find(p => p._id === projectId);

    // Return the comments array or an empty array if no comments exist
    return project && project.comments ? project.comments : [];
  };

  // Comment handlers
  const handleCommentDialogOpen = () => {
    setNewComment("");
    setCommentDialogOpen(true);
  };

  const handleCommentDialogClose = () => {
    setCommentDialogOpen(false);
  };

  // Handle adding a comment
  const handleAddComment = async () => {
    if (!selectedProjectDetail || !newComment.trim()) return;

    try {
      // Show loading state
      setSnackbar({
        open: true,
        message: "Ajout du commentaire en cours...",
        severity: "info"
      });

      console.log("Adding comment to project:", selectedProjectDetail._id);

      // Create a new comment object
      const commentData = {
        text: newComment.trim(),
        author: currentUser.id, // Use author for backward compatibility
        authorName: `${currentUser.firstName} ${currentUser.lastName}`, // Use authorName for backward compatibility
        userId: currentUser.id, // Also include userId for newer implementations
        userName: `${currentUser.firstName} ${currentUser.lastName}`, // Also include userName for newer implementations
        type: "general"
      };

      console.log("Comment data:", commentData);

      // Send the comment to the server using the existing projects route
      const response = await fetch(
        `http://localhost:5000/api/projects/${selectedProjectDetail._id}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(commentData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Comment error response:", errorText);
        throw new Error(`Error ${response.status}: ${errorText || "Unable to add comment"}`);
      }

      const data = await response.json();
      console.log("Comment success response:", data);

      // Refresh project data to get the updated comments
      try {
        await fetchProjects();
      } catch (error) {
        console.error("Error refreshing projects after adding comment:", error);
        // Continue execution even if refresh fails
      }

      setSnackbar({
        open: true,
        message: "Commentaire ajouté avec succès",
        severity: "success"
      });

      // Reset form and close dialog
      setNewComment("");
      setCommentDialogOpen(false);

    } catch (error) {
      console.error("Erreur lors de l'ajout du commentaire:", error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: "error"
      });
    }
  };

  // SNACKBAR HANDLER
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  // RENDER METHODS
  const renderProjectContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", padding: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ margin: 2 }}>
          {error}
        </Alert>
      );
    }

    if (filteredProjects.length === 0) {
      return (
        <Box sx={{ textAlign: "center", padding: 4 }}>
          <Typography variant="h6" color="textSecondary">
            Aucun projet trouvé
          </Typography>
          {userRole === "admin" && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={handleCreateProject}
              sx={{ marginTop: 2 }}
            >
              Créer un projet
            </Button>
          )}
        </Box>
      );
    }

    return viewMode === "grid" ? renderGridView() : renderTableView();
  };

  // Grid view (cards)
  const renderGridView = () => {
    return (
      <Grid container spacing={3} sx={{ padding: 2 }}>
        {filteredProjects.map((project) => (
          <Grid item xs={12} sm={6} md={4} key={project._id}>
            <Card
              sx={{
                height: "100%",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 6
                }
              }}
            >
              <CardHeader
                avatar={
                  <Avatar sx={{
                    bgcolor: project.priority === "high"
                      ? "error.main"
                      : project.priority === "medium"
                        ? "warning.main"
                        : "success.main"
                  }}>
                    <Assignment />
                  </Avatar>
                }
                action={
                  <IconButton
                    aria-label="project-menu"
                    onClick={(e) => handleMenuClick(e, project)}
                  >
                    <MoreVert />
                  </IconButton>
                }
                title={
                  <Tooltip title="Voir les détails du projet">
                    <Typography
                      variant="h6"
                      sx={{
                        cursor: "pointer",
                        "&:hover": { textDecoration: "underline" },
                      }}
                      onClick={() => handleProjectClick(project)}
                    >
                      {project.projectName}
                    </Typography>
                  </Tooltip>
                }
                subheader={`Créé le ${formatDate(project.createdAt)}`}
              />
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Statut:
                  </Typography>
                  {getStatusChip(project.status)}
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Priorité:
                  </Typography>
                  <Chip
                    size="small"
                    label={
                      project.priority === "high"
                        ? "Haute"
                        : project.priority === "medium"
                        ? "Moyenne"
                        : "Basse"
                    }
                    color={
                      project.priority === "high"
                        ? "error"
                        : project.priority === "medium"
                        ? "warning"
                        : "success"
                    }
                  />
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Échéance:
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(project.deadline)}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Responsable:
                  </Typography>
                  <Typography variant="body2">
                    {project.projectLeader ?
                      `${project.projectLeader.firstName} ${project.projectLeader.lastName}` :
                      "Non assigné"}
                  </Typography>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Progression:
                    </Typography>
                    <Typography variant="body2">{project.completionPercentage || 0}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={project.completionPercentage || 0}
                    color={
                      project.completionPercentage >= 75
                        ? "success"
                        : project.completionPercentage >= 25
                        ? "warning"
                        : "error"
                    }
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
                  <Tooltip title="Membres de l'équipe">
                    <Badge
                      badgeContent={project.team ? project.team.length : 0}
                      color="primary"
                      sx={{ mr: 1 }}
                    >
                      <Group color="action" />
                    </Badge>
                  </Tooltip>

                  <Tooltip title="Fichiers">
                    <Badge
                      badgeContent={getProjectFiles(project._id).length}
                      color="secondary"
                    >
                      <AttachFile color="action" />
                    </Badge>
                  </Tooltip>

                  <Tooltip title="Commentaires">
                    <Badge
                      badgeContent={getProjectComments(project._id).length}
                      color="info"
                    >
                      <Comment color="action" />
                    </Badge>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Table view with checkboxes
  const renderTableView = () => {
    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredProjects.length) : 0;

    return (
      <Paper
        elevation={2}
        sx={{
          width: '100%',
          mb: 2,
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}
      >
        <Toolbar
          sx={{
            pl: { sm: 2 },
            pr: { xs: 1, sm: 1 },
            py: 2,
            ...(selected.length > 0 && {
              bgcolor: (theme) =>
                alpha(theme.palette.primary.main, 0.1),
              borderBottom: '1px solid',
              borderColor: 'divider'
            }),
          }}
        >
          {selected.length > 0 ? (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              flex: '1 1 100%'
            }}>
              <Checkbox
                color="primary"
                indeterminate={selected.length > 0 && selected.length < filteredProjects.length}
                checked={filteredProjects.length > 0 && selected.length === filteredProjects.length}
                onChange={handleSelectAllClick}
                sx={{ mr: 1 }}
              />
              <Typography
                color="inherit"
                variant="subtitle1"
                component="div"
                fontWeight="medium"
              >
                {selected.length} projet(s) sélectionné(s)
              </Typography>
            </Box>
          ) : (
            <Typography
              sx={{
                flex: '1 1 100%',
                display: 'flex',
                alignItems: 'center'
              }}
              variant="h6"
              id="tableTitle"
              component="div"
              fontWeight="bold"
            >
              <ViewList sx={{ mr: 1 }} />
              Liste des projets
              <Chip
                label={filteredProjects.length}
                size="small"
                color="primary"
                sx={{ ml: 1 }}
              />
            </Typography>
          )}

          {selected.length > 0 ? (
            <Box>
              <Tooltip title="Supprimer les projets sélectionnés">
                <Button
                  color="error"
                  startIcon={<DeleteSweep />}
                  onClick={handleMassDeleteOpen}
                  variant="contained"
                  sx={{
                    mr: 1,
                    borderRadius: 2,
                    boxShadow: 2
                  }}
                >
                  Supprimer
                </Button>
              </Tooltip>
              <Tooltip title="Annuler la sélection">
                <IconButton onClick={() => setSelected([])}>
                  <Close />
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            <Box>
              <Tooltip title="Rafraîchir la liste">
                <IconButton
                  onClick={() => {
                    fetchProjects().then(() => {
                      setSnackbar({
                        open: true,
                        message: "Projets mis à jour avec succès",
                        severity: "success"
                      });
                    });
                  }}
                  sx={{ mr: 1 }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Tooltip title="Exporter en PDF">
                <IconButton onClick={handleExportPDF} sx={{ mr: 1 }}>
                  <PictureAsPdf />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Toolbar>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
          <Table stickyHeader aria-labelledby="tableTitle" size="medium">
            <TableHead>
              <TableRow sx={{
                '& th': {
                  fontWeight: 'bold',
                  bgcolor: theme => alpha(theme.palette.primary.main, 0.08),
                  borderBottom: '2px solid',
                  borderColor: 'primary.main'
                }
              }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={selected.length > 0 && selected.length < filteredProjects.length}
                    checked={filteredProjects.length > 0 && selected.length === filteredProjects.length}
                    onChange={handleSelectAllClick}
                    inputProps={{
                      'aria-label': 'select all projects',
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Assignment sx={{ mr: 1, color: 'primary.main' }} fontSize="small" />
                    Projet
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Person sx={{ mr: 1, color: 'primary.main' }} fontSize="small" />
                    Chef
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Schedule sx={{ mr: 1, color: 'primary.main' }} fontSize="small" />
                    Statut
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Flag sx={{ mr: 1, color: 'primary.main' }} fontSize="small" />
                    Priorité
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarToday sx={{ mr: 1, color: 'primary.main' }} fontSize="small" />
                    Échéance
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <InsertChart sx={{ mr: 1, color: 'primary.main' }} fontSize="small" />
                    Progression
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MoreHoriz sx={{ mr: 1, color: 'primary.main' }} fontSize="small" />
                    Actions
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProjects
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((project, index) => {
                  const isItemSelected = isSelected(project._id);
                  const labelId = `enhanced-table-checkbox-${index}`;

                  return (
                    <TableRow
                      hover
                      onClick={(event) => handleSelectClick(event, project._id)}
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={project._id}
                      selected={isItemSelected}
                      sx={{
                        cursor: 'pointer',
                        '&.Mui-selected': {
                          backgroundColor: theme => alpha(theme.palette.primary.main, 0.08),
                        },
                        '&.Mui-selected:hover': {
                          backgroundColor: theme => alpha(theme.palette.primary.main, 0.12),
                        },
                        '&:nth-of-type(odd)': {
                          backgroundColor: theme => alpha(theme.palette.background.default, 0.5),
                        },
                        borderLeft: project.priority === "high"
                          ? '4px solid #f44336'
                          : project.priority === "medium"
                            ? '4px solid #ff9800'
                            : '4px solid #4caf50'
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={isItemSelected}
                          inputProps={{
                            'aria-labelledby': labelId,
                          }}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => handleSelectClick(event, project._id)}
                        />
                      </TableCell>
                      <TableCell
                        component="th"
                        id={labelId}
                        scope="row"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProjectClick(project);
                        }}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            color: 'primary.main',
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            sx={{
                              bgcolor: project.priority === "high"
                                ? "error.main"
                                : project.priority === "medium"
                                  ? "warning.main"
                                  : "success.main",
                              width: 40,
                              height: 40,
                              mr: 2,
                              boxShadow: 1
                            }}
                          >
                            <Assignment fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              {project.projectName}
                            </Typography>
                            {project.description && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  maxWidth: 300,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {project.description}
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', mt: 0.5 }}>
                              <Tooltip title="Membres de l'équipe">
                                <Chip
                                  size="small"
                                  icon={<Group fontSize="small" />}
                                  label={project.team?.length || 0}
                                  variant="outlined"
                                  sx={{ mr: 1, height: 20 }}
                                />
                              </Tooltip>
                              <Tooltip title="Documents">
                                <Chip
                                  size="small"
                                  icon={<AttachFile fontSize="small" />}
                                  label={getProjectFiles(project._id).length}
                                  variant="outlined"
                                  sx={{ mr: 1, height: 20 }}
                                />
                              </Tooltip>
                            </Box>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {project.projectLeader ? (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                              src={project.projectLeader.photo ? `/${project.projectLeader.photo.split(/(\\|\/)/g).pop()}` : undefined}
                              sx={{
                                width: 32,
                                height: 32,
                                mr: 1,
                                boxShadow: 1
                              }}
                            >
                              {project.projectLeader && project.projectLeader.firstName ? project.projectLeader.firstName.charAt(0) : ''}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {project.projectLeader && project.projectLeader.firstName ?
                                  `${project.projectLeader.firstName} ${project.projectLeader.lastName || ''}` :
                                  "Chef de projet"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {project.projectLeader ?
                                  (project.projectLeader.position || project.projectLeader.department || "Chef de projet") :
                                  ""}
                              </Typography>
                            </Box>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'grey.300' }}>
                              <Person fontSize="small" />
                            </Avatar>
                            <Typography variant="body2" color="text.secondary">
                              Non assigné
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          {getStatusChip(project.status)}
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                            Mis à jour: {new Date(project.updatedAt || project.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Chip
                            size="small"
                            label={
                              project.priority === "high"
                                ? "Haute"
                                : project.priority === "medium"
                                ? "Moyenne"
                                : "Basse"
                            }
                            color={
                              project.priority === "high"
                                ? "error"
                                : project.priority === "medium"
                                ? "warning"
                                : "success"
                            }
                            sx={{ fontWeight: 'medium' }}
                          />
                          {project.budget && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                              Budget: {project.budget} €
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography
                            variant="body2"
                            fontWeight="medium"
                            color={new Date(project.deadline) < new Date() ? 'error.main' : 'text.primary'}
                          >
                            {formatDate(project.deadline)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                            Créé le: {formatDate(project.createdAt)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: 150 }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={project.completionPercentage || 0}
                              color={
                                project.completionPercentage >= 75
                                  ? "success"
                                  : project.completionPercentage >= 25
                                  ? "warning"
                                  : "error"
                              }
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                          <Box sx={{ minWidth: 35 }}>
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              color={
                                project.completionPercentage >= 75
                                  ? "success.main"
                                  : project.completionPercentage >= 25
                                  ? "warning.main"
                                  : "error.main"
                              }
                            >
                              {project.completionPercentage || 0}%
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Tooltip title="Voir les détails">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProjectClick(project);
                              }}
                              sx={{ mr: 1 }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Plus d'options">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMenuClick(e, project);
                              }}
                            >
                              <MoreVert fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={8} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
              {selected.length > 0 ? (
                <span>{selected.length} projet(s) sélectionné(s) sur {filteredProjects.length}</span>
              ) : (
                <span>Total: {filteredProjects.length} projet(s)</span>
              )}
            </Typography>

            <FormControl variant="outlined" size="small" sx={{ minWidth: 120, mr: 2 }}>
              <InputLabel id="rows-per-page-label">Afficher</InputLabel>
              <Select
                labelId="rows-per-page-label"
                value={rowsPerPage}
                onChange={(event) => {
                  setRowsPerPage(parseInt(event.target.value, 10));
                  setPage(0);
                }}
                label="Afficher"
              >
                <MenuItem value={5}>5 lignes</MenuItem>
                <MenuItem value={10}>10 lignes</MenuItem>
                <MenuItem value={25}>25 lignes</MenuItem>
                <MenuItem value={50}>50 lignes</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TablePagination
            rowsPerPageOptions={[]}
            component="div"
            count={filteredProjects.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
            sx={{
              '.MuiTablePagination-toolbar': {
                pl: 0,
              },
              '.MuiTablePagination-displayedRows': {
                fontWeight: 'medium',
              },
              '.MuiTablePagination-selectLabel': {
                display: 'none',
              },
              '.MuiTablePagination-select': {
                display: 'none',
              },
              '.MuiTablePagination-selectIcon': {
                display: 'none',
              },
            }}
          />
        </Box>
      </Paper>
    );
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ padding: 2 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link
            underline="hover"
            color="inherit"
            href="/"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <Home sx={{ mr: 0.5 }} fontSize="small" />
            Accueil
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            <Assignment sx={{ mr: 0.5 }} fontSize="small" />
            Gestion des Projets
          </Typography>
        </Breadcrumbs>

        <Paper
          elevation={3}
          sx={{
            padding: 3,
            mb: 3,
            borderRadius: 2,
            background: 'linear-gradient(to right, #f5f7fa, #ffffff)'
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 'bold',
                color: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Assignment sx={{ mr: 1, fontSize: 32 }} />
              Gestion des Projets
            </Typography>

            <Box>
              <Tooltip title="Changer de vue">
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
                  startIcon={viewMode === "grid" ? <ViewList /> : <ViewModule />}
                  sx={{ mr: 2 }}
                >
                  {viewMode === "grid" ? "Vue tableau" : "Vue grille"}
                </Button>
              </Tooltip>

              {userRole === "admin" && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Add />}
                  onClick={handleCreateProject}
                  sx={{ mr: 2 }}
                >
                  Nouveau Projet
                </Button>
              )}

              <Button
                variant="outlined"
                startIcon={<PictureAsPdf />}
                onClick={handleExportPDF}
              >
                Exporter PDF
              </Button>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <TextField
              label="Rechercher"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flexGrow: 1, minWidth: 200 }}
              InputProps={{
                startAdornment: <Search color="action" sx={{ mr: 1 }} />,
                endAdornment: searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchTerm("")}
                      edge="end"
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />

            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Priorité</InputLabel>
              <Select
                label="Priorité"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                startAdornment={<Flag sx={{ mr: 1, ml: -0.5 }} fontSize="small" />}
              >
                <MenuItem value="">Toutes</MenuItem>
                <MenuItem value="high">
                  <Chip size="small" color="error" label="Haute" sx={{ mr: 1 }} />
                  Haute
                </MenuItem>
                <MenuItem value="medium">
                  <Chip size="small" color="warning" label="Moyenne" sx={{ mr: 1 }} />
                  Moyenne
                </MenuItem>
                <MenuItem value="low">
                  <Chip size="small" color="success" label="Basse" sx={{ mr: 1 }} />
                  Basse
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Statut</InputLabel>
              <Select
                label="Statut"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                startAdornment={<Schedule sx={{ mr: 1, ml: -0.5 }} fontSize="small" />}
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="planning">Planification</MenuItem>
                <MenuItem value="in-progress">En cours</MenuItem>
                <MenuItem value="completed">Terminé</MenuItem>
                <MenuItem value="on-hold">En attente</MenuItem>
              </Select>
            </FormControl>


          </Box>

          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTabs-indicator': {
                  height: 3,
                },
                '& .MuiTab-root': {
                  minHeight: 64,
                  fontWeight: 'medium',
                  fontSize: '0.95rem',
                  px: 3
                }
              }}
            >
              <Tab
                label={
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Assignment sx={{ mr: 1 }} />
                    Tous les projets
                    <Chip
                      label={projects.length}
                      size="small"
                      color="default"
                      sx={{ ml: 1, height: 20, minWidth: 20 }}
                    />
                  </Box>
                }
              />
              <Tab
                label={
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <PlayArrow sx={{ mr: 1 }} />
                    En cours
                    <Chip
                      label={projects.filter(p => p.status === "in-progress").length}
                      size="small"
                      color="warning"
                      sx={{ ml: 1, height: 20, minWidth: 20 }}
                    />
                  </Box>
                }
              />
              <Tab
                label={
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <CheckCircle sx={{ mr: 1 }} />
                    Terminés
                    <Chip
                      label={projects.filter(p => p.status === "completed").length}
                      size="small"
                      color="success"
                      sx={{ ml: 1, height: 20, minWidth: 20 }}
                    />
                  </Box>
                }
              />
              <Tab
                label={
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Pause sx={{ mr: 1 }} />
                    En attente
                    <Chip
                      label={projects.filter(p => p.status === "on-hold" || p.status === "planning").length}
                      size="small"
                      color="error"
                      sx={{ ml: 1, height: 20, minWidth: 20 }}
                    />
                  </Box>
                }
              />
              <Tab
                label={
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Block sx={{ mr: 1 }} />
                    Refusés
                    <Chip
                      label={projects.filter(p => p.status === "rejected").length}
                      size="small"
                      color="default"
                      sx={{ ml: 1, height: 20, minWidth: 20 }}
                    />
                  </Box>
                }
              />
            </Tabs>
          </Paper>
        </Paper>

        {renderProjectContent()}
      </Box>

      {/* Project Menu */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: 200,
            borderRadius: 2,
            mt: 1
          }
        }}
      >
        <MenuItem
          onClick={() => {
            handleProjectClick(selectedProject);
            handleMenuClose();
          }}
          sx={{
            py: 1.5,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1)
            }
          }}
        >
          <ListItemIcon>
            <Visibility fontSize="small" color="primary" />
          </ListItemIcon>
          Voir les détails
        </MenuItem>

        {/* Accept/Reject options for project leader with planning status */}
        {(userRole === "projectLeader" &&
          selectedProject?.projectLeader &&
          (selectedProject?.projectLeader?._id === currentUser.id ||
           selectedProject?.projectLeader?._id?.toString() === currentUser.id) &&
          selectedProject?.status === "planning") && (
          <>
            <Divider textAlign="left" sx={{ my: 1 }}>Actions requises</Divider>

            <MenuItem
              onClick={() => handleAcceptRejectOpen("accept")}
              sx={{ py: 1.5 }}
            >
              <ListItemIcon>
                <CheckCircle fontSize="small" color="success" />
              </ListItemIcon>
              Accepter et démarrer le projet
            </MenuItem>

            <MenuItem
              onClick={() => handleAcceptRejectOpen("reject")}
              sx={{ py: 1.5 }}
            >
              <ListItemIcon>
                <Close fontSize="small" color="error" />
              </ListItemIcon>
              Refuser le projet
            </MenuItem>
          </>
        )}

        {/* Status change options for project leader */}
        {(userRole === "projectLeader" &&
          selectedProject?.projectLeader &&
          (selectedProject?.projectLeader?._id === currentUser.id ||
           selectedProject?.projectLeader?._id?.toString() === currentUser.id) &&
          selectedProject?.status !== "planning") && (
          <>
            <Divider textAlign="left" sx={{ my: 1 }}>Changer le statut</Divider>

            {selectedProject?.status !== "in-progress" && (
              <MenuItem
                onClick={() => handleStatusUpdateOpen("in-progress")}
                sx={{ py: 1.5 }}
              >
                <ListItemIcon>
                  <PlayArrow fontSize="small" color="warning" />
                </ListItemIcon>
                Démarrer le projet
              </MenuItem>
            )}

            {selectedProject?.status !== "on-hold" && (
              <MenuItem
                onClick={() => handleStatusUpdateOpen("on-hold")}
                sx={{ py: 1.5 }}
              >
                <ListItemIcon>
                  <Pause fontSize="small" color="error" />
                </ListItemIcon>
                Mettre en attente
              </MenuItem>
            )}

            {selectedProject?.status !== "completed" && (
              <MenuItem
                onClick={() => handleStatusUpdateOpen("completed")}
                sx={{ py: 1.5 }}
              >
                <ListItemIcon>
                  <Done fontSize="small" color="success" />
                </ListItemIcon>
                Marquer comme terminé
              </MenuItem>
            )}

            <MenuItem
              onClick={() => handleFileUploadOpen(selectedProject)}
              sx={{ py: 1.5 }}
            >
              <ListItemIcon>
                <CloudUpload fontSize="small" color="info" />
              </ListItemIcon>
              Ajouter des fichiers
            </MenuItem>
          </>
        )}

        {/* Admin options */}
        {(userRole === "admin" || (userRole === "projectLeader" && selectedProject?.projectLeader?._id === currentUser.id)) && (
          <>
            <Divider textAlign="left" sx={{ my: 1 }}>Administration</Divider>

            <MenuItem
              onClick={handleEditModalOpen}
              sx={{ py: 1.5 }}
            >
              <ListItemIcon>
                <Edit fontSize="small" color="primary" />
              </ListItemIcon>
              Modifier
            </MenuItem>

            <MenuItem
              onClick={handleTeamDialogOpen}
              sx={{ py: 1.5 }}
            >
              <ListItemIcon>
                <Group fontSize="small" color="primary" />
              </ListItemIcon>
              Gérer l'équipe
            </MenuItem>

            <MenuItem
              onClick={handleTaskDialogOpen}
              sx={{ py: 1.5 }}
            >
              <ListItemIcon>
                <AddTask fontSize="small" color="primary" />
              </ListItemIcon>
              Ajouter une tâche
            </MenuItem>

            <Divider />

            <MenuItem
              onClick={handleDeleteModalOpen}
              sx={{
                color: "error.main",
                py: 1.5,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.error.main, 0.1)
                }
              }}
            >
              <ListItemIcon>
                <Delete fontSize="small" color="error" />
              </ListItemIcon>
              Supprimer
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Edit Project Modal */}
      <Dialog open={editOpen} onClose={handleEditModalClose} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier le projet</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="projectName"
            label="Nom du projet"
            type="text"
            fullWidth
            variant="outlined"
            value={editedProject.projectName}
            onChange={handleEditChange}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            name="description"
            label="Description"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            value={editedProject.description}
            onChange={handleEditChange}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            name="deadline"
            label="Échéance"
            type="date"
            fullWidth
            variant="outlined"
            value={editedProject.deadline}
            onChange={handleEditChange}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            name="budget"
            label="Budget (€)"
            type="number"
            fullWidth
            variant="outlined"
            value={editedProject.budget}
            onChange={handleEditChange}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Priorité</InputLabel>
            <Select
              name="priority"
              value={editedProject.priority}
              label="Priorité"
              onChange={handleEditChange}
            >
              <MenuItem value="high">Haute</MenuItem>
              <MenuItem value="medium">Moyenne</MenuItem>
              <MenuItem value="low">Basse</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Statut</InputLabel>
            <Select
              name="status"
              value={editedProject.status}
              label="Statut"
              onChange={handleEditChange}
            >
              <MenuItem value="planning">Planification</MenuItem>
              <MenuItem value="in-progress">En cours</MenuItem>
              <MenuItem value="completed">Terminé</MenuItem>
              <MenuItem value="on-hold">En attente</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditModalClose}>Annuler</Button>
          <Button onClick={handleEditSave} variant="contained" color="primary">
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={handleDeleteModalClose}>
        <DialogTitle>Confirmation de suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le projet "{selectedProject?.projectName}" ?
            Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteModalClose}>Annuler</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Team Management Dialog */}
      <Dialog
        open={teamDialogOpen}
        onClose={handleTeamDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Gestion de l'équipe du projet</Typography>
            {loadingChefEmployees && <CircularProgress size={24} />}
          </Box>
        </DialogTitle>
        <DialogContent>
          {userRole === "projectLeader" ? (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Sélectionnez les membres de votre équipe à assigner à ce projet
              </Typography>

              {chefEmployees.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Vous n'avez pas encore d'employés assignés à votre équipe.
                </Alert>
              ) : (
                <List>
                  {chefEmployees.map((employee) => (
                    <ListItem key={employee._id} sx={{
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                    }}>
                      <ListItemAvatar>
                        <Avatar src={employee.photo ? `/${employee.photo.split(/(\\|\/)/g).pop()}` : undefined}>
                          {employee.firstName?.charAt(0) || <Person />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${employee.firstName} ${employee.lastName}`}
                        secondary={employee.position || employee.department || "Employé"}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={
                              selectedProject?.team?.some(
                                (member) => member._id === employee._id
                              ) || false
                            }
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              const currentTeam = selectedProject?.team || [];

                              let newTeam;
                              if (isChecked) {
                                // Make sure we have all the employee data
                                const employeeData = {
                                  _id: employee._id,
                                  firstName: employee.firstName,
                                  lastName: employee.lastName,
                                  photo: employee.photo,
                                  position: employee.position,
                                  department: employee.department,
                                  role: employee.role
                                };
                                newTeam = [...currentTeam, employeeData];
                              } else {
                                newTeam = currentTeam.filter(
                                  (member) => member._id !== employee._id
                                );
                              }

                              setSelectedProject({
                                ...selectedProject,
                                team: newTeam,
                              });
                            }}
                            color="primary"
                          />
                        }
                        label=""
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </>
          ) : (
            // For admin users, show all employees
            <List>
              {employees.map((employee) => (
                <ListItem key={employee._id} sx={{
                  borderRadius: 1,
                  mb: 1,
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                }}>
                  <ListItemAvatar>
                    <Avatar src={employee.photo ? `/${employee.photo.split(/(\\|\/)/g).pop()}` : undefined}>
                      {employee.firstName?.charAt(0) || <Person />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${employee.firstName} ${employee.lastName}`}
                    secondary={employee.position || employee.department || "Employé"}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={
                          selectedProject?.team?.some(
                            (member) => member._id === employee._id
                          ) || false
                        }
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          const currentTeam = selectedProject?.team || [];

                          let newTeam;
                          if (isChecked) {
                            // Make sure we have all the employee data
                            const employeeData = {
                              _id: employee._id,
                              firstName: employee.firstName,
                              lastName: employee.lastName,
                              photo: employee.photo,
                              position: employee.position,
                              department: employee.department,
                              role: employee.role
                            };
                            newTeam = [...currentTeam, employeeData];
                          } else {
                            newTeam = currentTeam.filter(
                              (member) => member._id !== employee._id
                            );
                          }

                          setSelectedProject({
                            ...selectedProject,
                            team: newTeam,
                          });
                        }}
                        color="primary"
                      />
                    }
                    label=""
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTeamDialogClose}>Annuler</Button>
          <Button
            onClick={() => handleTeamUpdate(selectedProject?.team || [])}
            variant="contained"
            color="primary"
            startIcon={<Group />}
          >
            Enregistrer l'équipe
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog
        open={taskDialogOpen}
        onClose={handleTaskDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Ajouter une nouvelle tâche</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="title"
            label="Titre de la tâche"
            type="text"
            fullWidth
            variant="outlined"
            value={taskForm.title}
            onChange={handleTaskChange}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            name="description"
            label="Description"
            multiline
            rows={3}
            fullWidth
            variant="outlined"
            value={taskForm.description}
            onChange={handleTaskChange}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Assigner à</InputLabel>
            <Select
              name="assignedTo"
              value={taskForm.assignedTo}
              label="Assigner à"
              onChange={handleTaskChange}
            >
              <MenuItem value="">Non assigné</MenuItem>
              {selectedProject?.team?.map((member) => (
                <MenuItem key={member._id} value={member._id}>
                  {member.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            margin="dense"
            name="deadline"
            label="Échéance"
            type="date"
            fullWidth
            variant="outlined"
            value={taskForm.deadline}
            onChange={handleTaskChange}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth>
            <InputLabel>Priorité</InputLabel>
            <Select
              name="priority"
              value={taskForm.priority}
              label="Priorité"
              onChange={handleTaskChange}
            >
              <MenuItem value="high">Haute</MenuItem>
              <MenuItem value="medium">Moyenne</MenuItem>
              <MenuItem value="low">Basse</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTaskDialogClose}>Annuler</Button>
          <Button
            onClick={handleTaskSubmit}
            variant="contained"
            color="primary"
            startIcon={<AddTask />}
          >
            Ajouter la tâche
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusUpdateOpen} onClose={handleStatusUpdateClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Changer le statut du projet
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Vous êtes sur le point de changer le statut du projet "{selectedProject?.projectName}" vers{" "}
            <Chip
              label={
                newStatus === "in-progress"
                  ? "En cours"
                  : newStatus === "on-hold"
                    ? "En attente"
                    : "Terminé"
              }
              color={
                newStatus === "in-progress"
                  ? "warning"
                  : newStatus === "on-hold"
                    ? "error"
                    : "success"
              }
              size="small"
            />.
          </Typography>

          <TextField
            margin="dense"
            label="Commentaire (optionnel)"
            fullWidth
            multiline
            rows={3}
            value={statusComment}
            onChange={(e) => setStatusComment(e.target.value)}
            variant="outlined"
            placeholder="Ajoutez un commentaire expliquant ce changement de statut..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStatusUpdateClose}>Annuler</Button>
          <Button
            onClick={handleStatusUpdateConfirm}
            variant="contained"
            color={
              newStatus === "in-progress"
                ? "warning"
                : newStatus === "on-hold"
                  ? "error"
                  : "success"
            }
            startIcon={
              newStatus === "in-progress"
                ? <PlayArrow />
                : newStatus === "on-hold"
                  ? <Pause />
                  : <Done />
            }
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Accept/Reject Dialog */}
      <Dialog open={acceptRejectOpen} onClose={handleAcceptRejectClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {acceptRejectAction === "accept" ? "Accepter le projet" : "Refuser le projet"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {selectedProject?.projectName}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CalendarToday fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                Échéance: {formatDate(selectedProject?.deadline)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Flag fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                Priorité: {' '}
                <Chip
                  size="small"
                  label={
                    selectedProject?.priority === "high" ? "Haute" :
                    selectedProject?.priority === "medium" ? "Moyenne" : "Basse"
                  }
                  color={
                    selectedProject?.priority === "high" ? "error" :
                    selectedProject?.priority === "medium" ? "warning" : "success"
                  }
                />
              </Typography>
            </Box>
          </Box>

          <Typography variant="body1" gutterBottom>
            {acceptRejectAction === "accept"
              ? "En acceptant ce projet, vous allez changer son statut en 'En cours' et pourrez commencer à y assigner des membres de votre équipe."
              : "En refusant ce projet, vous indiquez qu'il ne peut pas être réalisé. Veuillez expliquer la raison du refus."
            }
          </Typography>

          <TextField
            margin="dense"
            label={acceptRejectAction === "accept" ? "Commentaire (optionnel)" : "Raison du refus (obligatoire)"}
            fullWidth
            multiline
            rows={3}
            value={statusComment}
            onChange={(e) => setStatusComment(e.target.value)}
            variant="outlined"
            placeholder={acceptRejectAction === "accept"
              ? "Ajoutez un commentaire sur l'acceptation du projet..."
              : "Expliquez pourquoi le projet est refusé..."
            }
            required={acceptRejectAction === "reject"}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAcceptRejectClose}>Annuler</Button>
          <Button
            onClick={handleAcceptRejectConfirm}
            variant="contained"
            color={acceptRejectAction === "accept" ? "success" : "error"}
            startIcon={acceptRejectAction === "accept" ? <CheckCircle /> : <Close />}
          >
            {acceptRejectAction === "accept" ? "Accepter et démarrer" : "Refuser le projet"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mass Delete Confirmation Dialog */}
      <Dialog open={massDeleteOpen} onClose={handleMassDeleteClose}>
        <DialogTitle>Confirmation de suppression en masse</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Êtes-vous sûr de vouloir supprimer les {selected.length} projets sélectionnés ?
          </Typography>
          <Typography variant="body2" color="error">
            Cette action est irréversible et supprimera définitivement tous les projets sélectionnés.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleMassDeleteClose}>Annuler</Button>
          <Button
            onClick={handleMassDeleteConfirm}
            color="error"
            variant="contained"
            startIcon={<DeleteSweep />}
          >
            Supprimer {selected.length} projet(s)
          </Button>
        </DialogActions>
      </Dialog>

      {/* File Upload Dialog */}
      <Dialog open={fileUploadOpen} onClose={handleFileUploadClose} maxWidth="sm" fullWidth>
        <DialogTitle>Ajouter des fichiers au projet</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Sélectionnez les fichiers à ajouter au projet "{fileUploadProject?.projectName}".
          </Typography>

          <Box
            sx={{
              border: '2px dashed #ccc',
              borderRadius: 2,
              p: 3,
              mt: 2,
              textAlign: 'center',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: alpha(theme.palette.primary.main, 0.05)
              }
            }}
          >
            <input
              type="file"
              id="file-upload"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            <label htmlFor="file-upload">
              <Button
                component="span"
                variant="outlined"
                startIcon={<CloudUpload />}
                sx={{ mb: 2 }}
              >
                Sélectionner des fichiers
              </Button>
            </label>
            <Typography variant="body2" color="text.secondary">
              ou glissez-déposez vos fichiers ici
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFileUploadClose}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Project Detail Dialog */}
      <Dialog
        open={detailDrawerOpen}
        onClose={handleDetailDrawerClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden'
          }
        }}
      >
        {selectedProjectDetail && (
          <>
            <DialogTitle
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: theme => `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.05)})`,
                borderBottom: '1px solid',
                borderColor: 'divider',
                p: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    mr: 2,
                    width: 48,
                    height: 48,
                    boxShadow: 2
                  }}
                >
                  <Assignment />
                </Avatar>
                <Box>
                  <Typography variant="h5" component="h2" fontWeight="bold">
                    {selectedProjectDetail.projectName}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    {getStatusChip(selectedProjectDetail.status)}
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                      Échéance: {formatDate(selectedProjectDetail.deadline)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <IconButton
                onClick={handleDetailDrawerClose}
                sx={{
                  bgcolor: 'background.paper',
                  boxShadow: 1,
                  '&:hover': { bgcolor: 'background.paper', opacity: 0.9 }
                }}
              >
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>

            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Description sx={{ mr: 1 }} /> Description
                  </Typography>
                  <Typography variant="body1">
                    {selectedProjectDetail.description || "Aucune description disponible."}
                  </Typography>
                </Paper>

                <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Group sx={{ mr: 1 }} /> Équipe du projet
                  </Typography>

                  {selectedProjectDetail.projectLeader && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Chef de projet:
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          src={selectedProjectDetail.projectLeader.photo ?
                            `/${selectedProjectDetail.projectLeader.photo.split(/(\\|\/)/g).pop()}` :
                            undefined
                          }
                          sx={{ mr: 2 }}
                        >
                          {selectedProjectDetail.projectLeader && selectedProjectDetail.projectLeader.firstName ? selectedProjectDetail.projectLeader.firstName.charAt(0) : ''}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {selectedProjectDetail.projectLeader && selectedProjectDetail.projectLeader.firstName ?
                              `${selectedProjectDetail.projectLeader.firstName} ${selectedProjectDetail.projectLeader.lastName || ''}` :
                              "Chef de projet"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedProjectDetail.projectLeader &&
                              (selectedProjectDetail.projectLeader.position ||
                               selectedProjectDetail.projectLeader.department ||
                               "Chef de projet")}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}

                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Membres de l'équipe:
                  </Typography>

                  {selectedProjectDetail.team && selectedProjectDetail.team.length > 0 ? (
                    <List disablePadding>
                      {selectedProjectDetail.team.map(member => (
                        <ListItem key={member._id} disablePadding sx={{ mb: 1 }}>
                          <ListItemAvatar>
                            <Avatar
                              src={member.photo ? `/${member.photo.split(/(\\|\/)/g).pop()}` : undefined}
                              sx={{ width: 32, height: 32 }}
                            >
                              {member && member.firstName ? member.firstName.charAt(0) : ''}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={member && member.firstName ? `${member.firstName} ${member.lastName || ''}` : "Membre de l'équipe"}
                            secondary={member ? (member.position || member.department || "Membre de l'équipe") : ""}
                            primaryTypographyProps={{ variant: 'body2' }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Aucun membre dans l'équipe.
                    </Typography>
                  )}
                </Paper>

                <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Comment sx={{ mr: 1, color: 'primary.main' }} /> Commentaires
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Add />}
                      onClick={handleCommentDialogOpen}
                    >
                      Ajouter
                    </Button>
                  </Box>

                  {getProjectComments(selectedProjectDetail._id).length > 0 ? (
                    <List sx={{
                      maxHeight: 350,
                      overflow: 'auto',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 1
                    }}>
                      {getProjectComments(selectedProjectDetail._id)
                        .sort((a, b) => new Date(b.timestamp || b.createdAt || 0) - new Date(a.timestamp || a.createdAt || 0))
                        .map(comment => (
                        <ListItem
                          key={comment._id || comment.timestamp || comment.createdAt || Math.random().toString()}
                          alignItems="flex-start"
                          sx={{
                            px: 1,
                            mb: 1,
                            borderLeft: comment.type === 'status_change' ?
                              `4px solid ${
                                comment.newStatus === 'in-progress' ? '#ff9800' :
                                comment.newStatus === 'on-hold' ? '#f44336' :
                                comment.newStatus === 'completed' ? '#4caf50' : '#9e9e9e'
                              }` : 'none',
                            pl: comment.type === 'status_change' ? 2 : 1,
                            backgroundColor: comment.type === 'status_change' ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                            borderRadius: 1
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{
                              bgcolor: comment.type === 'status_change' ? 'primary.main' : 'secondary.main',
                              width: 40,
                              height: 40
                            }}>
                              {comment.type === 'status_change' ? <Flag /> :
                               (comment.userName ? comment.userName.charAt(0) :
                                comment.authorName ? comment.authorName.charAt(0) : 'U')}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="subtitle2" fontWeight="medium">
                                  {comment.userName || comment.authorName || "Utilisateur"}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(comment.timestamp || comment.createdAt || new Date()).toLocaleString()}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <>
                                {comment.type === 'status_change' ? (
                                  <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2" component="span">
                                      A changé le statut de{' '}
                                      <Chip
                                        size="small"
                                        label={
                                          !comment.oldStatus ? "Inconnu" :
                                          comment.oldStatus === "planning" ? "Planification" :
                                          comment.oldStatus === "in-progress" ? "En cours" :
                                          comment.oldStatus === "on-hold" ? "En attente" :
                                          comment.oldStatus === "completed" ? "Terminé" :
                                          comment.oldStatus === "rejected" ? "Refusé" : "Inconnu"
                                        }
                                        color={
                                          !comment.oldStatus ? "default" :
                                          comment.oldStatus === "planning" ? "info" :
                                          comment.oldStatus === "in-progress" ? "warning" :
                                          comment.oldStatus === "on-hold" ? "error" :
                                          comment.oldStatus === "completed" ? "success" :
                                          comment.oldStatus === "rejected" ? "default" : "default"
                                        }
                                      /> à{' '}
                                      <Chip
                                        size="small"
                                        label={
                                          !comment.newStatus ? "Inconnu" :
                                          comment.newStatus === "planning" ? "Planification" :
                                          comment.newStatus === "in-progress" ? "En cours" :
                                          comment.newStatus === "on-hold" ? "En attente" :
                                          comment.newStatus === "completed" ? "Terminé" :
                                          comment.newStatus === "rejected" ? "Refusé" : "Inconnu"
                                        }
                                        color={
                                          !comment.newStatus ? "default" :
                                          comment.newStatus === "planning" ? "info" :
                                          comment.newStatus === "in-progress" ? "warning" :
                                          comment.newStatus === "on-hold" ? "error" :
                                          comment.newStatus === "completed" ? "success" :
                                          comment.newStatus === "rejected" ? "default" : "default"
                                        }
                                      />
                                    </Typography>
                                    {comment.text && (
                                      <Paper elevation={0} sx={{
                                        mt: 1,
                                        p: 1,
                                        bgcolor: 'background.paper',
                                        borderRadius: 1
                                      }}>
                                        <Typography variant="body2">
                                          {comment.text}
                                        </Typography>
                                      </Paper>
                                    )}
                                  </Box>
                                ) : (
                                  <Paper elevation={0} sx={{
                                    mt: 1,
                                    p: 1,
                                    bgcolor: 'background.paper',
                                    borderRadius: 1
                                  }}>
                                    <Typography variant="body2">
                                      {comment.text}
                                    </Typography>
                                  </Paper>
                                )}
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{
                      p: 3,
                      textAlign: 'center',
                      border: '1px dashed',
                      borderColor: 'divider',
                      borderRadius: 2
                    }}>
                      <Comment sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body1" color="text.secondary">
                        Aucun commentaire pour ce projet.
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Add />}
                        onClick={handleCommentDialogOpen}
                        sx={{ mt: 2 }}
                      >
                        Ajouter un commentaire
                      </Button>
                    </Box>
                  )}
                </Paper>

                <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <AttachFile sx={{ mr: 1 }} /> Fichiers
                  </Typography>

                  {getProjectFiles(selectedProjectDetail._id).length > 0 ? (
                    <List>
                      {getProjectFiles(selectedProjectDetail._id).map((file, index) => (
                        <ListItem
                          key={file.id || file._id || index}
                          secondaryAction={
                            <IconButton
                              edge="end"
                              aria-label="download"
                              component="a"
                              href={file.filePath || file.path || '#'}
                              target="_blank"
                              download
                            >
                              <FileDownload />
                            </IconButton>
                          }
                        >
                          <ListItemIcon>
                            {(file.fileType || file.type || '').includes('pdf') ? (
                              <PictureAsPdf color="error" />
                            ) : (file.fileType || file.type || '').includes('word') || (file.fileType || file.type || '').includes('document') ? (
                              <Description color="primary" />
                            ) : (file.fileType || file.type || '').includes('sheet') || (file.fileType || file.type || '').includes('excel') ? (
                              <TableChart color="success" />
                            ) : (
                              <InsertDriveFile />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={file.originalName || file.fileName || file.name || "Document"}
                            secondary={`Ajouté le ${new Date(file.uploadDate || file.createdAt || new Date()).toLocaleDateString()} ${file.uploadedBy ? `par ${file.uploadedBy}` : ''}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Aucun fichier pour ce projet.
                    </Typography>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 0,
                    mb: 3,
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}
                >
                  <Box sx={{
                    p: 2,
                    bgcolor: theme => alpha(theme.palette.primary.main, 0.1),
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                  }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 'medium',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Info sx={{ mr: 1, color: 'primary.main' }} /> Informations du projet
                    </Typography>
                  </Box>

                  <Box sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <CalendarToday fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="subtitle2">
                              Dates
                            </Typography>
                          </Box>
                          <Divider sx={{ mb: 2 }} />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Création:
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {formatDate(selectedProjectDetail.createdAt)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">
                              Échéance:
                            </Typography>
                            <Typography variant="body2" fontWeight="medium" color={
                              new Date(selectedProjectDetail.deadline) < new Date() ? 'error.main' : 'text.primary'
                            }>
                              {formatDate(selectedProjectDetail.deadline)}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Box sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Flag fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="subtitle2">
                              Priorité & Statut
                            </Typography>
                          </Box>
                          <Divider sx={{ mb: 2 }} />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Priorité:
                            </Typography>
                            <Chip
                              size="small"
                              label={
                                selectedProjectDetail.priority === "high"
                                  ? "Haute"
                                  : selectedProjectDetail.priority === "medium"
                                  ? "Moyenne"
                                  : "Basse"
                              }
                              color={
                                selectedProjectDetail.priority === "high"
                                  ? "error"
                                  : selectedProjectDetail.priority === "medium"
                                  ? "warning"
                                  : "success"
                              }
                            />
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">
                              Statut:
                            </Typography>
                            {getStatusChip(selectedProjectDetail.status)}
                          </Box>
                        </Box>
                      </Grid>

                      <Grid item xs={12}>
                        <Box sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <InsertChart fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="subtitle2">
                              Progression
                            </Typography>
                          </Box>
                          <Divider sx={{ mb: 2 }} />
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={selectedProjectDetail.completionPercentage || 0}
                                color={
                                  selectedProjectDetail.completionPercentage >= 75
                                    ? "success"
                                    : selectedProjectDetail.completionPercentage >= 25
                                    ? "warning"
                                    : "error"
                                }
                                sx={{ height: 10, borderRadius: 5 }}
                              />
                            </Box>
                            <Box sx={{ minWidth: 45, textAlign: 'right' }}>
                              <Typography variant="body2" fontWeight="bold" color={
                                selectedProjectDetail.completionPercentage >= 75
                                  ? "success.main"
                                  : selectedProjectDetail.completionPercentage >= 25
                                  ? "warning.main"
                                  : "error.main"
                              }>
                                {selectedProjectDetail.completionPercentage || 0}%
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>

                {(userRole === "admin" || (userRole === "projectLeader" && selectedProjectDetail.projectLeader?._id === currentUser.id)) && (
                  <Paper
                    elevation={2}
                    sx={{
                      p: 0,
                      borderRadius: 2,
                      overflow: 'hidden'
                    }}
                  >
                    <Box sx={{
                      p: 2,
                      bgcolor: theme => alpha(theme.palette.primary.main, 0.1),
                      borderBottom: '1px solid',
                      borderColor: 'divider'
                    }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 'medium',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Assignment sx={{ mr: 1, color: 'primary.main' }} /> Actions
                      </Typography>
                    </Box>

                    <Box sx={{ p: 2 }}>
                      <Stack spacing={2}>
                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={<Edit />}
                          onClick={() => {
                            setSelectedProject(selectedProjectDetail);
                            handleEditModalOpen();
                            handleDetailDrawerClose();
                          }}
                          sx={{
                            borderRadius: 2,
                            py: 1,
                            boxShadow: 1
                          }}
                        >
                          Modifier le projet
                        </Button>

                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={<Group />}
                          onClick={() => {
                            setSelectedProject(selectedProjectDetail);
                            handleTeamDialogOpen();
                            handleDetailDrawerClose();
                          }}
                          sx={{
                            borderRadius: 2,
                            py: 1,
                            boxShadow: 1
                          }}
                        >
                          Gérer l'équipe
                        </Button>

                        {userRole === "projectLeader" && selectedProjectDetail.projectLeader?._id === currentUser.id && (
                          <>
                            <Divider sx={{ my: 1 }}>
                              <Chip label="Gestion du statut" size="small" />
                            </Divider>

                            {selectedProjectDetail.status !== "in-progress" && (
                              <Button
                                variant="contained"
                                color="warning"
                                startIcon={<PlayArrow />}
                                onClick={() => {
                                  setSelectedProject(selectedProjectDetail);
                                  handleStatusUpdateOpen("in-progress");
                                  handleDetailDrawerClose();
                                }}
                                sx={{
                                  borderRadius: 2,
                                  py: 1,
                                  boxShadow: 2
                                }}
                              >
                                Démarrer le projet
                              </Button>
                            )}

                            {selectedProjectDetail.status !== "completed" && (
                              <Button
                                variant="contained"
                                color="success"
                                startIcon={<Done />}
                                onClick={() => {
                                  setSelectedProject(selectedProjectDetail);
                                  handleStatusUpdateOpen("completed");
                                  handleDetailDrawerClose();
                                }}
                                sx={{
                                  borderRadius: 2,
                                  py: 1,
                                  boxShadow: 2
                                }}
                              >
                                Marquer comme terminé
                              </Button>
                            )}

                            {selectedProjectDetail.status !== "on-hold" && (
                              <Button
                                variant="contained"
                                color="error"
                                startIcon={<Pause />}
                                onClick={() => {
                                  setSelectedProject(selectedProjectDetail);
                                  handleStatusUpdateOpen("on-hold");
                                  handleDetailDrawerClose();
                                }}
                                sx={{
                                  borderRadius: 2,
                                  py: 1,
                                  boxShadow: 2
                                }}
                              >
                                Mettre en attente
                              </Button>
                            )}

                            <Divider sx={{ my: 1 }}>
                              <Chip label="Documents" size="small" />
                            </Divider>

                            <Button
                              variant="outlined"
                              color="info"
                              startIcon={<CloudUpload />}
                              onClick={() => {
                                setFileUploadProject(selectedProjectDetail);
                                setFileUploadOpen(true);
                                handleDetailDrawerClose();
                              }}
                              sx={{
                                borderRadius: 2,
                                py: 1,
                                boxShadow: 1
                              }}
                            >
                              Ajouter des fichiers
                            </Button>
                          </>
                        )}

                        {userRole === "admin" && (
                          <>
                            <Divider sx={{ my: 1 }}>
                              <Chip label="Administration" size="small" color="error" />
                            </Divider>

                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<Delete />}
                              onClick={() => {
                                setSelectedProject(selectedProjectDetail);
                                handleDeleteModalOpen();
                                handleDetailDrawerClose();
                              }}
                              sx={{
                                borderRadius: 2,
                                py: 1,
                                boxShadow: 1
                              }}
                            >
                              Supprimer le projet
                            </Button>
                          </>
                        )}
                      </Stack>
                    </Box>
                  </Paper>
                )}
              </Grid>
            </Grid>
            </DialogContent>
            <DialogActions sx={{ borderTop: '1px solid', borderColor: 'divider', p: 2 }}>
              <Button
                onClick={handleDetailDrawerClose}
                variant="outlined"
                startIcon={<Close />}
              >
                Fermer
              </Button>
              {userRole === "admin" && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Edit />}
                  onClick={() => {
                    setSelectedProject(selectedProjectDetail);
                    handleEditModalOpen();
                    handleDetailDrawerClose();
                  }}
                >
                  Modifier le projet
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Comment Dialog */}
      <Dialog
        open={commentDialogOpen}
        onClose={handleCommentDialogClose}
        maxWidth="sm"
        fullWidth
      >
        {selectedProjectDetail && (
          <>
            <DialogTitle sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              pb: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Comment sx={{ mr: 1, color: 'primary.main' }} />
                Ajouter un commentaire
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  {selectedProjectDetail.projectName}
                </Typography>
                <Chip
                  label={getStatusChip(selectedProjectDetail.status)}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Box>

              <TextField
                autoFocus
                margin="dense"
                label="Votre commentaire"
                fullWidth
                multiline
                rows={4}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                variant="outlined"
                placeholder="Écrivez votre commentaire ici..."
                sx={{ mt: 2 }}
              />
            </DialogContent>
            <DialogActions sx={{
              p: 2,
              borderTop: '1px solid',
              borderColor: 'divider'
            }}>
              <Button
                onClick={handleCommentDialogClose}
                variant="outlined"
              >
                Annuler
              </Button>
              <Button
                onClick={handleAddComment}
                variant="contained"
                color="primary"
                disabled={!newComment.trim()}
                startIcon={<Comment />}
              >
                Ajouter le commentaire
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%", boxShadow: 3 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProjectListPage;