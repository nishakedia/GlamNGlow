// Native (Android/iOS) Razorpay Checkout. Requires a development or production build —
// react-native-razorpay is not bundled in Expo Go. The web build uses razorpay.web.ts instead.
import RazorpayCheckout from 'react-native-razorpay';

import type { RazorpayOptions, RazorpaySuccess } from './razorpay.types';

export type { RazorpayOptions, RazorpaySuccess };

export async function openRazorpayCheckout(options: RazorpayOptions): Promise<RazorpaySuccess> {
  try {
    return (await RazorpayCheckout.open(options)) as RazorpaySuccess;
  } catch (e) {
    const err = e as { code?: number; description?: string };
    // code 0/2 = user closed the sheet
    throw new Error(err.description || 'Payment was cancelled');
  }
}
