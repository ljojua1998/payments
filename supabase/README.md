# Supabase-ის კონფიგურაცია

## მიგრაციების გაშვება

გაუშვით ფაილები **თანმიმდევრობით** Supabase Dashboard → SQL Editor-ში:

| # | ფაილი | რას აკეთებს |
|---|-------|-------------|
| 1 | `migrations/00001_reconciliation_schema.sql` | ქმნის `companies`, `contracts`, `bank_transactions` ცხრილებს, ინდექსებს და ამატებს 15 კომპანიას + 18 ხელშეკრულებას |
| 2 | `migrations/00002_seed_bank_transactions.sql` | ამატებს 89 საბანკო ტრანზაქციას (აპრილი–ივნისი 2026, ყველა `unmatched`) |
| 3 | `migrations/00003_auth_profiles.sql` | ქმნის `profiles` ცხრილს RLS-ით და ტრიგერს, რომელიც რეგისტრაციისას ავტომატურად ქმნის პროფილს |
| 4 | `migrations/00004_rls_policies.sql` | რთავს RLS-ს ძირითად ცხრილებზე — მონაცემები მხოლოდ ავტორიზებული მომხმარებლისთვისაა ხელმისაწვდომი |

> 00001-ის გაშვებისას თუ SQL Editor-მა RLS-ის დიალოგი გაჩვენათ, აირჩიეთ **Run without RLS** — RLS-ს მე-4 მიგრაცია რთავს policy-ებთან ერთად.

## ტელეფონით ავტორიზაციის ჩართვა

რეგისტრაცია/შესვლა მუშაობს ტელეფონის ნომრით + SMS OTP კოდით. ამისთვის საჭიროა:

1. **Authentication → Sign In / Up → Phone** — ჩართეთ Phone პროვაიდერი
2. **SMS პროვაიდერი** — Authentication → Sign In / Up → Phone → SMS Provider: აირჩიეთ Twilio (ან Messagebird/Vonage/Textlocal) და შეიყვანეთ credentials
3. **ტესტირებისთვის SMS პროვაიდერის გარეშე**: Authentication → Phone → Test Phone Numbers — დაამატეთ ტესტ-ნომრები ფიქსირებული კოდით, მაგ:
   - ნომერი: `+995599123456`, კოდი: `123456`

   ასე რეალური SMS არ იგზავნება და რეგისტრაცია/აღდგენა მაინც სრულად შემოწმებადია.

## Environment ცვლადები

`.env.local` ფაილში (იხ. `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=<project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

ორივე მნიშვნელობა: Dashboard → Project Settings → API Keys
