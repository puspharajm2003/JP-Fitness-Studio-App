import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { goal = "weight_loss", calorie_goal = 2000, gender = "any", current_kcal = 0 } = await req.json().catch(() => ({}));
    const remaining = Math.max(300, calorie_goal - current_kcal);
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const sys = `You are a registered dietitian. Suggest 4 realistic meals tailored to the user. Return ONLY JSON in this exact shape:
{"meals":[{"name":"","meal_time":"Breakfast|Lunch|Dinner|Snack","kcal":0,"protein_g":0,"carbs_g":0,"fat_g":0,"vitamins":["B12"],"minerals":["Iron"],"desc":""}]}
Pick vitamins/minerals targeted to the user's goal (e.g. iron + B12 for weight loss/energy, calcium + magnesium for muscle gain).`;
    const user = `Goal: ${goal}. Daily calorie target: ${calorie_goal}. Already eaten: ${current_kcal} kcal. Remaining: ${remaining} kcal. Gender: ${gender}. Suggest 4 meals fitting these constraints.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
        response_format: { type: "json_object" },
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: t }), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await r.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
