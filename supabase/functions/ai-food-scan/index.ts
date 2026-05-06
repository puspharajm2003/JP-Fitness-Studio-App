import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { image, mime_type = "image/jpeg" } = await req.json().catch(() => ({}));
    if (!image) throw new Error("No image provided");

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const sys = `You are a certified nutritionist and food scientist with expertise in analyzing food from images. 
Analyze the food in the image and return ONLY valid JSON in this exact shape:
{"name":"Food Name","kcal":0,"protein_g":0,"carbs_g":0,"fat_g":0,"fiber_g":0,"vitamins":["Vitamin A","Vitamin C"],"minerals":["Iron","Calcium"],"serving_size":"1 plate (~300g)"}

Rules:
- Identify the food as accurately as possible
- Estimate a realistic serving size from the image
- Calculate nutrition for the visible serving
- Include all major vitamins present (A, B1, B2, B3, B6, B12, C, D, E, K)
- Include all major minerals present (Iron, Calcium, Potassium, Magnesium, Zinc, Phosphorus, Sodium)
- Only include vitamins/minerals that are meaningfully present
- Round all numbers to integers
- If multiple food items are visible, combine them as one meal entry`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this food image and return the nutritional information as JSON." },
              { type: "image_url", image_url: { url: `data:${mime_type};base64,${image}` } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: t }), {
        status: r.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await r.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
