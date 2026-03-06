import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

// ==================== CREEM WEBHOOK ====================

http.route({
  path: "/creem-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // 1. Read raw body
    const body = await request.text();

    // 2. Verify HMAC-SHA256 signature
    const signature = request.headers.get("x-creem-signature");
    const webhookSecret = process.env.CREEM_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("CREEM_WEBHOOK_SECRET not configured");
      return new Response("Server configuration error", { status: 500 });
    }

    if (!signature) {
      return new Response("Missing signature", { status: 401 });
    }

    const isValid = await verifyHmacSignature(body, signature, webhookSecret);
    if (!isValid) {
      return new Response("Invalid signature", { status: 401 });
    }

    // 3. Parse event
    let event: any;
    try {
      event = JSON.parse(body);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const eventId = event.id || event.event_id;
    const eventType = event.event_type || event.type;

    if (!eventId || !eventType) {
      return new Response("Missing event ID or type", { status: 400 });
    }

    // 4. Idempotency check
    const alreadyProcessed = await ctx.runQuery(
      internal.payments.checkWebhookProcessed,
      { eventId }
    );
    if (alreadyProcessed) {
      return new Response("OK", { status: 200 });
    }

    // 5. Route by event type
    const data = event.data || event;

    try {
      switch (eventType) {
        case "checkout.completed": {
          const userId = data.metadata?.userId;
          if (!userId) {
            console.error("checkout.completed: missing userId in metadata");
            break;
          }
          await ctx.runMutation(internal.payments.upsertSubscription, {
            userId,
            creemSubscriptionId:
              data.subscription_id || data.id || "",
            creemCustomerId: data.customer_id || "",
            status: data.trial_end ? "trialing" : "active",
            currentPeriodStart: Date.now(),
            currentPeriodEnd: data.current_period_end
              ? new Date(data.current_period_end).getTime()
              : Date.now() + 30 * 24 * 60 * 60 * 1000,
            trialEnd: data.trial_end
              ? new Date(data.trial_end).getTime()
              : undefined,
          });
          break;
        }

        case "subscription.active": {
          const subId = data.subscription_id || data.id;
          if (subId) {
            await ctx.runMutation(
              internal.payments.updateSubscriptionByCreemId,
              {
                creemSubscriptionId: subId,
                status: "active",
              }
            );
          }
          break;
        }

        case "subscription.paid": {
          const subId = data.subscription_id || data.id;
          if (subId) {
            await ctx.runMutation(
              internal.payments.updateSubscriptionByCreemId,
              {
                creemSubscriptionId: subId,
                status: "active",
                currentPeriodStart: data.current_period_start
                  ? new Date(data.current_period_start).getTime()
                  : Date.now(),
                currentPeriodEnd: data.current_period_end
                  ? new Date(data.current_period_end).getTime()
                  : Date.now() + 30 * 24 * 60 * 60 * 1000,
              }
            );
          }
          break;
        }

        case "subscription.canceled": {
          const subId = data.subscription_id || data.id;
          if (subId) {
            await ctx.runMutation(
              internal.payments.updateSubscriptionByCreemId,
              {
                creemSubscriptionId: subId,
                cancelAtPeriodEnd: true,
              }
            );
          }
          break;
        }

        case "subscription.past_due": {
          const subId = data.subscription_id || data.id;
          if (subId) {
            await ctx.runMutation(
              internal.payments.updateSubscriptionByCreemId,
              {
                creemSubscriptionId: subId,
                status: "past_due",
              }
            );
          }
          break;
        }

        case "subscription.expired": {
          const subId = data.subscription_id || data.id;
          if (subId) {
            await ctx.runMutation(
              internal.payments.updateSubscriptionByCreemId,
              {
                creemSubscriptionId: subId,
                status: "expired",
              }
            );
          }
          break;
        }

        default:
          console.log(`Unhandled webhook event type: ${eventType}`);
      }
    } catch (error) {
      console.error(`Error processing webhook event ${eventType}:`, error);
      return new Response("Processing error", { status: 500 });
    }

    // 6. Record event for idempotency
    await ctx.runMutation(internal.payments.recordWebhookEvent, {
      eventId,
      eventType,
    });

    return new Response("OK", { status: 200 });
  }),
});

// ==================== HMAC VERIFICATION ====================

async function verifyHmacSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(body)
  );

  const expectedSignature = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return signature === expectedSignature;
}

export default http;
