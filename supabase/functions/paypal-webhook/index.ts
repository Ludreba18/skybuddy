import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PAYPAL_API_BASE = Deno.env.get("PAYPAL_MODE") === "live" 
  ? "https://api-m.paypal.com" 
  : "https://api-m.sandbox.paypal.com";

const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://sky-together-fly.lovable.app";

async function getPayPalAccessToken(): Promise<string> {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured");
  }

  const auth = btoa(`${clientId}:${clientSecret}`);
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get PayPal access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function verifyWebhookSignature(
  req: Request,
  body: string,
  webhookId: string
): Promise<boolean> {
  const transmissionId = req.headers.get("PAYPAL-TRANSMISSION-ID");
  const transmissionTime = req.headers.get("PAYPAL-TRANSMISSION-TIME");
  const certUrl = req.headers.get("PAYPAL-CERT-URL");
  const transmissionSig = req.headers.get("PAYPAL-TRANSMISSION-SIG");
  const authAlgo = req.headers.get("PAYPAL-AUTH-ALGO");

  // All headers are required for verification
  if (!transmissionId || !transmissionTime || !certUrl || !transmissionSig || !authAlgo) {
    console.error("Missing required PayPal webhook headers");
    return false;
  }

  try {
    const accessToken = await getPayPalAccessToken();
    
    const verifyResponse = await fetch(
      `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transmission_id: transmissionId,
          transmission_time: transmissionTime,
          cert_url: certUrl,
          auth_algo: authAlgo,
          transmission_sig: transmissionSig,
          webhook_id: webhookId,
          webhook_event: JSON.parse(body),
        }),
      }
    );

    if (!verifyResponse.ok) {
      const error = await verifyResponse.text();
      console.error("PayPal webhook verification API error:", error);
      return false;
    }

    const result = await verifyResponse.json();
    const isValid = result.verification_status === "SUCCESS";
    
    if (!isValid) {
      console.error("PayPal webhook signature verification failed:", result.verification_status);
    }
    
    return isValid;
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return false;
  }
}

async function verifySubscription(accessToken: string, subscriptionId: string): Promise<{ status: string; customId: string }> {
  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to verify subscription: ${error}`);
  }

  const subscription = await response.json();
  return {
    status: subscription.status,
    customId: subscription.custom_id,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const profileId = url.searchParams.get("profile_id");
  const subscriptionId = url.searchParams.get("subscription_id");

  // Handle return from PayPal after successful subscription
  // SECURITY: Always require and verify subscription_id before granting access
  if (action === "success" && profileId) {
    try {
      // Get the subscription ID from the URL (PayPal adds it)
      const subId = subscriptionId || url.searchParams.get("subscription_id");

      // SECURITY FIX: Always require subscription_id for verification
      // Never grant premium access without PayPal API verification
      if (!subId) {
        console.error("No subscription_id in success callback - redirecting to processing page");
        // Redirect to a processing page - webhook will activate account when it arrives
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${FRONTEND_URL}/subscribe?status=processing`,
          },
        });
      }

      // ALWAYS verify the subscription with PayPal API before granting access
      const accessToken = await getPayPalAccessToken();
      const { status, customId } = await verifySubscription(accessToken, subId);

      // Verify subscription is active AND belongs to the correct user
      if (status !== "ACTIVE") {
        console.error(`Subscription ${subId} is not active (status: ${status})`);
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${FRONTEND_URL}/subscribe?error=subscription_not_active`,
          },
        });
      }

      if (customId !== profileId) {
        console.error(`Subscription ${subId} custom_id mismatch: expected ${profileId}, got ${customId}`);
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${FRONTEND_URL}/subscribe?error=verification_failed`,
          },
        });
      }

      // Subscription verified - now safe to grant premium access
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { error } = await supabase
        .from("profiles")
        .update({
          membership_tier: "premium",
          membership_expires_at: null, // Subscription-based, no fixed expiry
        })
        .eq("id", profileId);

      if (error) {
        console.error("Error updating profile:", error);
      }

      // Redirect to dashboard with success
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${FRONTEND_URL}/dashboard?subscription=success`,
        },
      });
    } catch (error) {
      console.error("Error processing success callback:", error);
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${FRONTEND_URL}/subscribe?error=processing`,
        },
      });
    }
  }

  // Handle PayPal webhook events
  if (req.method === "POST") {
    try {
      // Read body as text first for signature verification
      const bodyText = await req.text();
      
      // Verify webhook signature before processing
      const webhookId = Deno.env.get("PAYPAL_WEBHOOK_ID");
      
      if (!webhookId) {
        console.error("PAYPAL_WEBHOOK_ID not configured - cannot verify webhook");
        return new Response(
          JSON.stringify({ error: "Webhook verification not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const isValidSignature = await verifyWebhookSignature(req, bodyText, webhookId);
      
      if (!isValidSignature) {
        console.error("Invalid PayPal webhook signature - rejecting request");
        return new Response(
          JSON.stringify({ error: "Invalid webhook signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Parse the verified body
      const body = JSON.parse(bodyText);
      const eventType = body.event_type;

      console.log("PayPal webhook event (verified):", eventType);

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      if (eventType === "BILLING.SUBSCRIPTION.ACTIVATED") {
        const profileId = body.resource?.custom_id;
        if (profileId) {
          await supabase
            .from("profiles")
            .update({
              membership_tier: "premium",
              membership_expires_at: null,
            })
            .eq("id", profileId);
        }
      } else if (eventType === "BILLING.SUBSCRIPTION.CANCELLED" || 
                 eventType === "BILLING.SUBSCRIPTION.SUSPENDED" ||
                 eventType === "BILLING.SUBSCRIPTION.EXPIRED") {
        const profileId = body.resource?.custom_id;
        if (profileId) {
          await supabase
            .from("profiles")
            .update({
              membership_tier: "free",
              membership_expires_at: new Date().toISOString(),
            })
            .eq("id", profileId);
        }
      }

      return new Response(
        JSON.stringify({ received: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Webhook error:", error);
      return new Response(
        JSON.stringify({ error: "Webhook processing failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: "Invalid request" }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
