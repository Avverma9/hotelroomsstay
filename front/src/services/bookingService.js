import apiClient from '../utils/apiInterceptor';

export const createBookingRequest = async (userId, hotelId, payload) => {
  const response = await apiClient.post(`/booking/${userId}/${hotelId}`, payload);
  return response.data ?? response;
};

export const createPaymentOrder = async (amountInRupees) => {
  const response = await apiClient.post('/create-order', {
    amount: Math.round(Math.max(amountInRupees, 0) * 100),
  });
  return response.data ?? response;
};

export const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export const openRazorpayCheckout = (options) => {
  if (!window.Razorpay) {
    throw new Error('Razorpay SDK is not loaded');
  }
  const razorpay = new window.Razorpay(options);
  razorpay.open();
  return razorpay;
};
