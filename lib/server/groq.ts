const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

type GroqResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

export function isGroqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

export async function groqChat(
  systemPrompt: string,
  userContent: string,
): Promise<string> {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL ?? DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API-მ უპასუხა სტატუსით ${response.status}`);
  }

  const result = (await response.json()) as GroqResponse;
  const content = result.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Groq API-მ ცარიელი პასუხი დააბრუნა");
  }
  return content;
}
