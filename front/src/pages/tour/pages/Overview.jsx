import React from 'react';
import { Box, Typography, Stack, Divider, Paper } from '@mui/material';
import DayWiseItinerary from './DayWise';
import InclusionExclusion from './InclusionExclusion';
import TermsAndCondition from './Terms&Condition';

const OverView = ({ data }) => {
    return (
        <Box sx={{ maxWidth: 1100, mx: 'auto', py: { xs: 2, sm: 4 } }}>
            <Paper sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 2 }}>
                <Stack
                    spacing={4}
                    divider={<Divider sx={{ my: 2 }} />} // Use Divider with vertical margin
                >
                    {/* Section 1: Package Overview */}
                    <Box>
                        <Typography
                            variant="h6"
                            sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}
                        >
                            Package Overview
                        </Typography>
                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ lineHeight: 1.7, overflowWrap: 'break-word' }}
                        >
                            {data?.overview || "No overview is available for this package."}
                        </Typography>
                    </Box>

                    {/* Section 2: Day Wise Itinerary */}
                    <DayWiseItinerary data={data} />

                    {/* Section 3: Inclusion & Exclusion */}
                    <InclusionExclusion data={data} />

                    {/* Section 4: Terms & Conditions */}
                    <TermsAndCondition data={data} />
                    
                </Stack>
            </Paper>
        </Box>
    );
};

export default OverView;