import { NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/server/admin";
import type { DocumentRecord } from "@/lib/types";

const requestSchema = z.object({
  documentId: z.string().uuid(),
});

const ANALYSIS_PROMPT = `შენ ხარ "Payments" — გადახდების შედარების სისტემის ასისტენტი. გააანალიზე მიმაგრებული დოკუმენტი და ქართულად, მოკლედ და სტრუქტურირებულად შეაჯამე:

- რა ტიპის დოკუმენტია (ინვოისი, ამონაწერი, ხელშეკრულება, სხვა)
- ვინ არიან მხარეები — გამგზავნი/მიმღები, საიდენტიფიკაციო კოდები თუ ჩანს
- რა თანხები, ვალუტა და თარიღები ფიგურირებს
- როგორ შეიძლება უკავშირდებოდეს საბანკო გადახდებს ან ხელშეკრულებებს

პასუხი მხოლოდ ქართულად, ზედმეტი შესავლის გარეშე.`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) {
    return NextResponse.json({ error: "ავტორიზაცია საჭიროა" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "არასწორი მოთხოვნა" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI ანალიზი ჯერ არ არის კონფიგურირებული — საჭიროა ANTHROPIC_API_KEY" },
      { status: 503 },
    );
  }

  const admin = createAdminClient();
  const { data: document } = await admin
    .from("documents")
    .select("*")
    .eq("id", parsed.data.documentId)
    .maybeSingle<DocumentRecord>();

  if (!document || document.user_id !== auth.claims.sub) {
    return NextResponse.json(
      { error: "დოკუმენტი ვერ მოიძებნა" },
      { status: 404 },
    );
  }

  await admin
    .from("documents")
    .update({ status: "analyzing" })
    .eq("id", document.id);

  try {
    const { data: file, error: downloadError } = await admin.storage
      .from("documents")
      .download(document.storage_path);

    if (downloadError || !file) {
      throw new Error("ფაილის წაკითხვა ვერ მოხერხდა");
    }

    const pdfBase64 = Buffer.from(await file.arrayBuffer()).toString("base64");

    const anthropic = new Anthropic();
    const stream = anthropic.messages.stream({
      model: "claude-opus-4-8",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: pdfBase64,
              },
            },
            { type: "text", text: ANALYSIS_PROMPT },
          ],
        },
      ],
    });
    const message = await stream.finalMessage();

    const summary = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    if (!summary) {
      throw new Error("ანალიზმა ცარიელი პასუხი დააბრუნა");
    }

    await admin
      .from("documents")
      .update({ status: "analyzed", summary })
      .eq("id", document.id);

    return NextResponse.json({ summary });
  } catch {
    await admin
      .from("documents")
      .update({ status: "error" })
      .eq("id", document.id);

    return NextResponse.json(
      { error: "ანალიზი ვერ შესრულდა — სცადეთ თავიდან" },
      { status: 502 },
    );
  }
}
