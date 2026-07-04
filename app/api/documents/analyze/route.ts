import { NextResponse } from "next/server";
import { z } from "zod";
import { extractText, getDocumentProxy } from "unpdf";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/server/admin";
import { groqChat, isGroqConfigured } from "@/lib/server/groq";
import type { DocumentRecord } from "@/lib/types";

const requestSchema = z.object({
  documentId: z.string().uuid(),
});

const MAX_TEXT_CHARS = 12000;

const ANALYSIS_PROMPT = `შენ ხარ "Payments" — გადახდების შედარების სისტემის ასისტენტი. მომხმარებელი გატვირთავს დოკუმენტის ტექსტს. გააანალიზე და ქართულად, მოკლედ და სტრუქტურირებულად შეაჯამე:

- რა ტიპის დოკუმენტია (ინვოისი, საბანკო ამონაწერი, ხელშეკრულება, სხვა)
- ვინ არიან მხარეები — გამგზავნი/მიმღები, საიდენტიფიკაციო კოდები თუ ჩანს
- რა თანხები, ვალუტა და თარიღები ფიგურირებს
- როგორ შეიძლება უკავშირდებოდეს საბანკო გადახდებს ან ხელშეკრულებებს

უპასუხე მხოლოდ ქართულად, ზედმეტი შესავლის გარეშე.`;

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

  if (!isGroqConfigured()) {
    return NextResponse.json(
      { error: "AI ანალიზი ჯერ არ არის კონფიგურირებული — საჭიროა GROQ_API_KEY" },
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

    const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
    const { text } = await extractText(pdf, { mergePages: true });
    const documentText = text.trim();

    if (!documentText) {
      await admin
        .from("documents")
        .update({ status: "error" })
        .eq("id", document.id);
      return NextResponse.json(
        { error: "PDF-დან ტექსტი ვერ ამოიკითხა — სავარაუდოდ დასკანერებული სურათია" },
        { status: 422 },
      );
    }

    const summary = await groqChat(
      ANALYSIS_PROMPT,
      documentText.slice(0, MAX_TEXT_CHARS),
    );

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
