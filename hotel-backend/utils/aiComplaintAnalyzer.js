// Calls Groq's AI API to analyze a complaint and returns structured JSON.
// Falls back to a safe default if the AI call fails, so the system never breaks.
export const analyzeComplaint = async (text) => {
  try {
    const prompt = `You are an AI assistant for a hotel complaint management system.
Analyze the following customer complaint and respond with ONLY a raw JSON object (no markdown, no code fences, no extra text) in exactly this format:

{
  "category": "Room" | "Housekeeping" | "Food" | "Service" | "Maintenance" | "Billing" | "General",
  "priority": "Low" | "Medium" | "High" | "Critical",
  "department": "Housekeeping" | "Maintenance" | "Reception" | "Restaurant" | "Accounts",
  "suggestedResolution": "a short, specific, actionable recommendation (1-2 sentences)"
}

Complaint: "${text}"`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
        body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const responseText = data.choices[0].message.content.trim();

    // Strip markdown code fences if the model adds them despite instructions
    const cleaned = responseText.replace(/```json|```/g, "").trim();

    console.log("🔍 Raw Groq response:", cleaned);

    const parsed = JSON.parse(cleaned);

    return {
      category: parsed.category || "General",
      priority: parsed.priority || "Low",
      department: parsed.department || "Reception",
      suggestedResolution: parsed.suggestedResolution || "Please review manually.",
    };
  } catch (error) {
    console.error("❌ AI analysis failed, using fallback:", error.message);
    return {
      category: "General",
      priority: "Medium",
      department: "Reception",
      suggestedResolution: "AI analysis unavailable — please review this complaint manually.",
    };
  }
};