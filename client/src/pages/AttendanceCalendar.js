// src/pages/AttendanceCalendar.js
import React, { useState, useEffect, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isWeekend, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Badge,
  Stack,
  Alert,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  InputAdornment
} from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  PictureAsPdf as PdfIcon,
  Print as PrintIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  CalendarMonth as CalendarMonthIcon,
  Event as EventIcon,
  EventBusy as EventBusyIcon,
  EventAvailable as EventAvailableIcon
} from "@mui/icons-material";

// Composant pour afficher le statut
const StatusChip = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'present': return 'success';
      case 'late': return 'warning';
      case 'absent': return 'error';
      case 'ropo': return 'info';
      case 'halfDay': return 'secondary';
      case 'earlyDeparture': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'present': return <CheckCircleIcon />;
      case 'late': return <AccessTimeIcon />;
      case 'absent': return <CancelIcon />;
      case 'ropo': return <EventBusyIcon />;
      case 'halfDay': return <EventAvailableIcon />;
      case 'earlyDeparture': return <AccessTimeIcon />;
      default: return null;
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'present': return 'Présent';
      case 'late': return 'En retard';
      case 'absent': return 'Absent';
      case 'ropo': return 'En congé';
      case 'halfDay': return 'Mi-journée';
      case 'earlyDeparture': return 'Départ anticipé';
      default: return status;
    }
  };

  return (
    <Chip
      icon={getStatusIcon()}
      label={getStatusLabel()}
      color={getStatusColor()}
      size="small"
      sx={{ mr: 1 }}
    />
  );
};

// Composant pour afficher les informations de l'employé
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

const AttendanceCalendar = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [departments, setDepartments] = useState([]);
  const [dailyStats, setDailyStats] = useState({
    present: 0,
    late: 0,
    absent: 0,
    ropo: 0,
    halfDay: 0,
    earlyDeparture: 0,
    total: 0
  });

  // Fonction pour récupérer les présences depuis l'API
  const fetchAttendance = () => {
    setLoading(true);
    fetch("http://localhost:5000/api/presence")
      .then((res) => {
        if (!res.ok) throw new Error("Erreur lors de la récupération des présences");
        return res.json();
      })
      .then((data) => {
        setAttendanceRecords(data);
        setLoading(false);
        calculateDailyStats(selectedDate, data);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        showSnackbar("Erreur lors de la récupération des présences", "error");
      });
  };

  // Récupérer la liste des employés et des départements
  const fetchEmployees = () => {
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
  };

  useEffect(() => {
    fetchAttendance();
    fetchEmployees();
  }, []);

  // Calculer les statistiques pour la date sélectionnée
  const calculateDailyStats = (date, records = attendanceRecords) => {
    const dateStr = format(date, "yyyy-MM-dd");

    // Filtrer les enregistrements pour la date sélectionnée
    const dayRecords = records.filter((record) => {
      const recordDate = record.date ? format(new Date(record.date), "yyyy-MM-dd") :
                         record.checkIn ? format(new Date(record.checkIn), "yyyy-MM-dd") : null;
      return recordDate === dateStr;
    });

    // Compter les différents statuts
    const stats = {
      present: dayRecords.filter(r => r.status === 'present').length,
      late: dayRecords.filter(r => r.status === 'late').length,
      absent: dayRecords.filter(r => r.status === 'absent').length,
      ropo: dayRecords.filter(r => r.status === 'ropo').length,
      halfDay: dayRecords.filter(r => r.status === 'halfDay').length,
      earlyDeparture: dayRecords.filter(r => r.status === 'earlyDeparture').length,
      total: dayRecords.length
    };

    setDailyStats(stats);
  };

  // Mettre à jour les statistiques lorsque la date sélectionnée change
  useEffect(() => {
    calculateDailyStats(selectedDate);
  }, [selectedDate, attendanceRecords]);

  // Fonction pour obtenir les enregistrements pour une date donnée
  const getAttendanceForDate = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return attendanceRecords.filter((record) => {
      const recordDate = record.date ? format(new Date(record.date), "yyyy-MM-dd") :
                         record.checkIn ? format(new Date(record.checkIn), "yyyy-MM-dd") : null;
      return recordDate === dateStr;
    });
  };

  // Générer les jours du mois actuel
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Naviguer au mois précédent
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  // Naviguer au mois suivant
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Naviguer au mois actuel
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  // Afficher un message de notification
  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // Filtrer les enregistrements pour la date sélectionnée
  const filteredRecords = useMemo(() => {
    const records = getAttendanceForDate(selectedDate);

    return records.filter(record => {
      const matchesSearch = searchQuery === "" ||
        (record.employeeId && `${record.employeeId.firstName} ${record.employeeId.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDepartment = selectedDepartment === "all" ||
        (record.employeeId && record.employeeId.department === selectedDepartment);

      return matchesSearch && matchesDepartment;
    });
  }, [selectedDate, attendanceRecords, searchQuery, selectedDepartment]);

  // Calculer le taux de présence pour une date donnée
  const getAttendanceRate = (date) => {
    const records = getAttendanceForDate(date);
    if (records.length === 0) return 0;

    const presentCount = records.filter(r => r.status === 'present' || r.status === 'late').length;
    return (presentCount / employees.length) * 100;
  };

  // Obtenir la couleur de fond en fonction du taux de présence
  const getAttendanceColor = (date) => {
    const rate = getAttendanceRate(date);
    if (rate === 0) return "transparent";
    if (rate < 30) return "rgba(244, 67, 54, 0.2)"; // Rouge clair
    if (rate < 70) return "rgba(255, 152, 0, 0.2)"; // Orange clair
    return "rgba(76, 175, 80, 0.2)"; // Vert clair
  };

  // Obtenir le nombre d'enregistrements pour une date donnée
  const getRecordCount = (date) => {
    return getAttendanceForDate(date).length;
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* En-tête avec titre et actions */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Calendrier de présence des employés
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
            onClick={() => showSnackbar("Exportation en PDF non implémentée", "info")}
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
              <FormControl fullWidth>
                <InputLabel>Filtrer par département</InputLabel>
                <Select
                  value={selectedDepartment}
                  label="Filtrer par département"
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  <MenuItem value="all">Tous les départements</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={goToToday}
                  startIcon={<TodayIcon />}
                >
                  Aujourd'hui
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Contenu principal */}
      <Grid container spacing={3}>
        {/* Calendrier */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }} elevation={3}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <Box>
                {/* Navigation du calendrier */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <IconButton onClick={prevMonth}>
                    <ChevronLeftIcon />
                  </IconButton>
                  <Typography variant="h6">
                    {format(currentMonth, 'MMMM yyyy', { locale: fr })}
                  </Typography>
                  <IconButton onClick={nextMonth}>
                    <ChevronRightIcon />
                  </IconButton>
                </Box>

                {/* Jours de la semaine */}
                <Grid container sx={{ mb: 1, fontWeight: 'bold' }}>
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, index) => (
                    <Grid item xs={1.7} key={index} sx={{ textAlign: 'center' }}>
                      {day}
                    </Grid>
                  ))}
                </Grid>

                {/* Grille du calendrier */}
                <Grid container>
                  {/* Espaces vides pour aligner les jours */}
                  {Array.from({ length: (daysInMonth[0].getDay() + 6) % 7 }).map((_, index) => (
                    <Grid item xs={1.7} key={`empty-${index}`} sx={{ height: 80 }} />
                  ))}

                  {/* Jours du mois */}
                  {daysInMonth.map((day) => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, new Date());
                    const recordCount = getRecordCount(day);
                    const bgColor = getAttendanceColor(day);

                    return (
                      <Grid item xs={1.7} key={day.toString()}>
                        <Paper
                          sx={{
                            height: 80,
                            p: 1,
                            cursor: 'pointer',
                            border: isSelected ? '2px solid #1976d2' : isToday ? '2px solid #4caf50' : '1px solid #e0e0e0',
                            backgroundColor: bgColor,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            ...(isWeekend(day) && { opacity: 0.7 })
                          }}
                          onClick={() => setSelectedDate(day)}
                          elevation={isSelected ? 3 : 1}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: isToday ? 'bold' : 'normal',
                              color: isToday ? '#4caf50' : 'inherit'
                            }}
                          >
                            {format(day, 'd')}
                          </Typography>
                          {recordCount > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              <Badge badgeContent={recordCount} color="primary" max={99} />
                            </Box>
                          )}
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Détails de la journée sélectionnée */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }} elevation={3}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
            </Typography>

            {/* Statistiques de la journée */}
            <Grid container spacing={1} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Card sx={{ bgcolor: '#e8f5e9' }}>
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    <Typography variant="body2">Présents</Typography>
                    <Typography variant="h6">{dailyStats.present}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ bgcolor: '#fff8e1' }}>
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    <Typography variant="body2">Retards</Typography>
                    <Typography variant="h6">{dailyStats.late}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ bgcolor: '#e3f2fd' }}>
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    <Typography variant="body2">Congés</Typography>
                    <Typography variant="h6">{dailyStats.ropo}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ bgcolor: '#ffebee' }}>
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    <Typography variant="body2">Absents</Typography>
                    <Typography variant="h6">{dailyStats.absent}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Liste des présences */}
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Détails des présences:
            </Typography>

            {filteredRecords.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                Aucune présence enregistrée pour cette date
              </Alert>
            ) : (
              <TableContainer sx={{ maxHeight: 300 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Employé</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Heures</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record._id} hover>
                        <TableCell>
                          <EmployeeInfo employee={record.employeeId} />
                        </TableCell>
                        <TableCell>
                          <StatusChip status={record.status} />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={`Check-in: ${new Date(record.checkIn).toLocaleTimeString()}`}>
                            <Typography variant="body2" noWrap>
                              {format(new Date(record.checkIn), 'HH:mm')}
                              {record.checkOut && ` - ${format(new Date(record.checkOut), 'HH:mm')}`}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

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
    </Box>
  );
};

export default AttendanceCalendar;
