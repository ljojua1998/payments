import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/server/admin";
import {
  GroqHttpError,
  groqChatStream,
  isGroqConfigured,
} from "@/lib/server/groq";
import {
  buildAssistantContext,
  buildSystemPrompt,
} from "@/lib/server/assistant-context";
import { chatRequestSchema } from "@/lib/schemas/assistant";

const HISTORY_LIMIT = 8;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) {
    return NextResponse.json({ error: "ავტორიზაცია საჭიროა" }, { status: 401 });
  }

  if (!isGroqConfigured()) {
    return NextResponse.json(
      { error: "ასისტენტი ჯერ არ არის კონფიგურირებული — საჭიროა GROQ_API_KEY" },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "არასწორი მოთხოვნა" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const dataContext = await buildAssistantContext(admin);

    const stream = await groqChatStream([
      { role: "system", content: buildSystemPrompt(dataContext) },
      ...parsed.data.messages.slice(-HISTORY_LIMIT),
    ]);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("assistant error:", error);
    if (error instanceof GroqHttpError && (error.status === 429 || error.status === 413)) {
      return NextResponse.json(
        {
          error:
            "ბევრი კითხვა ზედიზედ — უფასო ლიმიტი წუთობრივია, დაიცადეთ დაახლოებით ერთი წუთი და სცადეთ ისევ",
        },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: "ასისტენტმა ვერ უპასუხა — სცადეთ თავიდან" },
      { status: 502 },
    );
  }
}
