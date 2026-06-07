"use client";

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useState } from "react";

import { getStripePromise } from "@/lib/stripe/browser";

type PaymentFormProps = {
  clientSecret: string;
  onSuccess: () => void;
  onError?: (message: string) => void;
};

function CheckoutForm({ onSuccess, onError }: Omit<PaymentFormProps, "clientSecret">) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    setLoading(false);

    if (error) {
      onError?.(error.message ?? "Payment setup failed.");
      return;
    }

    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      <p className="text-center text-xs text-[#9a6d95]">
        Your card will not be charged until after your 15-day free trial ends.
      </p>
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full rounded-xl bg-gradient-to-r from-[#e87baa] to-[#7c5aad] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Saving card…" : "Save card & start trial"}
      </button>
    </form>
  );
}

export default function PaymentForm({ clientSecret, onSuccess, onError }: PaymentFormProps) {
  const stripePromise = getStripePromise();

  if (!stripePromise) {
    return (
      <p className="text-center text-sm text-[#9a6d95]">
        Payment setup is not configured. Your trial will start without a card on file.
      </p>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#e87baa",
            colorText: "#2d1a2e",
            borderRadius: "10px",
          },
        },
      }}
    >
      <CheckoutForm onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}
