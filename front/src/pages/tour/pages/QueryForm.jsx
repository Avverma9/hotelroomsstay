import React, { useState } from 'react';
import { Box, TextField, Typography, Button, IconButton, InputAdornment, Grid } from '@mui/material';
import {
    Person as PersonIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Add as AddIcon,
    Remove as RemoveIcon,
    LocationOn as LocationOnIcon,
    Flight as FlightIcon,
    Close as CloseIcon,
} from '@mui/icons-material';

const QueryForm = ({ onClose }) => {
    const [formData, setFormData] = useState({
        destination: 'Explore The Serene Kerala',
        name: '',
        mobile: '',
        email: '',
        adult: 2,
        child: 0,
        infant: 0,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleIncrement = (field) => {
        setFormData({ ...formData, [field]: formData[field] + 1 });
    };

    const handleDecrement = (field) => {
        if (formData[field] > 0) {
            setFormData({ ...formData, [field]: formData[field] - 1 });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        setTimeout(() => {
            setIsSubmitting(false);
            // Submit the form data to an API or handle it accordingly
        }, 2000);
    };

    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
                width: 'auto',
                maxWidth: '100%',
                padding: 3,
                backgroundColor: 'white',
                borderRadius: 2,
                boxShadow: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                position: 'relative', // For positioning close button
            }}
        >
            {/* Close Button at the top-right corner */}
            <IconButton
                onClick={onClose}
                sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    color: 'gray',
                    '&:hover': { backgroundColor: 'transparent' },
                }}
            >
                <CloseIcon />
            </IconButton>
            <br />
            <Typography variant="h6" textAlign="center" sx={{ fontWeight: 'bold' }}>
                Want to Go For A Memorable Holiday?
            </Typography>

            <TextField
                label="Destination"
                value={formData.destination}
                onChange={(e) => handleInputChange('destination', e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <LocationOnIcon />
                        </InputAdornment>
                    ),
                }}
                fullWidth
                variant="outlined"
                sx={{
                    '& .MuiInputBase-root': {
                        borderRadius: 1,
                        backgroundColor: '#f9f9f9',
                    },
                }}
            />

            <Typography variant="subtitle1" fontWeight="bold">
                Personal Details
            </Typography>

            <TextField
                label="Name"
                placeholder="Enter Your Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <PersonIcon />
                        </InputAdornment>
                    ),
                }}
                fullWidth
                variant="outlined"
                sx={{
                    '& .MuiInputBase-root': {
                        borderRadius: 1,
                        backgroundColor: '#f9f9f9',
                    },
                }}
            />

            <TextField
                label="Mobile No."
                placeholder="Mobile No."
                value={formData.mobile}
                onChange={(e) => handleInputChange('mobile', e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <PhoneIcon />
                        </InputAdornment>
                    ),
                }}
                fullWidth
                variant="outlined"
                sx={{
                    '& .MuiInputBase-root': {
                        borderRadius: 1,
                        backgroundColor: '#f9f9f9',
                    },
                }}
            />

            <TextField
                label="Email ID"
                placeholder="Your E-Mail ID"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <EmailIcon />
                        </InputAdornment>
                    ),
                }}
                fullWidth
                variant="outlined"
                sx={{
                    '& .MuiInputBase-root': {
                        borderRadius: 1,
                        backgroundColor: '#f9f9f9',
                    },
                }}
            />

            <Box display="flex" justifyContent="space-between" alignItems="center">
                {['adult', 'child', 'infant'].map((category) => (
                    <Box key={category} textAlign="center">
                        <Typography variant="subtitle2" textTransform="capitalize">
                            {category}
                        </Typography>
                        <Box display="flex" alignItems="center" justifyContent="center">
                            <IconButton onClick={() => handleDecrement(category)} size="small">
                                <RemoveIcon />
                            </IconButton>
                            <Typography>{formData[category]}</Typography>
                            <IconButton onClick={() => handleIncrement(category)} size="small">
                                <AddIcon />
                            </IconButton>
                        </Box>
                    </Box>
                ))}
            </Box>

            <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                startIcon={isSubmitting ? <FlightIcon /> : null}
                disabled={isSubmitting}
                sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 1,
                    '&:hover': {
                        backgroundColor: '#1976d2',
                    },
                }}
            >
                {isSubmitting ? 'Submitting...' : 'Submit Your Query'}
                {isSubmitting && (
                    <Box
                        component="span"
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: 'auto',
                            height: 'auto',
                            background: 'rgba(255,255,255,0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            animation: 'flyPlane 2s linear infinite',
                        }}
                    >
                        <FlightIcon sx={{ fontSize: 30, color: '#1976d2' }} />
                    </Box>
                )}
            </Button>
        </Box>
    );
};

export default QueryForm;
