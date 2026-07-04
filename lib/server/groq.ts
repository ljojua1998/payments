const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type GroqResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

export class GroqHttpError extends Error {
  status: number;
  constructor(status: number) {
    super(`Groq API-მ უპასუხა სტატუსით ${status}`);
    this.status = status;
  }
}

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

type StreamChunk = {
  choices?: Array<{ delta?: { content?: string } }>;
};

export async function groqChatStream(
  messages: GroqMessage[],
): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL ?? DEFAULT_MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 1024,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    throw new GroqHttpError(response.status);
  }

  const upstream = response.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await upstream.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const chunk = JSON.parse(payload) as StreamChunk;
              const delta = chunk.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch {
              continue;
            }
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
    cancel() {
      upstream.cancel();
    },
  });
}
