import React, { useEffect, useState } from 'react';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const RangeSlider = ({ minValue, maxValue, onChange }) => {
  // Local state to track the current slider range values
  const [value, setValue] = useState([minValue, maxValue]);

  // Update local state if the minValue/maxValue props change
  useEffect(() => {
    setValue([minValue, maxValue]);
  }, [minValue, maxValue]);

  // Handler when slider values change
  const handleSliderChange = (event, newValue) => {
    setValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <Box sx={{ width: 300, padding: 2 }}>
      <Typography gutterBottom>Range Slider</Typography>
      <Slider
        value={value}
        onChange={handleSliderChange}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) => `${value}`}
        min={minValue}  // Set min value dynamically
        max={maxValue}  // Set max value dynamically
        step={1}
        marks
      />
      <Typography variant="body2" sx={{ marginTop: 2 }}>
        Selected Range: {value[0]} - {value[1]}
      </Typography>
    </Box>
  );
};

export default RangeSlider;
