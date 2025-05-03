import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  CloudUpload,
  InsertDriveFile,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';

const TestFileUpload = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadResult({
        success: false,
        message: 'Please select files to upload'
      });
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      // Create FormData
      const formData = new FormData();
      
      // Add files
      files.forEach(file => {
        formData.append('files', file);
      });

      // Upload files
      const response = await fetch('http://localhost:5000/api/files/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload files');
      }

      const data = await response.json();
      console.log('Upload response:', data);

      setUploadResult({
        success: true,
        message: `Successfully uploaded ${data.files.length} files`
      });

      setUploadedFiles(data.files);
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadResult({
        success: false,
        message: error.message || 'Failed to upload files'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Test File Upload
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ mb: 2 }}>
          <input
            type="file"
            multiple
            id="file-upload"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <label htmlFor="file-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<CloudUpload />}
              sx={{ mb: 2 }}
            >
              Select Files
            </Button>
          </label>

          {files.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">
                Selected Files ({files.length}):
              </Typography>
              <List dense>
                {files.map((file, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <InsertDriveFile />
                    </ListItemIcon>
                    <ListItemText
                      primary={file.name}
                      secondary={`${(file.size / 1024).toFixed(2)} KB - ${file.type}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          sx={{ mt: 2 }}
        >
          {uploading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : 'Upload Files'}
        </Button>
      </Paper>

      {uploadResult && (
        <Alert severity={uploadResult.success ? 'success' : 'error'} sx={{ mb: 3 }}>
          {uploadResult.message}
        </Alert>
      )}

      {uploadedFiles.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Uploaded Files
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List>
            {uploadedFiles.map((file, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText
                  primary={file.originalName}
                  secondary={
                    <>
                      <Typography variant="body2" component="span">
                        Path: {file.filePath}
                      </Typography>
                      <br />
                      <Typography variant="body2" component="span">
                        Type: {file.fileType}
                      </Typography>
                      <br />
                      <Typography variant="body2" component="span">
                        Size: {(file.fileSize / 1024).toFixed(2)} KB
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default TestFileUpload;
