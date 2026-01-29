import React from 'react';
import { Box, Typography, Stack, Paper, styled, useTheme } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const TimelineContainer = styled(Box)(({ theme }) => ({
    position: 'relative',
    padding: theme.spacing(2, 0, 2, 4),
    [theme.breakpoints.up('sm')]: {
        padding: theme.spacing(3, 0, 3, 5),
    },
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 20,
        width: 2,
        height: '100%',
        backgroundColor: theme.palette.divider,
        [theme.breakpoints.up('sm')]: {
            left: 24,
        },
    },
}));

const TimelineItem = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    position: 'relative',
    marginBottom: theme.spacing(3),
    '&:last-child': {
        marginBottom: 0,
    },
}));

const TimelineMarker = styled(Box)(({ theme }) => ({
    position: 'absolute',
    left: 20,
    transform: 'translateX(-50%)',
    top: 5,
    zIndex: 1,
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.background.paper,
    borderRadius: '50%',
    padding: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    [theme.breakpoints.up('sm')]: {
        left: 24,
    },
}));

const DayCard = styled(Paper)(({ theme }) => ({
    flexGrow: 1,
    padding: theme.spacing(2),
    borderRadius: theme.spacing(1),
    marginLeft: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
        marginLeft: theme.spacing(3),
    },
}));

const DayWiseItinerary = ({ data }) => {
    const theme = useTheme();

    if (!data?.dayWise || data.dayWise.length === 0) {
        return (
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                    Day-by-Day Itinerary
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                    Itinerary details are not available for this package.
                </Typography>
            </Paper>
        );
    }

    return (
        <Box sx={{ p: { xs: 1, sm: 2 } }}>
            <Typography
                variant="h5"
                fontWeight="bold"
                textAlign="center"
                sx={{ mb: 4 }}
            >
                Day-by-Day Itinerary
            </Typography>

            <TimelineContainer>
                {data.dayWise.map((item) => (
                    <TimelineItem key={item.day}>
                        <TimelineMarker>
                            <CheckCircleOutlineIcon fontSize="small" />
                        </TimelineMarker>
                        <DayCard variant="outlined">
                            <Stack spacing={1}>
                                <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                                    Day {item.day}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                                    {item.description}
                                </Typography>
                            </Stack>
                        </DayCard>
                    </TimelineItem>
                ))}
            </TimelineContainer>
        </Box>
    );
};

export default DayWiseItinerary;