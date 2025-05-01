// src/components/SimpleDateInput.js
import React from 'react';
import { TextField } from '@mui/material';
import { format, parse } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * A simple date input component that doesn't rely on MUI's DatePicker
 */
const SimpleDateInput = ({ 
  label, 
  value, 
  onChange, 
  minDate, 
  required = false,
  fullWidth = true,
  variant = "outlined"
}) => {
  // Format the date as a string for display
  const dateString = value ? format(value, 'yyyy-MM-dd') : '';
  
  // Handle changes to the input
  const handleChange = (e) => {
    const newDateString = e.target.value;
    
    if (!newDateString) {
      onChange(null);
      return;
    }
    
    try {
      // Parse the date string into a Date object
      const newDate = parse(newDateString, 'yyyy-MM-dd', new Date());
      
      // Check if the date is valid and meets the minimum date requirement
      if (isNaN(newDate.getTime())) {
        return;
      }
      
      if (minDate && newDate < minDate) {
        return;
      }
      
      onChange(newDate);
    } catch (error) {
      console.error('Error parsing date:', error);
    }
  };
  
  return (
    <TextField
      label={label}
      type="date"
      value={dateString}
      onChange={handleChange}
      fullWidth={fullWidth}
      variant={variant}
      required={required}
      InputLabelProps={{
        shrink: true,
      }}
    />
  );
};

export default SimpleDateInput;
