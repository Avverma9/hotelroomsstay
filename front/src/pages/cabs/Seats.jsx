import React, { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  TextField,
  Typography,
  Grid,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Stack,
  CircularProgress,
} from "@mui/material";
import {
  EventSeat,
  Close,
  Person,
  Phone,
  Email,
  AirlineSeatReclineNormal,
} from "@mui/icons-material";
import { toast } from "react-toastify";


import { bookSeat, getSeatsData } from "../../redux/slices/car";

const Seat = ({ seat, onSeatClick, isSelected }) => {
  const getSeatStyle = () => {
    if (seat.isBooked) {
      return {
        bgcolor: "grey.400",
        color: "grey.800",
        cursor: "not-allowed",
        border: "1px solid #bdbdbd",
      };
    }
    if (isSelected) {
      return {
        bgcolor: "primary.main",
        color: "primary.contrastText",
        "&:hover": { bgcolor: "primary.dark" },
        transform: "scale(1.1)",
        boxShadow: 3,
      };
    }
    return {
      bgcolor: "white",
      color: "text.primary",
      border: "1px solid #ccc",
      "&:hover": { bgcolor: "grey.200" },
    };
  };

  return (
    <Tooltip
      title={
        seat.isBooked
          ? `Booked`
          : `Seat ${seat.seatNumber} - ₹${seat.seatPrice}`
      }
      placement="top"
    >
      <Box
        onClick={() => onSeatClick(seat)}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 1.5,
          textAlign: "center",
          transition: "all 0.2s ease-in-out",
          width: 42,
          height: 42,
          userSelect: "none",
          ...getSeatStyle(),
        }}
      >
        <EventSeat sx={{ fontSize: 22 }} />
        <Typography
          variant="caption"
          sx={{ lineHeight: 1, fontSize: "0.6rem" }}
        >
          {seat.seatNumber}
        </Typography>
      </Box>
    </Tooltip>
  );
};

Seat.propTypes = {
  seat: PropTypes.object.isRequired,
  onSeatClick: PropTypes.func.isRequired,
  isSelected: PropTypes.bool.isRequired,
};

const SeatLegend = () => (
  <Stack direction="row" spacing={2} justifyContent="center" mb={2}>
    <Box display="flex" alignItems="center" gap={1}>
      <Box
        sx={{
          width: 16,
          height: 16,
          bgcolor: "white",
          border: 1,
          borderColor: "grey.400",
          borderRadius: 0.5,
        }}
      />
      <Typography variant="caption">Available</Typography>
    </Box>
    <Box display="flex" alignItems="center" gap={1}>
      <Box
        sx={{
          width: 16,
          height: 16,
          bgcolor: "primary.main",
          border: 1,
          borderColor: "primary.dark",
          borderRadius: 0.5,
        }}
      />
      <Typography variant="caption">Selected</Typography>
    </Box>
    <Box display="flex" alignItems="center" gap={1}>
      <Box
        sx={{
          width: 16,
          height: 16,
          bgcolor: "grey.400",
          border: 1,
          borderColor: "grey.600",
          borderRadius: 0.5,
        }}
      />
      <Typography variant="caption">Booked</Typography>
    </Box>
  </Stack>
);

export default function SeatData({ open, onClose, id, carData }) {
  const dispatch = useDispatch();
  const seatData = useSelector((state) => state.car.seatsData);
  const gstData = useSelector((state) => state.gst.gst);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    if (id && open) {
      dispatch(getSeatsData(id));
    } else {
      setSelectedSeats([]);
    }
  }, [id, open, dispatch]);

  const basePrice = selectedSeats.reduce(
    (sum, seat) => sum + seat.seatPrice,
    0,
  );

  useEffect(() => {
    if (basePrice > 0) {
      const payload = { type: "Travel", gstThreshold: basePrice };
     axios.get(
      `${localUrl}/gst/get-single-gst?type=${payload?.type}&gstThreshold=${payload?.gstThreshold}`,
      {
        headers: { Authorization: token },
      }
    );
    }
  }, [basePrice, dispatch]);

  const handleSeatClick = useCallback((seat) => {
    if (seat.isBooked) return;
    setSelectedSeats((prevSelected) => {
      const isSelected = prevSelected.find((s) => s._id === seat._id);
      if (isSelected) {
        return prevSelected.filter((s) => s._id !== seat._id);
      }
      return [...prevSelected, seat];
    });
  }, []);

  const handleOpenBookingDialog = () => {
    if (selectedSeats.length > 0) {
      setIsBookingDialogOpen(true);
    }
  };

  const handleBooking = async () => {
    if (!customerName || !customerMobile || !customerEmail) {
      toast.error("Please fill in all customer details.");
      return;
    }
    setIsBooking(true);
    try {
      const seatIds = selectedSeats.map((seat) => seat._id);
      await dispatch(
        bookSeat({
          seats: seatIds,
          carId: id,
          bookedBy: customerName,
          sharingType: carData.sharingType,
          vehicleType: carData.vehicleType,
          vehicleNumber: carData?.vehicleNumber,
          customerMobile: customerMobile,
          customerEmail: customerEmail,
        }),
      ).unwrap();

      window.location.reload();

    } catch (error) {
      console.error(error.message || "Booking failed. Please try again.");
      setIsBooking(false);
    }
  };

  const gstPercentage = gstData?.gstPrice || 0;
  const gstAmount = basePrice * (gstPercentage / 100);
  const totalPrice = basePrice + gstAmount;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: { borderRadius: 4, height: "auto", maxHeight: "95vh" },
        }}
      >
        <DialogTitle sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6" fontWeight="600">
              Select Your Seats
            </Typography>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: "grey.50" }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <SeatLegend />
                <Box
                  sx={{
                    p: 3,
                    pt: 6,
                    mt: 2,
                    border: "3px solid #b0bec5",
                    borderBottomWidth: "15px",
                    borderRadius: "60px 60px 10px 10px",
                    position: "relative",
                    bgcolor: "#eceff1",
                    height: "100%",
                    "::before, ::after": {
                      content: '""',
                      position: "absolute",
                      bottom: "-25px",
                      width: "50px",
                      height: "20px",
                      border: "3px solid #b0bec5",
                      borderRadius: "0 0 25px 25px",
                      borderTop: "none",
                      zIndex: -1,
                    },
                    "::before": { left: "15%" },
                    "::after": { right: "15%" },
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: 15,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "60%",
                      height: "25px",
                      bgcolor: "transparent",
                      border: "3px solid #b0bec5",
                      borderTop: "none",
                      borderRadius: "0 0 20px 20px",
                    }}
                  />
                  <Box sx={{ position: "absolute", top: 12, left: 15 }}>
                    <Tooltip title="Driver">
                      <AirlineSeatReclineNormal
                        sx={{
                          fontSize: 32,
                          color: "grey.600",
                          transform: "rotate(-90deg)",
                        }}
                      />
                    </Tooltip>
                  </Box>
                  <Box
                    sx={{
                      p: 1,
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr) 45px repeat(3, 1fr)",
                      gap: { xs: 1, sm: 1.5 },
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {seatData[0]?.seats?.map((seat) => (
                      <Seat
                        key={seat._id}
                        seat={seat}
                        onSeatClick={handleSeatClick}
                        isSelected={selectedSeats.some(
                          (s) => s._id === seat._id,
                        )}
                      />
                    ))}
                  </Box>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={5}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Booking Summary
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ mb: 2, flexGrow: 1 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Selected Seats:
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 0.5,
                      minHeight: 32,
                    }}
                  >
                    {selectedSeats.length > 0 ? (
                      selectedSeats.map((seat) => (
                        <Chip
                          key={seat._id}
                          label={seat.seatNumber}
                          size="small"
                        />
                      ))
                    ) : (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ p: 1 }}
                      >
                        Please select a seat to booking
                      </Typography>
                    )}
                  </Box>
                </Box>
                {selectedSeats.length > 0 && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Pricing Details:
                    </Typography>
                    <Stack spacing={0.5}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Base Price</Typography>
                        <Typography variant="body2">
                          ₹{basePrice.toFixed(2)}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">
                          GST ({gstPercentage}%)
                        </Typography>
                        <Typography variant="body2">
                          ₹{gstAmount.toFixed(2)}
                        </Typography>
                      </Box>
                    </Stack>
                    <Divider sx={{ my: 1.5 }} />
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography variant="h6" fontWeight="bold">
                        Total Price
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        ₹{totalPrice.toFixed(2)}
                      </Typography>
                    </Box>
                  </>
                )}
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleOpenBookingDialog}
                  disabled={selectedSeats.length === 0}
                  sx={{ mt: "auto", py: 1.5 }}
                >
                  Book Now ({selectedSeats.length})
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isBookingDialogOpen}
        onClose={() => setIsBookingDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight="bold">Enter Customer Details</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Customer Name"
            type="text"
            fullWidth
            variant="outlined"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            InputProps={{
              startAdornment: <Person sx={{ color: "action.active", mr: 1 }} />,
            }}
          />
          <TextField
            margin="dense"
            label="Customer Mobile"
            type="tel"
            fullWidth
            variant="outlined"
            value={customerMobile}
            onChange={(e) => setCustomerMobile(e.target.value)}
            InputProps={{
              startAdornment: <Phone sx={{ color: "action.active", mr: 1 }} />,
            }}
          />
          <TextField
            margin="dense"
            label="Customer Email"
            type="email"
            fullWidth
            variant="outlined"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            InputProps={{
              startAdornment: <Email sx={{ color: "action.active", mr: 1 }} />,
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsBookingDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleBooking}
            variant="contained"
            disabled={
              !customerName || !customerMobile || !customerEmail || isBooking
            }
            startIcon={
              isBooking ? <CircularProgress size={20} color="inherit" /> : null
            }
          >
            {isBooking ? "Confirming..." : "Confirm Booking"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

SeatData.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  id: PropTypes.string,
  carData: PropTypes.object,
};
