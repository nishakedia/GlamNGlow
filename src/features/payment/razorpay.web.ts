// Web Razorpay Checkout via checkout.js, so the free web deployment can take payments too.
import type { RazorpayOptions, RazorpaySuccess } from './razorpay.types';

export type { RazorpayOptions, RazorpaySuccess };

type RazorpayCtor = new (opts: object) => { open: () => void; on: (event: string, cb: (r: unknown) => void) => void };

function loadScript(): Promise<RazorpayCtor> {
  const w = window as unknown as { Razorpay?: RazorpayCtor };
  if (w.Razorpay) return Promise.resolve(w.Razorpay);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => (w.Razorpay ? resolve(w.Razorpay) : reject(new Error('Razorpay failed to load')));
    script.onerror = () => reject(new Error('Razorpay failed to load'));
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(options: RazorpayOptions): Promise<RazorpaySuccess> {
  const Razorpay = await loadScript();
  return new Promise((resolve, reject) => {
    const rzp = new Razorpay({
      ...options,
      handler: (response: RazorpaySuccess) => resolve(response),
      modal: { ondismiss: () => reject(new Error('Payment was cancelled')) },
    });
    rzp.on('payment.failed', (r) => {
      const err = r as { error?: { description?: string } };
      reject(new Error(err.error?.description ?? 'Payment failed'));
    });
    rzp.open();
  });
}
