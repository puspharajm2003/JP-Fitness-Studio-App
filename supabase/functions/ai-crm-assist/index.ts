/// <reference lib="deno.ns" />
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { createClient } from "supabase";

const SYS = `You are the JP Fitness Studios CRM admin assistant. The Super-Admin will ask questions about members or request actions in natural language.
You receive a JSON snapshot of all members (id, full_name, phone, role, loyalty_points, coach_name, last_checkin, package_name).
You MUST reply ONLY with strict JSON of the form:
{
  "answer": "concise human readable explanation in markdown",
  "actions": [
    { "kind": "set_role", "user_id": "...", "role": "member|coach|admin|super_admin", "label": "Promote X to coach" },
    { "kind": "set_points", "user_id": "...", "points": 0, "label": "Reset points for X" },
    { "kind": "delete_member", "user_id": "...", "label": "Remove member X" }
  ]
}
Only include actions if the user explicitly asked for a change. Do NOT execute, just propose.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }});
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth }}});
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }});

    // Verify admin/super_admin
    const { data: roles } = await sb.from("user_roles").select("role").eq("user_id", user.id);
    const r = (roles||[]).map((x:any)=>x.role);
    if (!r.includes("admin") && !r.includes("super_admin")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }});
    }

    const { prompt } = await req.json();

    // Snapshot
    const [m, ur, att, pk] = await Promise.all([
      sb.from("profiles").select("id,full_name,phone,loyalty_points,coach_name,goal,created_at"),
      sb.from("user_roles").select("user_id,role"),
      sb.from("attendance").select("user_id,date").order("date",{ascending:false}).limit(2000),
      sb.from("packages").select("user_id,name,status").eq("status","active"),
    ]);
    const roleMap: Record<string,string> = {}; (ur.data||[]).forEach((x:any)=>roleMap[x.user_id]=x.role);
    const lastChk: Record<string,string> = {}; (att.data||[]).forEach((x:any)=>{ if(!lastChk[x.user_id]) lastChk[x.user_id]=x.date; });
    const pkMap: Record<string,string> = {}; (pk.data||[]).forEach((x:any)=>pkMap[x.user_id]=x.name);
    const members = (m.data||[]).map((p:any)=>({
      id: p.id, name: p.full_name, phone: p.phone, role: roleMap[p.id]||"member",
      points: p.loyalty_points||0, coach: p.coach_name, goal: p.goal,
      last_checkin: lastChk[p.id]||null, package: pkMap[p.id]||null,
      joined: p.created_at?.slice(0,10)
    }));

    const apiKey = Deno.env.get("VITE_OPENROUTER_API_KEY");
    const ai = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type":"application/json", Authorization:`Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
        messages: [
          { role:"system", content: SYS },
          { role:"user", content: `Members snapshot:\n${JSON.stringify(members)}\n\nQuestion: ${prompt}` }
        ],
        response_format: { type:"json_object" }
      })
    });
    if (!ai.ok) {
      const t = await ai.text();
      console.error("ai-crm-assist upstream:", t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), { status: 502, headers: { ...corsHeaders, "Content-Type":"application/json" }});
    }
    const data = await ai.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type":"application/json" }});
  } catch (e) {
    console.error("ai-crm-assist error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type":"application/json" }});
  }
});