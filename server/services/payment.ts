import Razorpay from "razorpay";

let razorpay: Razorpay | null = null;

try {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_TEST_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_TEST_KEY_SECRET;
  
  if (keyId && keySecret) {
    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  } else {
    console.warn("Razorpay credentials not found. Payment functionality will be disabled.");
  }
} catch (error) {
  console.error("Failed to initialize Razorpay:", error);
}

export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

export async function createPaymentOrder(amount: number, receipt: string): Promise<PaymentOrder> {
  if (!razorpay) {
    throw new Error("Payment service not configured. Please set up Razorpay credentials.");
  }

  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: "INR",
      receipt,
    });

    return {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    };
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    throw new Error("Failed to create payment order");
  }
}

export async function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> {
  try {
    const crypto = require("crypto");
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_TEST_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    return expectedSignature === signature;
  } catch (error) {
    console.error("Payment verification error:", error);
    return false;
  }
}
