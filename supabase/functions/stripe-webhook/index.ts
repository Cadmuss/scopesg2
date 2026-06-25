import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

  if (!signature || !webhookSecret || !stripeKey) {
    return new Response("Missing configuration", { status: 400 });
  }

  const body = await req.text();

  let event;
  try {
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.order_id;

    console.log("Payment completed for order:", orderId);

    if (!orderId) {
      console.error("No order_id in session metadata");
      return new Response("No order_id", { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase
      .from("report_orders")
      .update({ status: "paid" })
      .eq("id", orderId);

    if (error) {
      console.error("Failed to update order:", error.message);
      return new Response("DB update failed", { status: 500 });
    }

    console.log("Order updated to paid:", orderId);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});