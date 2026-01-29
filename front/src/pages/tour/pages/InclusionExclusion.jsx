import React from 'react';
import { Box, Grid, Typography, Paper, Stack, Divider } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

const InclusionExclusion = ({ data }) => {
    const hasInclusions = data?.inclusion && data.inclusion.length > 0;
    const hasExclusions = data?.exclusion && data.exclusion.length > 0;

    return (
        <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 1, sm: 2 } }}>
            <Typography
                variant="h6"
                sx={{
                    textAlign: 'center',
                    mb: 4,
                    color: 'text.primary',
                }}
            >
                Inclusions & Exclusions
            </Typography>
            <Grid container spacing={{ xs: 2, md: 3 }}>
                {/* Inclusions Section */}
                <Grid item xs={12} md={6}>
                    <Paper
                        variant="outlined"
                        sx={{
                            height: '100%',
                            borderRadius: 2,
                            overflow: 'hidden', // Ensures inner content respects border radius
                            transition: 'box-shadow 0.3s',
                            '&:hover': {
                                boxShadow: (theme) => theme.shadows[2],
                            },
                        }}
                    >
                        <Box
                            sx={{
                                p: 1.5,
                                bgcolor: 'success.lighter',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <CheckCircleOutlineIcon sx={{ color: 'success.main' }} />
                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.darker' }}>
                                Inclusions
                            </Typography>
                        </Box>
                        <Divider />
                        <Stack spacing={1.5} sx={{ p: 2 }}>
                            {hasInclusions ? (
                                data.inclusion.map((item, index) => (
                                    <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                        <CheckCircleOutlineIcon sx={{ color: 'success.main', mt: '3px', fontSize: '1.1rem' }} />
                                        <Typography variant="body2" sx={{ color: 'text.secondary', overflowWrap: 'break-word' }}>
                                            {item}
                                        </Typography>
                                    </Box>
                                ))
                            ) : (
                                <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                                    No specific inclusions listed.
                                </Typography>
                            )}
                        </Stack>
                    </Paper>
                </Grid>

                {/* Exclusions Section */}
                <Grid item xs={12} md={6}>
                    <Paper
                        variant="outlined"
                        sx={{
                            height: '100%',
                            borderRadius: 2,
                            overflow: 'hidden',
                            transition: 'box-shadow 0.3s',
                            '&:hover': {
                                boxShadow: (theme) => theme.shadows[2],
                            },
                        }}
                    >
                        <Box
                            sx={{
                                p: 1.5,
                                bgcolor: 'error.lighter',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <HighlightOffIcon sx={{ color: 'error.main' }} />
                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.darker' }}>
                                Exclusions
                            </Typography>
                        </Box>
                        <Divider />
                        <Stack spacing={1.5} sx={{ p: 2 }}>
                            {hasExclusions ? (
                                data.exclusion.map((item, index) => (
                                    <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                        <HighlightOffIcon sx={{ color: 'error.main', mt: '3px', fontSize: '1.1rem' }} />
                                        <Typography variant="body2" sx={{ color: 'text.secondary', overflowWrap: 'break-word' }}>
                                            {item}
                                        </Typography>
                                    </Box>
                                ))
                            ) : (
                                <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                                    No specific exclusions listed.
                                </Typography>
                            )}
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default InclusionExclusion;