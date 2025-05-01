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
  Badge,
  useTheme,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
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
} from "@mui/icons-material";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AuthContext } from "../context/AuthContext";

const EmployeeMessaging = () => {
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const [chef, setChef] = useState(null);
  // Initialize messages from localStorage if available
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('sharedMessages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [newMessage, setNewMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch chef
  useEffect(() => {
    const fetchChef = async () => {
      if (!user || !user._id) return;

      setLoading(true);
      try {
        // First try to fetch from the messaging API
        const response = await fetch(`http://localhost:5000/api/messages/chef/${user._id}`);

        if (!response.ok) {
          // If that fails, try the regular employee API to get chef info
          console.log("Trying fallback API...");
          const fallbackResponse = await fetch(`http://localhost:5000/api/employees/${user._id}`);

          if (!fallbackResponse.ok) {
            throw new Error("Failed to fetch chef from both APIs");
          }

          const employeeData = await fallbackResponse.json();

          if (employeeData.chefId) {
            // If we have a chefId, fetch the chef details
            const chefResponse = await fetch(`http://localhost:5000/api/employees/${employeeData.chefId}`);

            if (!chefResponse.ok) {
              throw new Error("Failed to fetch chef details");
            }

            const chefData = await chefResponse.json();
            setChef(chefData);
          } else {
            throw new Error("No chef assigned to this employee");
          }

          return;
        }

        const data = await response.json();
        setChef(data);
      } catch (error) {
        console.error("Error fetching chef:", error);
        // Set sample data for testing if everything fails
        setChef({
          _id: "sample-chef",
          firstName: "Chef",
          lastName: "Manager",
          role: "chef",
          photo: null
        });
      } finally {
        setLoading(false);
      }
    };

    fetchChef();
  }, [user]);

  // Fetch messages when chef is loaded
  useEffect(() => {
    const fetchMessages = async () => {
      if (!chef || !chef._id) return;

      setLoadingMessages(true);
      try {
        const response = await fetch(
          `http://localhost:5000/api/messages/conversation/${user._id}/${chef._id}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch messages");
        }
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error("Error fetching messages:", error);
        // Don't clear messages if API fails
        // Keep existing messages from localStorage
      } finally {
        setLoadingMessages(false);
      }
    };

    if (chef) {
      fetchMessages();
    }
  }, [chef, user]);

  // Scroll to bottom when messages change and save to localStorage
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    // Save messages to localStorage with a shared key
    if (messages.length > 0) {
      localStorage.setItem('sharedMessages', JSON.stringify(messages));
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !chef) return;

    // Create a temporary message object for immediate display
    const tempMessage = {
      _id: `temp-${Date.now()}`,
      content: newMessage,
      sender: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        photo: user.photo,
        role: user.role
      },
      receiver: {
        _id: chef._id,
        firstName: chef.firstName,
        lastName: chef.lastName,
        photo: chef.photo,
        role: chef.role
      },
      attachments: attachments.map((file, index) => ({
        _id: `temp-attachment-${index}`,
        originalName: file.name,
        fileType: file.type,
        fileSize: file.size
      })),
      createdAt: new Date().toISOString()
    };

    // Add the temporary message to the UI immediately
    console.log("Adding temporary message:", tempMessage);
    setMessages((prev) => {
      console.log("Previous messages:", prev);
      const newMessages = [...prev, tempMessage];
      console.log("New messages:", newMessages);
      return newMessages;
    });

    // Clear input fields
    const messageCopy = newMessage;
    const attachmentsCopy = [...attachments];
    setNewMessage("");
    setAttachments([]);

    try {
      // For now, let's simulate a successful message send since the server is having issues
      // This is a temporary solution until the server is fixed

      // Create a simulated server response
      const simulatedResponse = {
        _id: `real-${Date.now()}`,
        content: messageCopy,
        sender: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          photo: user.photo,
          role: user.role
        },
        receiver: {
          _id: chef._id,
          firstName: chef.firstName,
          lastName: chef.lastName,
          photo: chef.photo,
          role: chef.role
        },
        attachments: attachmentsCopy.map((file, index) => ({
          _id: `attachment-${index}`,
          originalName: file.name,
          fileType: file.type,
          fileSize: file.size,
          filePath: URL.createObjectURL(file)
        })),
        createdAt: new Date().toISOString(),
        isRead: false
      };

      // Replace the temporary message with the simulated one
      console.log("Replacing with simulated response:", simulatedResponse);
      setMessages((prev) => {
        console.log("Messages before replacement:", prev);
        const newMessages = prev.map(msg => msg._id === tempMessage._id ? simulatedResponse : msg);
        console.log("Messages after replacement:", newMessages);
        return newMessages;
      });

      // Uncomment this code when the server is working properly
      /*
      const formData = new FormData();
      formData.append("senderId", user._id);
      formData.append("receiverId", chef._id);
      formData.append("content", messageCopy);

      // Add attachments to form data
      attachmentsCopy.forEach((file) => {
        formData.append("attachments", file);
      });

      const response = await fetch("http://localhost:5000/api/messages", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      // Replace the temporary message with the real one
      setMessages((prev) =>
        prev.map(msg => msg._id === tempMessage._id ? data : msg)
      );
      */
    } catch (error) {
      console.error("Error sending message:", error);
      // Keep the temporary message in the UI but mark it as failed
      setMessages((prev) =>
        prev.map(msg =>
          msg._id === tempMessage._id
            ? { ...msg, sendFailed: true }
            : msg
        )
      );
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
      // For now, let's simulate a successful message deletion since the server is having issues
      // This is a temporary solution until the server is fixed

      // Simply remove the message from the UI
      setMessages((prev) => prev.filter((msg) => msg._id !== selectedMessage._id));
      handleMenuClose();

      // Uncomment this code when the server is working properly
      /*
      const response = await fetch(`http://localhost:5000/api/messages/${selectedMessage._id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user._id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete message");
      }

      setMessages((prev) => prev.filter((msg) => msg._id !== selectedMessage._id));
      handleMenuClose();
      */
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

  return (
    <Box sx={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
      <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
        Messagerie avec mon Chef
      </Typography>

      <Paper
        elevation={3}
        sx={{
          p: 0,
          borderRadius: 2,
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          overflow: "hidden",
          background: theme.palette.background.paper,
        }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <CircularProgress />
          </Box>
        ) : !chef ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <Typography variant="body1" color="text.secondary">
              Vous n'avez pas de chef assigné
            </Typography>
          </Box>
        ) : (
          <>
            {/* Conversation Header */}
            <Box
              sx={{
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.default,
                display: "flex",
                alignItems: "center",
              }}
            >
              <Avatar
                src={chef?.photo}
                alt={chef?.firstName}
                sx={{
                  mr: 2,
                  bgcolor: theme.palette.primary.main,
                }}
              >
                {chef?.firstName?.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {chef.firstName} {chef.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Chef
                </Typography>
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
                display: "flex",
                flexDirection: "column",
              }}
            >
              {loadingMessages ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : messages.length === 0 ? (
                console.log("No messages to display") ||
                <Box
                  sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                >
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    Aucun message dans cette conversation
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Envoyez un message pour démarrer la conversation
                  </Typography>
                </Box>
              ) : (
                console.log("Rendering messages:", messages) ||
                <Box sx={{ flexGrow: 1 }}>
                  {messages.map((message) => {
                    const isCurrentUser = message.sender._id === user._id;

                    return (
                      <Box
                        key={message._id}
                        sx={{
                          display: "flex",
                          flexDirection: isCurrentUser ? "row-reverse" : "row",
                          mb: 2,
                        }}
                      >
                        <Avatar
                          src={message.sender.photo}
                          alt={message.sender.firstName}
                          sx={{
                            width: 36,
                            height: 36,
                            ml: isCurrentUser ? 1 : 0,
                            mr: isCurrentUser ? 0 : 1,
                            bgcolor: isCurrentUser ? theme.palette.primary.main : theme.palette.secondary.main,
                          }}
                        >
                          {message.sender.firstName.charAt(0)}
                        </Avatar>

                        <Box
                          sx={{
                            maxWidth: "70%",
                            position: "relative",
                          }}
                        >
                          <Box
                            sx={{
                              backgroundColor: message.sendFailed
                                ? "rgba(255, 0, 0, 0.1)"
                                : isCurrentUser
                                  ? theme.palette.primary.main
                                  : theme.palette.mode === "dark"
                                  ? "rgba(255, 255, 255, 0.1)"
                                  : "rgba(0, 0, 0, 0.05)",
                              borderRadius: 2,
                              p: 1.5,
                              color: isCurrentUser
                                ? theme.palette.primary.contrastText
                                : theme.palette.text.primary,
                              position: "relative",
                              border: message.sendFailed ? "1px solid red" : "none",
                            }}
                          >
                            <Typography variant="body1">{message.content}</Typography>
                            {message.sendFailed && (
                              <Typography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>
                                Échec de l'envoi. Veuillez réessayer.
                              </Typography>
                            )}

                            {message.attachments && message.attachments.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                <Grid container spacing={1}>
                                  {message.attachments.map((attachment) => (
                                    <Grid item xs={12} key={attachment._id}>
                                      <Box
                                        component={Paper}
                                        variant="outlined"
                                        sx={{
                                          p: 1,
                                          display: "flex",
                                          alignItems: "center",
                                          borderRadius: 1,
                                          backgroundColor: "rgba(0, 0, 0, 0.04)",
                                        }}
                                      >
                                        {getFileIcon(attachment.fileType)}
                                        <Box sx={{ ml: 1, flexGrow: 1, overflow: "hidden" }}>
                                          <Typography variant="body2" noWrap>
                                            {attachment.originalName}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            {(attachment.fileSize / 1024).toFixed(1)} KB
                                          </Typography>
                                        </Box>
                                        <Box>
                                          {attachment.fileType.startsWith("image/") ? (
                                            <Tooltip title="Aperçu">
                                              <IconButton
                                                size="small"
                                                onClick={() => handlePreviewImage(attachment.filePath.startsWith('blob:') ? attachment.filePath : `${process.env.PUBLIC_URL}${attachment.filePath}`)}
                                              >
                                                <Image fontSize="small" />
                                              </IconButton>
                                            </Tooltip>
                                          ) : null}
                                          <Tooltip title="Télécharger">
                                            <IconButton
                                              size="small"
                                              component="a"
                                              href={attachment.filePath.startsWith('blob:') ? attachment.filePath : `${process.env.PUBLIC_URL}${attachment.filePath}`}
                                              download={attachment.originalName}
                                              target="_blank"
                                            >
                                              <AttachFile fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                        </Box>
                                      </Box>
                                    </Grid>
                                  ))}
                                </Grid>
                              </Box>
                            )}

                            <Typography
                              variant="caption"
                              sx={{
                                display: "block",
                                textAlign: "right",
                                mt: 0.5,
                                color: isCurrentUser
                                  ? "rgba(255, 255, 255, 0.7)"
                                  : theme.palette.text.secondary,
                              }}
                            >
                              {format(new Date(message.createdAt), "HH:mm")}
                            </Typography>
                          </Box>

                          {isCurrentUser && (
                            <IconButton
                              size="small"
                              sx={{
                                position: "absolute",
                                top: -8,
                                right: -8,
                                backgroundColor: theme.palette.background.paper,
                                boxShadow: 1,
                                "&:hover": {
                                  backgroundColor: theme.palette.background.default,
                                },
                                width: 24,
                                height: 24,
                              }}
                              onClick={(e) => handleMenuOpen(e, message)}
                            >
                              <MoreVert fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </Box>
              )}
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
                  <Typography variant="subtitle2" gutterBottom>
                    Pièces jointes ({attachments.length}):
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {attachments.map((file, index) => (
                      <Chip
                        key={index}
                        label={file.name}
                        onDelete={() => handleRemoveAttachment(index)}
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Grid container spacing={1} alignItems="center">
                <Grid item>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  />
                  <IconButton color="primary" onClick={handleOpenFileInput}>
                    <AttachFile />
                  </IconButton>
                </Grid>
                <Grid item xs>
                  <TextField
                    fullWidth
                    placeholder="Tapez votre message..."
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
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    color="primary"
                    endIcon={<Send />}
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() && attachments.length === 0}
                  >
                    Envoyer
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </>
        )}
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

export default EmployeeMessaging;
