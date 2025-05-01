import React, { useState, useEffect, useRef, useContext } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  IconButton,
  Grid,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  CardHeader,
  Tooltip,
  Badge,
  useTheme,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Send,
  AttachFile,
  InsertDriveFile,
  Image,
  PictureAsPdf,
  Description,
  MoreVert,
  Delete,
  Search,
  FilterList,
  Refresh,
} from "@mui/icons-material";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AuthContext } from "../context/AuthContext";

const TaskChat = () => {
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [previewImage, setPreviewImage] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch tasks assigned by the current user (chef)
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        // Fetch tasks where the current user is the assignedBy (chef)
        const response = await fetch(`http://localhost:5000/api/tasks?assignedBy=${user._id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch tasks");
        }
        const data = await response.json();
        setTasks(data);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user && user._id) {
      fetchTasks();
    }
  }, [user]);

  // Fetch messages when a task is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedTask) return;

      setLoadingMessages(true);
      try {
        const response = await fetch(`http://localhost:5000/api/task-messages/task/${selectedTask._id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch messages");
        }
        const data = await response.json();
        setMessages(data);

        // Mark messages as read
        data.forEach(async (message) => {
          if (!message.isRead && message.receiver._id === user._id) {
            await fetch(`http://localhost:5000/api/task-messages/${message._id}/read`, {
              method: "PUT",
            });
          }
        });
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoadingMessages(false);
      }
    };

    if (selectedTask) {
      fetchMessages();
    }
  }, [selectedTask, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTaskSelect = (task) => {
    setSelectedTask(task);
    setMessages([]);
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !selectedTask) return;

    try {
      const formData = new FormData();
      formData.append("taskId", selectedTask._id);
      formData.append("senderId", user._id);
      formData.append("receiverId", selectedTask.assignedEmployee._id);
      formData.append("message", newMessage);

      // Add attachments to form data
      attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      const response = await fetch("http://localhost:5000/api/task-messages", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, data]);
      setNewMessage("");
      setAttachments([]);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachments((prev) => [...prev, ...files]);
  };

  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOpenFileInput = () => {
    fileInputRef.current.click();
  };

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    handleFilterClose();
  };

  const handlePreviewImage = (url) => {
    setPreviewImage(url);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewImage(null);
  };

  const handleMenuOpen = (event, message) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedMessage(message);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedMessage(null);
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;

    try {
      const response = await fetch(`http://localhost:5000/api/task-messages/${selectedMessage._id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ employeeId: user._id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete message");
      }

      setMessages((prev) => prev.filter((msg) => msg._id !== selectedMessage._id));
      handleMenuClose();
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith("image/")) {
      return <Image />;
    } else if (fileType === "application/pdf") {
      return <PictureAsPdf />;
    } else if (
      fileType === "application/msword" ||
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return <Description />;
    } else if (
      fileType === "application/vnd.ms-excel" ||
      fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      return <InsertDriveFile />;
    } else {
      return <InsertDriveFile />;
    }
  };

  // Filter tasks based on search query and status filter
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.assignedEmployee &&
        `${task.assignedEmployee.firstName} ${task.assignedEmployee.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" || task.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <Box sx={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
      <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
        Gestion des Tâches
      </Typography>

      <Paper
        elevation={3}
        sx={{
          p: 0,
          borderRadius: 2,
          display: "flex",
          flexGrow: 1,
          overflow: "hidden",
          background: theme.palette.background.paper,
        }}
      >
        {/* Task List */}
        <Box
          sx={{
            width: 320,
            borderRight: `1px solid ${theme.palette.divider}`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <TextField
              fullWidth
              placeholder="Rechercher une tâche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleFilterClick}>
                      <FilterList fontSize="small" />
                    </IconButton>
                    <Menu
                      anchorEl={filterAnchorEl}
                      open={Boolean(filterAnchorEl)}
                      onClose={handleFilterClose}
                    >
                      <MenuItem
                        onClick={() => handleStatusFilterChange("all")}
                        selected={statusFilter === "all"}
                      >
                        Tous les statuts
                      </MenuItem>
                      <MenuItem
                        onClick={() => handleStatusFilterChange("Pending")}
                        selected={statusFilter === "Pending"}
                      >
                        En attente
                      </MenuItem>
                      <MenuItem
                        onClick={() => handleStatusFilterChange("In Progress")}
                        selected={statusFilter === "In Progress"}
                      >
                        En cours
                      </MenuItem>
                      <MenuItem
                        onClick={() => handleStatusFilterChange("Completed")}
                        selected={statusFilter === "Completed"}
                      >
                        Terminé
                      </MenuItem>
                    </Menu>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1 }}
            />
          </Box>

          <Box sx={{ flexGrow: 1, overflow: "auto" }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                <CircularProgress size={30} />
              </Box>
            ) : filteredTasks.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Aucune tâche trouvée
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {filteredTasks.map((task) => (
                  <React.Fragment key={task._id}>
                    <ListItem
                      button
                      selected={selectedTask && selectedTask._id === task._id}
                      onClick={() => handleTaskSelect(task)}
                      sx={{
                        px: 2,
                        py: 1.5,
                        borderLeft: task.hasUnreadMessages ? `4px solid ${theme.palette.primary.main}` : "none",
                      }}
                    >
                      <ListItemAvatar>
                        <Badge
                          color="primary"
                          variant="dot"
                          invisible={!task.hasUnreadMessages}
                        >
                          <Avatar
                            src={task.assignedEmployee?.photo}
                            alt={task.assignedEmployee?.firstName}
                          >
                            {task.assignedEmployee?.firstName?.charAt(0)}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography
                            variant="subtitle2"
                            noWrap
                            fontWeight={task.hasUnreadMessages ? 700 : 400}
                          >
                            {task.name}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {task.assignedEmployee ?
                              `${task.assignedEmployee.firstName} ${task.assignedEmployee.lastName}` :
                              "Non assigné"}
                          </Typography>
                        }
                      />
                      <Chip
                        label={
                          task.status === "Pending" ? "En attente" :
                          task.status === "In Progress" ? "En cours" :
                          "Terminé"
                        }
                        size="small"
                        color={
                          task.status === "Pending" ? "warning" :
                          task.status === "In Progress" ? "info" :
                          "success"
                        }
                        sx={{ height: 24 }}
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        </Box>

        {/* Chat Area */}
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", height: "100%" }}>
          {selectedTask ? (
            <>
              {/* Task Info Header */}
              <Box
                sx={{
                  p: 2,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.default,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {selectedTask.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Assigné à: {selectedTask.assignedEmployee ?
                        `${selectedTask.assignedEmployee.firstName} ${selectedTask.assignedEmployee.lastName}` :
                        "Non assigné"}
                    </Typography>
                  </Box>
                  <Box>
                    <Chip
                      label={
                        selectedTask.status === "Pending" ? "En attente" :
                        selectedTask.status === "In Progress" ? "En cours" :
                        "Terminé"
                      }
                      color={
                        selectedTask.status === "Pending" ? "warning" :
                        selectedTask.status === "In Progress" ? "info" :
                        "success"
                      }
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Échéance: {format(new Date(selectedTask.deadline), "dd MMMM yyyy", { locale: fr })}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Messages */}
              <Box
                sx={{
                  flexGrow: 1,
                  overflow: "auto",
                  p: 2,
                  backgroundColor: theme.palette.mode === "dark"
                    ? "rgba(0, 0, 0, 0.1)"
                    : "rgba(0, 0, 0, 0.02)",
                }}
              >
                {loadingMessages ? (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : messages.length === 0 ? (
                  <Box
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center"
                    }}
                  >
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      Aucun message pour cette tâche
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Envoyez un message pour commencer la conversation
                    </Typography>
                  </Box>
                ) : (
                  messages.map((message) => {
                    const isCurrentUser = message.sender._id === user._id;

                    return (
                      <Box
                        key={message._id}
                        sx={{
                          display: "flex",
                          justifyContent: isCurrentUser ? "flex-end" : "flex-start",
                          mb: 2,
                        }}
                      >
                        <Box sx={{ maxWidth: "70%" }}>
                          {!isCurrentUser && (
                            <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                              <Avatar
                                src={message.sender.photo}
                                alt={message.sender.firstName}
                                sx={{ width: 24, height: 24, mr: 1 }}
                              >
                                {message.sender.firstName.charAt(0)}
                              </Avatar>
                              <Typography variant="body2" color="text.secondary">
                                {message.sender.firstName} {message.sender.lastName}
                              </Typography>
                            </Box>
                          )}

                          <Card
                            sx={{
                              borderRadius: 2,
                              backgroundColor: isCurrentUser
                                ? theme.palette.primary.main
                                : theme.palette.background.paper,
                              color: isCurrentUser ? "white" : "inherit",
                              boxShadow: 1,
                            }}
                          >
                            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <Typography variant="body1">
                                  {message.message}
                                </Typography>

                                {isCurrentUser && (
                                  <IconButton
                                    size="small"
                                    sx={{
                                      ml: 1,
                                      color: isCurrentUser ? "rgba(255,255,255,0.7)" : undefined,
                                      p: 0.5,
                                    }}
                                    onClick={(e) => handleMenuOpen(e, message)}
                                  >
                                    <MoreVert fontSize="small" />
                                  </IconButton>
                                )}
                              </Box>

                              {message.attachments && message.attachments.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                  <Grid container spacing={1}>
                                    {message.attachments.map((attachment, index) => (
                                      <Grid item xs={12} key={index}>
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            p: 1,
                                            borderRadius: 1,
                                            backgroundColor: isCurrentUser
                                              ? "rgba(255,255,255,0.1)"
                                              : "rgba(0,0,0,0.05)",
                                          }}
                                        >
                                          {getFileIcon(attachment.fileType)}
                                          <Box sx={{ ml: 1, flexGrow: 1, overflow: "hidden" }}>
                                            <Tooltip title={attachment.originalName}>
                                              <Typography
                                                variant="body2"
                                                noWrap
                                                sx={{
                                                  color: isCurrentUser ? "rgba(255,255,255,0.9)" : undefined,
                                                }}
                                              >
                                                {attachment.originalName}
                                              </Typography>
                                            </Tooltip>
                                          </Box>
                                          <Button
                                            size="small"
                                            component="a"
                                            href={attachment.filePath}
                                            target="_blank"
                                            sx={{
                                              ml: 1,
                                              color: isCurrentUser ? "white" : theme.palette.primary.main,
                                            }}
                                          >
                                            Ouvrir
                                          </Button>
                                        </Box>
                                      </Grid>
                                    ))}
                                  </Grid>
                                </Box>
                              )}
                            </CardContent>
                          </Card>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: "block",
                              textAlign: isCurrentUser ? "right" : "left",
                              mt: 0.5,
                            }}
                          >
                            {format(new Date(message.createdAt), "dd MMM yyyy, HH:mm", { locale: fr })}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </Box>

              {/* Message Input */}
              <Box
                sx={{
                  p: 2,
                  borderTop: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                {attachments.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Grid container spacing={1}>
                      {attachments.map((file, index) => (
                        <Grid item key={index}>
                          <Chip
                            icon={
                              file.type.startsWith("image/") ? <Image /> :
                              file.type === "application/pdf" ? <PictureAsPdf /> :
                              <InsertDriveFile />
                            }
                            label={file.name}
                            onDelete={() => handleRemoveAttachment(index)}
                            sx={{ maxWidth: 200 }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                <Box sx={{ display: "flex" }}>
                  <TextField
                    fullWidth
                    placeholder="Écrivez votre message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    multiline
                    maxRows={4}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  />
                  <IconButton
                    color="primary"
                    onClick={handleOpenFileInput}
                    sx={{ ml: 1 }}
                  >
                    <AttachFile />
                  </IconButton>
                  <Button
                    variant="contained"
                    color="primary"
                    endIcon={<Send />}
                    onClick={handleSendMessage}
                    sx={{ ml: 1 }}
                  >
                    Envoyer
                  </Button>
                </Box>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                p: 3,
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Sélectionnez une tâche pour commencer
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Choisissez une tâche dans la liste pour voir les messages et communiquer avec l'employé
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Image Preview Dialog */}
      <Dialog open={previewOpen} onClose={handleClosePreview} maxWidth="md">
        <DialogContent sx={{ p: 0 }}>
          {previewImage && (
            <img
              src={previewImage}
              alt="Preview"
              style={{ width: "100%", maxHeight: "80vh", objectFit: "contain" }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>Fermer</Button>
          <Button
            component="a"
            href={previewImage}
            target="_blank"
            color="primary"
          >
            Ouvrir dans un nouvel onglet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Message Options Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDeleteMessage}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Supprimer
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default TaskChat;
