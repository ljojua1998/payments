import { z } from "zod";
import { GEORGIAN_MOBILE_PATTERN } from "@/lib/auth/phone";

export const phoneSchema = z
  .string()
  .regex(
    GEORGIAN_MOBILE_PATTERN,
    "შეიყვანეთ ქართული მობილურის ნომერი ფორმატით 5XX XX XX XX",
  );

export const passwordSchema = z
  .string()
  .min(8, "პაროლი უნდა შედგებოდეს მინიმუმ 8 სიმბოლოსგან");

export const otpCodeSchema = z
  .string()
  .regex(/^\d{6}$/, "შეიყვანეთ SMS-ით მიღებული 6-ნიშნა კოდი");

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "შეიყვანეთ პაროლი"),
});

export const signUpSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, "შეიყვანეთ სახელი და გვარი"),
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "პაროლები ერთმანეთს არ ემთხვევა",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  phone: phoneSchema,
});

export const updatePasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "პაროლები ერთმანეთს არ ემთხვევა",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}
