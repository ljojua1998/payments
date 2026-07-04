import { z } from "zod";
import { passwordSchema } from "@/lib/schemas/auth";

export const profileSchema = z.object({
  firstName: z.string().trim().min(2, "შეიყვანეთ სახელი"),
  lastName: z.string().trim().min(2, "შეიყვანეთ გვარი"),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "აირჩიეთ თარიღი")
    .refine((value) => value <= new Date().toISOString().slice(0, 10), {
      message: "დაბადების თარიღი მომავალში ვერ იქნება",
    })
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const passwordChangeSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "პაროლები ერთმანეთს არ ემთხვევა",
    path: ["confirmPassword"],
  });

export type ProfileInput = z.infer<typeof profileSchema>;
