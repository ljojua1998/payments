# Supabase-ის კონფიგურაცია

## მიგრაციების გაშვება

გაუშვით ფაილები **თანმიმდევრობით** Supabase Dashboard → SQL Editor-ში:

| # | ფაილი | რას აკეთებს |
|---|-------|-------------|
| 1 | `migrations/00001_reconciliation_schema.sql` | ქმნის `companies`, `contracts`, `bank_transactions` ცხრილებს, ინდექსებს და ამატებს 15 კომპანიას + 18 ხელშეკრულებას |
| 2 | `migrations/00002_seed_bank_transactions.sql` | ამატებს 89 საბანკო ტრანზაქციას (აპრილი–ივნისი 2026, ყველა `unmatched`) |
| 3 | `migrations/00003_auth_profiles.sql` | ქმნის `profiles` ცხრილს RLS-ით და ტრიგერს, რომელიც რეგისტრაციისას ავტომატურად ქმნის პროფილს |
| 4 | `migrations/00004_rls_policies.sql` | რთავს RLS-ს ძირითად ცხრილებზე — მონაცემები მხოლოდ ავტორიზებული მომხმარებლისთვისაა ხელმისაწვდომი |
| 5 | `migrations/00005_matching_and_summary.sql` | `match_transactions_by_inn()` — ავტო-მატჩინგის RPC და `monthly_company_summary(month)` — მოსალოდნელი vs ფაქტობრივი შეჯამება |
| 6 | `migrations/00006_phone_otps.sql` | `phone_otps` ცხრილი SMS კოდებისთვის და profiles ტრიგერის განახლება |

> 00001-ის გაშვებისას თუ SQL Editor-მა RLS-ის დიალოგი გაჩვენათ, აირჩიეთ **Run without RLS** — RLS-ს მე-4 მიგრაცია რთავს policy-ებთან ერთად.

## ავტორიზაცია

რეგისტრაცია/შესვლა ტელეფონის ნომრით + SMS OTP კოდით მუშაობს **საკუთარი SMS პროვაიდერით** (ubill.dev) — Supabase-ის Phone პროვაიდერი და Twilio საჭირო არ არის:

- OTP კოდებს სერვერი (Next.js API routes) აგენერირებს, ჰეშირებულს ინახავს `phone_otps` ცხრილში (ვადა 10 წთ, მაქს. 5 ცდა, resend cooldown) და SMS-ით აგზავნის
- სესიებს Supabase Auth მართავს — მომხმარებელი იქმნება Admin API-თ, ნომერი კი შიდა ელფოსტად აისახება (`995XXXXXXXXX@sms.balansi.app`)
- Dashboard-ში არაფრის ჩართვა არ გჭირდებათ — Email პროვაიდერი (default-ად ჩართული) საკმარისია

## Environment ცვლადები

`.env.local` ფაილში (იხ. `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=<project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SECRET_KEY=<secret-key>

SMS_PROVIDER_API_KEY=<ubill-api-key>
SMS_BRAND_ID=<ubill-brand-id>
```

Supabase მნიშვნელობები: Dashboard → Project Settings → API Keys. `SUPABASE_SECRET_KEY` მხოლოდ სერვერზე გამოიყენება (OTP ვერიფიკაცია, მომხმარებლის შექმნა) და კლიენტში არასდროს ხვდება.
