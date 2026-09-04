import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PAYPAL_API_BASE = Deno.env.get("PAYPAL_MODE") === "live" 
  ? "https://api-m.paypal.com" 
  : "https://api-m.sandbox.paypal.com";

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

async function createSubscriptionPlan(accessToken: string): Promise<string> {
  // First, create a product if it doesn't exist
  const productResponse = await fetch(`${PAYPAL_API_BASE}/v1/catalogs/products`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `skybuddy-product-${Date.now()}`,
    },
    body: JSON.stringify({
      name: "SkyBuddy Mitgliedschaft",
      description: "Voller Zugang zur SkyBuddy Piloten-Community",
      type: "SERVICE",
      category: "SOFTWARE",
    }),
  });

  let productId: string;
  if (productResponse.ok) {
    const product = await productResponse.json();
    productId = product.id;
  } else {
    // Product might already exist, use a fixed ID
    productId = "SKYBUDDY-MEMBERSHIP";
  }

  // Create a subscription plan
  const planResponse = await fetch(`${PAYPAL_API_BASE}/v1/billing/plans`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `skybuddy-plan-${Date.now()}`,
    },
    body: JSON.stringify({
      product_id: productId,
      name: "SkyBuddy Monatsabo",
      description: "Monatliche Mitgliedschaft bei SkyBuddy",
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: {
            interval_unit: "MONTH",
            interval_count: 1,
          },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0, // Unlimited
          pricing_scheme: {
            fixed_price: {
              value: "9.99",
              currency_code: "EUR",
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: "CANCEL",
        payment_failure_threshold: 3,
      },
    }),
  });

  if (!planResponse.ok) {
    const error = await planResponse.text();
    throw new Error(`Failed to create subscription plan: ${error}`);
  }

  const plan = await planResponse.json();
  return plan.id;
}

async function createSubscription(accessToken: string, planId: string, profileId: string): Promise<{ approvalUrl: string; subscriptionId: string }> {
  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `skybuddy-sub-${profileId}-${Date.now()}`,
    },
    body: JSON.stringify({
      plan_id: planId,
      custom_id: profileId,
      application_context: {
        brand_name: "SkyBuddy",
        locale: "de-DE",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        return_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/paypal-webhook?action=success&profile_id=${profileId}`,
        cancel_url: `${Deno.env.get("FRONTEND_URL") || "https://sky-together-fly.lovable.app"}/subscribe?cancelled=true`,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create subscription: ${error}`);
  }

  const subscription = await response.json();
  const approvalLink = subscription.links.find((link: { rel: string; href: string }) => link.rel === "approve");

  if (!approvalLink) {
    throw new Error("No approval URL in subscription response");
  }

  return {
    approvalUrl: approvalLink.href,
    subscriptionId: subscription.id,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    
    if (claimsError || !claimsData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.user.id;

    // Get profile ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Create or get subscription plan
    const planId = await createSubscriptionPlan(accessToken);

    // Create subscription
    const { approvalUrl, subscriptionId } = await createSubscription(accessToken, planId, profile.id);

    return new Response(
      JSON.stringify({ approvalUrl, subscriptionId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating subscription:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create subscription";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
