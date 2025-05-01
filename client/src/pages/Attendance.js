import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  TextField,
  MenuItem,
  Avatar,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  Stack,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Badge,
  InputAdornment,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
} from "@mui/material";

import { format, addDays, subDays } from "date-fns";
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
  PictureAsPdf as PdfIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Print as PrintIcon,
} from "@mui/icons-material";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

const Attendance = () => {
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [activeTab, setActiveTab] = useState(0);
  const [quickActionDialogOpen, setQuickActionDialogOpen] = useState(false);
  const [quickActionType, setQuickActionType] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [retardMinutes, setRetardMinutes] = useState(15);
  const [retardReason, setRetardReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [departments, setDepartments] = useState([]);
  const [lastAction, setLastAction] = useState({ type: null, employeeId: null });

  // Récupérer les présences depuis l'API
  const fetchAttendance = () => {
    setLoading(true);
    setError("");
    fetch("http://localhost:5000/api/presence")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Erreur HTTP: ${res.status} - Erreur lors de la récupération des présences`);
        }
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) {
          console.warn("Les données reçues ne sont pas un tableau:", data);
          setAttendanceRecords([]);
        } else {
          setAttendanceRecords(data);
          console.log(`Récupération de ${data.length} enregistrements de présence`);
        }
        // Générer le rapport automatiquement avec la date actuellement sélectionnée
        console.log("Generating report after fetching attendance for date:", format(selectedDate, "yyyy-MM-dd"));
        generateReport();
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur lors de la récupération des présences:", err);
        setError(err.message);
        setLoading(false);
        showSnackbar("Erreur lors de la récupération des présences: " + err.message, "error");
      });
  };

  // Récupérer la liste des employés et des départements
  useEffect(() => {
    fetch("http://localhost:5000/api/employees")
      .then((res) => res.json())
      .then((data) => {
        setEmployees(data);
        // Extraire les départements uniques
        const uniqueDepartments = [...new Set(data.map(emp => emp.department))];
        setDepartments(uniqueDepartments);
      })
      .catch((err) => {
        console.error("Erreur lors de la récupération des employés :", err);
        showSnackbar("Erreur lors de la récupération des employés", "error");
      });
  }, []);

  // Récupérer les présences quand les employés changent ou au montage
  useEffect(() => {
    if (employees.length > 0) {
      fetchAttendance();
    }
  }, [employees]);

  // Régénérer le rapport quand la date ou les enregistrements de présence changent
  useEffect(() => {
    console.log("Date or attendance records changed, regenerating report:", format(selectedDate, "yyyy-MM-dd"));
    if (employees.length > 0) {
      generateReport();
    }
  }, [selectedDate, attendanceRecords]);

  // Fonction utilitaire pour comparer les dates sans tenir compte de l'heure
  const isSameDay = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  // Filtrer les employés
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = searchQuery === "" ||
      `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === "all" || employee.department === selectedDepartment;
    // Ne montrer que les employés qui n'ont pas encore d'enregistrement pour la date sélectionnée
    const hasNoRecord = !attendanceRecords.some(record =>
      record.employeeId && record.employeeId._id === employee._id &&
      isSameDay(record.date || record.checkIn, selectedDate)
    );
    return matchesSearch && matchesDepartment && hasNoRecord;
  });

  // Filtrer les enregistrements par la date sélectionnée et les filtres
  const filteredRecords = attendanceRecords.filter((record) => {
    if (!record.checkIn && !record.date) return false;
    const matchesDate = isSameDay(record.date || record.checkIn, selectedDate);
    const matchesSearch = searchQuery === "" ||
      (record.employeeId && `${record.employeeId.firstName} ${record.employeeId.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDepartment = selectedDepartment === "all" ||
      (record.employeeId && record.employeeId.department === selectedDepartment);
    return matchesDate && matchesSearch && matchesDepartment;
  });

  // Gestion des actions rapides
  const handleQuickAction = (type, employee) => {
    setLoading(true);
    const data = {
      employeeId: employee._id,
      date: selectedDate,
      checkIn: new Date().toISOString(),
      status: type,
      lateMinutes: type === 'late' ? 15 : 0,
      notes: type === 'late' ? 'Retard' : type === 'ropo' ? 'Congé' : ''
    };

    fetch("http://localhost:5000/api/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Erreur HTTP: ${res.status}`);
        }
        return res.json();
      })
      .then(() => {
        // Ne pas changer d'onglet automatiquement
        // Recharger les données
        fetchAttendance();
        setLoading(false);
        showSnackbar(`${type === 'present' ? 'Présence' : type === 'late' ? 'Retard' : type === 'ropo' ? 'Congé' : 'Absence'} enregistré avec succès`, "success");
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        showSnackbar("Erreur lors de l'enregistrement", "error");
      });
  };

  // Nous avons supprimé l'effet qui changeait automatiquement l'onglet après une action
  // pour permettre à l'utilisateur de rester sur l'onglet "Tous les employés"

  // Gestion du check‑out
  const handleCheckOut = (recordId) => {
    setLoading(true);
    fetch(`http://localhost:5000/api/presence/checkout/${recordId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkOut: new Date().toISOString() }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Erreur HTTP: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // Recharger les données
        fetchAttendance();
        // Ne pas changer l'onglet automatiquement
        setLoading(false);
        showSnackbar("Check-out enregistré avec succès", "success");
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        showSnackbar("Erreur lors du check-out", "error");
      });
  };

  // Supprimer un enregistrement
  const handleDeleteRecord = (recordId) => {
    setLoading(true);
    fetch(`http://localhost:5000/api/presence/${recordId}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then(() => {
        setLoading(false);
        fetchAttendance();
        showSnackbar("Enregistrement supprimé avec succès", "success");
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        showSnackbar("Erreur lors de la suppression", "error");
      });
  };

  // Générer un rapport
  const generateReport = (period = 'day') => {
    console.log(`Generating report for date: ${format(selectedDate, "yyyy-MM-dd")} with period: ${period}`);

    fetch(`http://localhost:5000/api/reports/daily?date=${format(selectedDate, "yyyy-MM-dd")}&period=${period}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Erreur HTTP: ${res.status} - Erreur lors de la génération du rapport`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Rapport reçu:", data);
        console.log(`Statistiques: Présents: ${data.present}, Retards: ${data.late}, Congés: ${data.ropo}, Absents: ${data.absent}`);
        console.log(`Période: ${data.period}, du ${new Date(data.startDate).toLocaleDateString()} au ${new Date(data.endDate).toLocaleDateString()}`);
        console.log(`Détails: ${data.details.length} enregistrements`);

        setReportData(data);

        if (activeTab === 6) {
          // Si on est déjà sur l'onglet rapport, afficher un message de confirmation
          showSnackbar(`Rapport généré pour le ${format(selectedDate, "dd/MM/yyyy")}`, "success");
        }
      })
      .catch((err) => {
        console.error("Erreur lors de la génération du rapport:", err);
        showSnackbar("Erreur lors de la génération du rapport: " + err.message, "error");
      });
  };

  // État pour le dialogue d'exportation PDF
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('day');

  // Ouvrir le dialogue d'exportation PDF
  const openPdfDialog = () => {
    setPdfDialogOpen(true);
  };

  // Générer et exporter le rapport en PDF
  const exportToPDF = () => {
    if (!reportData) {
      // Générer d'abord le rapport avec la période sélectionnée
      generateReport(reportPeriod);
      showSnackbar("Génération du rapport en cours...", "info");
      setTimeout(() => {
        if (reportData) {
          createPDF();
        } else {
          showSnackbar("Erreur lors de la génération du rapport", "error");
        }
      }, 1000);
    } else {
      createPDF();
    }
    setPdfDialogOpen(false);
  };

  // Créer le PDF avec les données du rapport
  const createPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Titre
    doc.setFontSize(20);
    doc.text("Rapport de Présence", pageWidth / 2, 20, { align: "center" });

    // Période
    doc.setFontSize(12);
    let periodText = "";
    if (reportData.period === 'day') {
      periodText = `Date: ${format(new Date(reportData.startDate), "dd/MM/yyyy")}`;
    } else if (reportData.period === 'week') {
      periodText = `Semaine: du ${format(new Date(reportData.startDate), "dd/MM/yyyy")} au ${format(new Date(reportData.endDate), "dd/MM/yyyy")}`;
    } else if (reportData.period === 'month') {
      periodText = `Mois: ${format(new Date(reportData.startDate), "MMMM yyyy")}`;
    }
    doc.text(periodText, 20, 30);

    // Résumé
    doc.setFontSize(16);
    doc.text("Résumé", 20, 45);

    const summary = [
      ["Présents", reportData.present || 0],
      ["Retards", reportData.late || 0],
      ["Congés", reportData.ropo || 0],
      ["Absents", reportData.absent || 0]
    ];

    autoTable(doc, {
      startY: 50,
      head: [["Statut", "Nombre"]],
      body: summary,
      theme: "grid"
    });

    // Détails
    doc.setFontSize(16);
    doc.text("Détails", 20, doc.lastAutoTable.finalY + 20);

    const details = reportData.details
      .filter(record => record.employeeId)
      .map(record => [
        `${record.employeeId?.firstName} ${record.employeeId?.lastName}`,
        record.employeeId?.department || "-",
        record.status === 'present' ? 'Présent' :
        record.status === 'late' ? 'En retard' :
        record.status === 'ropo' ? 'En congé' : 'Absent',
        record.checkIn ? new Date(record.checkIn).toLocaleString() : "-",
        record.checkOut ? new Date(record.checkOut).toLocaleString() : "-",
        record.lateMinutes || 0
      ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 25,
      head: [["Nom", "Département", "Statut", "Heure d'entrée", "Heure de sortie", "Minutes de retard"]],
      body: details,
      theme: "grid"
    });

    // Enregistrer le PDF
    let filename = "";
    if (reportData.period === 'day') {
      filename = `presence_report_day_${format(new Date(reportData.startDate), "yyyy-MM-dd")}`;
    } else if (reportData.period === 'week') {
      filename = `presence_report_week_${format(new Date(reportData.startDate), "yyyy-MM-dd")}`;
    } else if (reportData.period === 'month') {
      filename = `presence_report_month_${format(new Date(reportData.startDate), "yyyy-MM")}`;
    }
    doc.save(`${filename}.pdf`);

    showSnackbar("Rapport PDF généré avec succès", "success");
  };

  // Afficher un message de notification
  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // Composant pour afficher le nom de l'employé avec son avatar
  const EmployeeInfo = ({ employee }) => {
    if (!employee || !employee.firstName) return "Employé inconnu";
    let photoSrc;
    if (employee.photo && typeof employee.photo === "string") {
      photoSrc = `/${employee.photo.split(/(\\|\/)/g).pop()}`;
    }
    const initials = `${employee.firstName[0] || ""}${employee.lastName[0] || ""}`.toUpperCase();
    return (
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Avatar src={photoSrc} sx={{ width: 32, height: 32, mr: 1 }}>
          {!photoSrc && initials}
        </Avatar>
        <Typography variant="body2">
          {employee.firstName} {employee.lastName}
        </Typography>
      </Box>
    );
  };

  // Composant pour afficher le statut
  const StatusChip = ({ status }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'present': return 'success';
        case 'late': return 'warning';
        case 'absent': return 'error';
        case 'ropo': return 'info';
        default: return 'default';
      }
    };

    const getStatusIcon = () => {
      switch (status) {
        case 'present': return <CheckCircleIcon />;
        case 'late': return <AccessTimeIcon />;
        case 'absent': return <CancelIcon />;
        case 'ropo': return <AccessTimeIcon />;
        default: return null;
      }
    };

    const getStatusLabel = () => {
      switch (status) {
        case 'present': return 'Présent';
        case 'late': return 'En retard';
        case 'absent': return 'Absent';
        case 'ropo': return 'En congé';
        default: return status;
      }
    };

    return (
      <Chip
        icon={getStatusIcon()}
        label={getStatusLabel()}
        color={getStatusColor()}
        size="small"
      />
    );
  };

  // Rendu du contenu des onglets
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Tous les employés (non enregistrés)
        return (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom Employé</TableCell>
                  <TableCell>Département</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee._id}>
                    <TableCell>
                      <EmployeeInfo employee={employee} />
                    </TableCell>
                    <TableCell>{employee.department || "-"}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Marquer comme présent">
                          <IconButton
                            color="success"
                            onClick={() => handleQuickAction('present', employee)}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Marquer comme en retard">
                          <IconButton
                            color="warning"
                            onClick={() => handleQuickAction('late', employee)}
                          >
                            <AccessTimeIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Marquer comme en congé">
                          <IconButton
                            color="info"
                            onClick={() => handleQuickAction('ropo', employee)}
                          >
                            <AccessTimeIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Marquer comme absent">
                          <IconButton
                            color="error"
                            onClick={() => handleQuickAction('absent', employee)}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );

      case 1: // Présents (non check-out)
        return (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom Employé</TableCell>
                  <TableCell>Département</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Heure d'entrée</TableCell>
                  <TableCell>Heure de sortie</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords
                  .filter(record => record.status === 'present' && record.employeeId && !record.checkOut)
                  .map((record) => (
                    <TableRow key={record._id}>
                      <TableCell>
                        <EmployeeInfo employee={record.employeeId} />
                      </TableCell>
                      <TableCell>{record.employeeId?.department || "-"}</TableCell>
                      <TableCell>
                        <StatusChip status={record.status} />
                      </TableCell>
                      <TableCell>{new Date(record.checkIn).toLocaleString()}</TableCell>
                      <TableCell>
                        {record.checkOut ? new Date(record.checkOut).toLocaleString() : "-"}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Check-out">
                            <IconButton
                              color="primary"
                              onClick={() => handleCheckOut(record._id)}
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton
                              color="error"
                              onClick={() => handleDeleteRecord(record._id)}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        );

      case 2: // Retards
        return (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom Employé</TableCell>
                  <TableCell>Département</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Heure d'entrée</TableCell>
                  <TableCell>Minutes de retard</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords
                  .filter(record => record.status === 'late' && record.employeeId)
                  .map((record) => (
                    <TableRow key={record._id}>
                      <TableCell>
                        <EmployeeInfo employee={record.employeeId} />
                      </TableCell>
                      <TableCell>{record.employeeId?.department || "-"}</TableCell>
                      <TableCell>
                        <StatusChip status={record.status} />
                      </TableCell>
                      <TableCell>{new Date(record.checkIn).toLocaleString()}</TableCell>
                      <TableCell>{record.lateMinutes || 0}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Check-out">
                            <IconButton
                              color="primary"
                              onClick={() => handleCheckOut(record._id)}
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton
                              color="error"
                              onClick={() => handleDeleteRecord(record._id)}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        );

      case 3: // Absents
        return (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom Employé</TableCell>
                  <TableCell>Département</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords
                  .filter(record => record.status === 'absent' && record.employeeId)
                  .map((record) => (
                    <TableRow key={record._id}>
                      <TableCell>
                        <EmployeeInfo employee={record.employeeId} />
                      </TableCell>
                      <TableCell>{record.employeeId?.department || "-"}</TableCell>
                      <TableCell>
                        <StatusChip status={record.status} />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Supprimer">
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteRecord(record._id)}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        );

      case 4: // Congés
        return (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom Employé</TableCell>
                  <TableCell>Département</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords
                  .filter(record => record.status === 'ropo' && record.employeeId)
                  .map((record) => (
                    <TableRow key={record._id}>
                      <TableCell>
                        <EmployeeInfo employee={record.employeeId} />
                      </TableCell>
                      <TableCell>{record.employeeId?.department || "-"}</TableCell>
                      <TableCell>
                        <StatusChip status={record.status} />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Supprimer">
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteRecord(record._id)}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        );

      case 5: // Check-out
        return (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom Employé</TableCell>
                  <TableCell>Département</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Heure d'entrée</TableCell>
                  <TableCell>Heure de sortie</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords
                  .filter(record => record.employeeId && record.checkOut)
                  .map((record) => (
                    <TableRow key={record._id}>
                      <TableCell>
                        <EmployeeInfo employee={record.employeeId} />
                      </TableCell>
                      <TableCell>{record.employeeId?.department || "-"}</TableCell>
                      <TableCell>
                        <StatusChip status={record.status} />
                      </TableCell>
                      <TableCell>{new Date(record.checkIn).toLocaleString()}</TableCell>
                      <TableCell>{new Date(record.checkOut).toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Supprimer">
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteRecord(record._id)}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        );

      case 6: // Rapport
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Résumé pour le {format(selectedDate, "dd/MM/yyyy")}</Typography>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => generateReport()}
                startIcon={<RefreshIcon />}
              >
                Actualiser le rapport
              </Button>
            </Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={3}>
                <Card sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Présents</Typography>
                    <Typography variant="h4">{reportData?.present || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={3}>
                <Card sx={{
                  bgcolor: 'warning.main',
                  color: 'white',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Retards</Typography>
                    <Typography variant="h4">{reportData?.late || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={3}>
                <Card sx={{
                  bgcolor: 'info.main',
                  color: 'white',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Congés</Typography>
                    <Typography variant="h4">{reportData?.ropo || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={3}>
                <Card sx={{
                  bgcolor: 'error.main',
                  color: 'white',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Absents</Typography>
                    <Typography variant="h4">{reportData?.absent || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2 }}>Détails</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nom Employé</TableCell>
                    <TableCell>Département</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Minutes de retard</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData?.details?.filter(record => record.employeeId).map((record) => (
                    <TableRow key={record._id || record.employeeId._id}>
                      <TableCell>
                        <EmployeeInfo employee={record.employeeId} />
                      </TableCell>
                      <TableCell>{record.employeeId?.department || "-"}</TableCell>
                      <TableCell>
                        <StatusChip status={record.status} />
                      </TableCell>
                      <TableCell>{record.lateMinutes || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      {/* En-tête avec titre et actions rapides */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Système de présence des employés
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAttendance}
            disabled={loading}
          >
            Actualiser
          </Button>
          <Button
            variant="contained"
            startIcon={<PdfIcon />}
            onClick={openPdfDialog}
          >
            Exporter PDF
          </Button>
        </Stack>
      </Box>

      {/* Filtres et recherche */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Rechercher un employé"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Filtrer par département"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <MenuItem value="all">Tous les départements</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setSelectedDate(prev => subDays(prev, 1))}
                >
                  Hier
                </Button>
                <TextField
                  label="Date"
                  type="date"
                  value={format(selectedDate, "yyyy-MM-dd")}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={() => setSelectedDate(prev => addDays(prev, 1))}
                >
                  Demain
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Onglets */}
      <Card>
        <CardContent>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ mb: 2 }}
          >
            <Tab label="Tous les employés" />
            <Tab label="Présents" />
            <Tab label="Retards" />
            <Tab label="Absents" />
            <Tab label="Congés" />
            <Tab label="Check-out" />
            <Tab label="Rapport" />
          </Tabs>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            renderTabContent()
          )}
        </CardContent>
      </Card>

      {/* Dialogue pour les actions rapides */}
      <Dialog open={quickActionDialogOpen} onClose={() => setQuickActionDialogOpen(false)}>
        <DialogTitle>
          {quickActionType === 'present' ? 'Marquer comme présent' :
           quickActionType === 'late' ? 'Marquer comme en retard' :
           'Marquer comme absent'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {quickActionType === 'late' && (
              <>
                <TextField
                  label="Minutes de retard"
                  type="number"
                  value={retardMinutes}
                  onChange={(e) => setRetardMinutes(parseInt(e.target.value))}
                  fullWidth
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Raison du retard"
                  multiline
                  rows={3}
                  value={retardReason}
                  onChange={(e) => setRetardReason(e.target.value)}
                  fullWidth
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuickActionDialogOpen(false)}>Annuler</Button>
          <Button onClick={() => handleQuickAction(quickActionType, selectedEmployee)} variant="contained" disabled={loading}>
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue pour l'exportation PDF */}
      <Dialog open={pdfDialogOpen} onClose={() => setPdfDialogOpen(false)}>
        <DialogTitle>Exporter le rapport en PDF</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Sélectionnez la période pour le rapport:
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value)}
              >
                <FormControlLabel value="day" control={<Radio />} label={`Jour: ${format(selectedDate, "dd/MM/yyyy")}`} />
                <FormControlLabel value="week" control={<Radio />} label="Semaine courante" />
                <FormControlLabel value="month" control={<Radio />} label={`Mois: ${format(selectedDate, "MMMM yyyy")}`} />
              </RadioGroup>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPdfDialogOpen(false)}>Annuler</Button>
          <Button onClick={exportToPDF} variant="contained" color="primary">
            Générer PDF
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default Attendance;
