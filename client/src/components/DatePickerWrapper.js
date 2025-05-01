import React from 'react';
import { TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';

/**
 * A wrapper component for DatePicker that uses a simpler approach
 * This avoids context issues by using a more direct implementation
 */
const DatePickerWrapper = (props) => {
  // Extract the slotProps to handle the textField configuration
  const { slotProps, ...otherProps } = props;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <DatePicker
        {...otherProps}
        slotProps={{
          ...slotProps,
          textField: {
            fullWidth: true,
            variant: "outlined",
            ...(slotProps?.textField || {})
          }
        }}
      />
    </LocalizationProvider>
  );
};

export default DatePickerWrapper;
