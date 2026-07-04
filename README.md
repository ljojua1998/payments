# ბალანსი — გადახდების შედარების დეშბორდი

საბანკო ტრანზაქციების შედარება (reconciliation) მომსახურების ხელშეკრულებებთან: ტრანზაქციები ავტომატურად ემთხვევა კომპანიებს საიდენტიფიკაციო კოდით და ერთ ეკრანზე ჩანს ვინ გადაიხადა, ვინ დააკლო და ვინ საერთოდ არ გამოჩენილა.

**Live demo:** _(Vercel ლინკი დაემატება)_

## ტექნოლოგიები

Next.js (App Router) · TypeScript · Supabase (Database + Auth) · Tailwind CSS · TanStack Query · Zod · ubill.dev (SMS OTP)

## გაშვება ლოკალურად

1. დააკლონირეთ რეპო და დააყენეთ დამოკიდებულებები:

   ```bash
   npm install
   ```

2. შექმენით Supabase პროექტი და გაუშვით მიგრაციები SQL Editor-ში **თანმიმდევრობით** — დეტალური ინსტრუქცია: [`supabase/README.md`](./supabase/README.md)

3. შექმენით `.env.local` ფაილი `.env.example`-ის მიხედვით:

   ```
   NEXT_PUBLIC_SUPABASE_URL=<project-url>
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
   ```

4. გაუშვით:

   ```bash
   npm run dev
   ```

ავტორიზაცია ტელეფონის ნომრით მუშაობს — OTP კოდები საკუთარი SMS პროვაიდერით (ubill.dev) იგზავნება, სესიებს კი Supabase Auth მართავს (იხ. `supabase/README.md`).

## სად დევს matching logic და რატომ

მატჩინგი **მონაცემთა ბაზაშია** — Postgres ფუნქცია [`match_transactions_by_inn()`](./supabase/migrations/00005_matching_and_summary.sql), რომელიც კლიენტიდან Supabase RPC-ით გამოიძახება („ავტო-მატჩინგი" ღილაკი).

```sql
UPDATE bank_transactions bt
SET matched_company_id = c.id, match_method = 'inn_exact',
    match_confidence = 1.00, status = 'matched'
FROM companies c
WHERE bt.sender_inn = c.tax_id AND bt.status = 'unmatched';
```

რატომ ბაზაში და არა client-side:

- **ერთი set-based UPDATE** ერთი round-trip-ით — client-side ვარიანტი ყველა ტრანზაქციის წამოღებას და თითო-თითო განახლებას მოითხოვდა (N+1)
- **ატომურობა** — ან ყველა დაემთხვევა, ან არცერთი; ორი მომხმარებლის პარალელური გაშვება race condition-ს არ ქმნის
- **მასშტაბი** — 89 ტრანზაქციაზეც და 100 000-ზეც ერთნაირად მუშაობს, ინდექსით `sender_inn`-ზე
- მატჩინგი მხოლოდ `status = 'unmatched'` რიგებს ეხება — ხელით მიბმული ან იგნორირებული ტრანზაქციები ხელუხლებელი რჩება
- სახელის ვარიაციები პრობლემა არ არის: შედარება მხოლოდ ს/კ-ით ხდება („გეოტრანსი (ფილიალი)" იგივე ს/კ-ით ისევ „შპს გეოტრანსს" ემთხვევა)

„მოსალოდნელი vs ფაქტობრივი" შეჯამებაც ბაზაშია (`monthly_company_summary(month)`) — აგრეგაცია მონაცემებთან ახლოს კეთდება და კლიენტამდე მხოლოდ 15 რიგი მიდის.

**ხელშეკრულება „აქტიურია არჩეულ თვეში"** თუ `start_date <= თვის ბოლო` და (`end_date IS NULL` ან `end_date >= თვის პირველი`). ასე სეიფ ტრანსპორტი (შეჩერდა 15 მაისს) მაისში ჯერ ითვლება, ივნისში — აღარ; ურბან მუვერსი (დასრულდა 30 აპრილს) მხოლოდ აპრილში ითვლება.

## არქიტექტურა

```
lib/
  schemas/      Zod სქემები — auth ფორმები, დეშბორდის ფილტრები (URL პარამეტრები)
  services/     typed service layer — ყველა Supabase წვდომა აქ გადის
  hooks/        TanStack Query hooks — queries, mutations, URL ფილტრები
  queries/      query key factory
components/
  auth/         ტელეფონით რეგისტრაცია/შესვლა/აღდგენა SMS OTP-ით
  dashboard/    სტატისტიკა, ტრანზაქციების ცხრილი, თვეების ნავიგაცია, შეჯამება
supabase/
  migrations/   სქემა, seed მონაცემები, RLS პოლისები, RPC ფუნქციები
```

- **მდგომარეობა URL-შია** (`?month=2026-06&status=unmatched&q=...`) — Zod-ით ვალიდირდება, ლინკი გაზიარებადია, back/forward მუშაობს
- **თვეზე ერთი query** — სტატისტიკა, ფილტრები და სორტირება 89 რიგზე კლიენტზე გამოითვლება; mutations ინვალიდაციას თვის key-ზე აკეთებს
- **Optimistic updates** — ხელით მიბმა/იგნორირება მყისიერად აისახება, შეცდომისას rollback
- **RLS** — მონაცემები მხოლოდ ავტორიზებული მომხმარებლისთვის; RPC ფუნქციები `anon` როლისთვის დახურულია

## ბონუს ფუნქციები

- ძებნა გამგზავნის სახელით ან ს/კ-ით
- CSV ექსპორტი (მოსალოდნელი vs ფაქტობრივი)
- მატჩინგი Supabase RPC ფუნქციით client-side ლოგიკის ნაცვლად
