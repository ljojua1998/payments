import { z } from "zod";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "აირჩიეთ თარიღი");

export const companySchema = z.object({
  name: z.string().trim().min(2, "შეიყვანეთ კომპანიის სახელი"),
  taxId: z
    .string()
    .trim()
    .regex(/^\d{9}(\d{2})?$/, "ს/კ უნდა იყოს 9 ან 11 ციფრი"),
});

export const contractSchema = z
  .object({
    monthlyAmount: z.coerce
      .number({ message: "შეიყვანეთ თანხა" })
      .positive("თანხა უნდა იყოს დადებითი"),
    startDate: dateSchema,
    endDate: dateSchema.optional().or(z.literal("").transform(() => undefined)),
    status: z.enum(["active", "paused", "ended"]),
  })
  .refine(
    (data) => !data.endDate || data.endDate >= data.startDate,
    {
      message: "დასრულების თარიღი დაწყებაზე ადრე ვერ იქნება",
      path: ["endDate"],
    },
  )
  .refine((data) => data.status === "active" || Boolean(data.endDate), {
    message: "შეჩერებულ/დასრულებულ ხელშეკრულებას სჭირდება თარიღი",
    path: ["endDate"],
  });

export const transactionRowSchema = z.object({
  doc_key: z.string().trim().min(1, "doc_key ცარიელია"),
  entry_date: dateSchema,
  amount: z.coerce
    .number({ message: "თანხა არასწორია" })
    .positive("თანხა უნდა იყოს დადებითი"),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .transform((value) => value || "GEL"),
  sender_name: z.string().trim().optional().transform((value) => value || null),
  sender_inn: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null)
    .refine((value) => value === null || /^\d{9}(\d{2})?$/.test(value), {
      message: "ს/კ უნდა იყოს 9 ან 11 ციფრი",
    }),
  sender_account: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null),
  purpose: z.string().trim().optional().transform((value) => value || null),
});

export type CompanyInput = z.infer<typeof companySchema>;
export type ContractInput = z.infer<typeof contractSchema>;
export type TransactionRowInput = z.infer<typeof transactionRowSchema>;
