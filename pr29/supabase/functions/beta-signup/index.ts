import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const allowedPlatforms = new Set(["PC", "iOS", "Android"]);
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const platform = String(body?.platform ?? "");
    const source = String(body?.source ?? "direct").slice(0, 80);
    const campaign = body?.campaign ? String(body.campaign).slice(0, 120) : null;

    if (!emailRegex.test(email) || email.length > 254) return json({ error: "invalid_email" }, 400);
    if (!allowedPlatforms.has(platform)) return json({ error: "invalid_platform" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { error } = await supabase.from("beta_signups").insert({ email, platform, source, campaign });
    if (!error) return json({ ok: true }, 201);
    if (error.code === "23505") return json({ error: "already_registered" }, 409);

    console.error("beta-signup insert error", error.code, error.message);
    return json({ error: "signup_failed" }, 500);
  } catch (error) {
    console.error("beta-signup handler error", error);
    return json({ error: "invalid_request" }, 400);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
