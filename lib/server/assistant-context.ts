import type { SupabaseClient } from "@supabase/supabase-js";
import { AVAILABLE_MONTHS } from "@/lib/schemas/dashboard";
import type {
  CompanyMonthlySummary,
  CompanyWithContracts,
} from "@/lib/types";

type SlimTransaction = {
  entry_date: string;
  sender_name: string | null;
  sender_inn: string | null;
  amount: number;
  status: string;
  matched_company: { name: string } | null;
};

const APP_GUIDE = `## საიტის გვერდები (კითხვებზე "როგორ გავაკეთო")
- მიმოხილვა (/): თვის სტატები, ტრანზაქციების ცხრილი, ავტო-მატჩინგის ღილაკი, თვის/დღის არჩევა, მოსალოდნელი vs ფაქტობრივი + CSV. შეუსაბამოზე ⋯ მენიუთი ხელით მიბმა/იგნორი, fuzzy შეთავაზებით.
- კომპანიები (/companies): კომპანიის დამატება (სახელი + ს/კ 9/11 ციფრი), ხელშეკრულების დამატება/შეჩერება/დასრულება, წაშლა; "გადახდების განრიგი" ტაბი — ვის რომელ რიცხვში უწევს.
- იმპორტი (/import): ტრანზაქციების დამატება CSV-ით (BOG ფორმატი, შაბლონია) ან ხელით; დუბლიკატები doc_key-ით იტოვება; შემდეგ ავტო-მატჩინგი ეშვება.
- დოკუმენტები (/documents): PDF ატვირთვა (მაქს 10MB) და AI ანალიზი.
- შესვლა ტელეფონის ნომრით + SMS კოდით.`;

function shortName(name: string): string {
  return name.replace(/^(შპს|სს)\s+/, "");
}

function shortDate(isoDate: string): string {
  return isoDate.slice(5);
}

export async function buildAssistantContext(
  admin: SupabaseClient,
): Promise<string> {
  const [companiesRes, transactionsRes, ...summaryRes] = await Promise.all([
    admin
      .from("companies")
      .select(
        "id, name, tax_id, contracts(id, company_id, monthly_amount, status, start_date, end_date)",
      )
      .order("name"),
    admin
      .from("bank_transactions")
      .select(
        "entry_date, sender_name, sender_inn, amount, status, matched_company:companies(name)",
      )
      .order("entry_date"),
    ...AVAILABLE_MONTHS.map((month) =>
      admin.rpc("monthly_company_summary", { target_month: `${month}-01` }),
    ),
  ]);

  const companies = (companiesRes.data ?? []) as CompanyWithContracts[];
  const transactions = (transactionsRes.data ??
    []) as unknown as SlimTransaction[];

  const statusMark = { active: "აქტ", paused: "შეჩ", ended: "დასრ" } as const;
  const companiesBlock = companies
    .map((company) => {
      const contracts = company.contracts.length
        ? company.contracts
            .map(
              (c) =>
                `${Number(c.monthly_amount)}₾/თვე ${statusMark[c.status]} ${c.start_date}${c.end_date ? `→${c.end_date}` : ""}`,
            )
            .join("; ")
        : "ხელშ. არაა";
      return `${company.name}|${company.tax_id}| ${contracts}`;
    })
    .join("\n");

  const summariesBlock = AVAILABLE_MONTHS.map((month, index) => {
    const rows = (summaryRes[index]?.data ?? []) as CompanyMonthlySummary[];
    const line = rows
      .map(
        (row) =>
          `${shortName(row.company_name)} exp${row.expected_amount} act${row.actual_amount}`,
      )
      .join("; ");
    return `${month}: ${line}`;
  }).join("\n");

  const unmatched = transactions.filter((t) => t.status === "unmatched");
  const unmatchedBlock = unmatched
    .slice(0, 8)
    .map(
      (t) =>
        `${shortDate(t.entry_date)}|${t.sender_name ?? "?"}|${t.sender_inn ?? "?"}|${Number(t.amount)}`,
    )
    .join("\n");

  const ignoredCount = transactions.filter(
    (t) => t.status === "ignored",
  ).length;

  return `${APP_GUIDE}

## ლეგენდა
exp=მოსალოდნელი თანხა (აქტიური ხელშეკრულებების ჯამი იმ თვეში), act=რეალურად გადაიხადა (მიბმული გადარიცხვები). დავალიანება აქვს მხოლოდ მას, ვისაც act < exp; თუ act >= exp, დავალიანება არ აქვს (ზედმეტად/წინასწარ აქვს გადახდილი). თუ არავისაა act < exp, თქვი რომ დავალიანება არავის აქვს. თარიღები MM-DD, წელი 2026, თანხები ლარებში. ცალკეული გადარიცხვების დეტალები მიმოხილვის გვერდის ცხრილშია.

## კომპანიები (სახელი|ს/კ|ხელშეკრულებები) — სულ ${companies.length}
${companiesBlock}

## თვიური შეჯამება
${summariesBlock}

## შეუსაბამო გადარიცხვები — უცნობი გამგზავნები, არავის მიბმია (თარიღი|გამგზავნი|ს/კ|თანხა) — სულ ${unmatched.length}${unmatched.length > 8 ? " (ქვემოთ პირველი 8)" : ""}
${unmatchedBlock || "არაა"}

იგნორირებული: ${ignoredCount}`;
}

export function buildSystemPrompt(dataContext: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `შენ ხარ Payments AI — გადახდების შედარების სისტემის ასისტენტი. დღეს არის ${today}.

წესები:
- უპასუხე მხოლოდ მოცემული მონაცემებით; არ გამოიგონო რიცხვები. თუ პასუხი მონაცემებში არაა, თქვი პირდაპირ.
- უპასუხე ქართულად, მოკლედ; სიები ტირეებით.
- "როგორ" კითხვებზე მიუთითე შესაბამისი გვერდი.
- მონაცემები ცოცხალია — ახლა არის წამოღებული ბაზიდან.

${dataContext}`;
}
