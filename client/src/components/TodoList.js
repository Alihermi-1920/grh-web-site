// src/components/TodoList.js
import React, { useState } from "react";
import {
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Fade,
} from "@mui/material";
import { Delete, Add } from "@mui/icons-material";

const TodoList = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");

  const handleAddTask = () => {
    if (newTask.trim() !== "") {
      const task = { id: Date.now(), text: newTask.trim() };
      setTasks((prev) => [...prev, task]);
      setNewTask("");
    }
  };

  const handleDeleteTask = (id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        mt: 4,
        borderRadius: 3,
        backgroundColor: "#fafafa",
        border: "1px solid #e0e0e0",
        boxShadow: "0px 2px 10px rgba(0,0,0,0.1)",
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold", mb: 3 }}>
        Ma Todo Liste
      </Typography>
      <Box sx={{ display: "flex", mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Nouvelle tâche"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          sx={{ backgroundColor: "#fff", borderRadius: 1 }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddTask}
          sx={{ ml: 2, textTransform: "none", borderRadius: 1 }}
          startIcon={<Add />}
        >
          Ajouter
        </Button>
      </Box>
      <List>
        {tasks.map((task, index) => (
          <Fade in={true} key={task.id}>
            <ListItem
              secondaryAction={
                <IconButton
                  edge="end"
                  color="error"
                  onClick={() => handleDeleteTask(task.id)}
                >
                  <Delete />
                </IconButton>
              }
              sx={{
                mb: 1,
                backgroundColor: "#fff",
                borderRadius: 1,
                boxShadow: "0px 1px 4px rgba(0,0,0,0.1)",
              }}
            >
              <ListItemText
                primary={`${index + 1}. ${task.text}`}
              />
            </ListItem>
          </Fade>
        ))}
      </List>
    </Paper>
  );
};

export default TodoList;
