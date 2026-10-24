export type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number; // paise
  currency: 'INR';
  name: string;
  description?: string;
  prefill?: { contact?: string; email?: string; name?: string };
  theme?: { color?: string };
};

export type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
