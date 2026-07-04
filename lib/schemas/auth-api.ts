import { z } from "zod";
import { otpCodeSchema, passwordSchema, phoneSchema } from "@/lib/schemas/auth";

export const otpStartSchema = z.object({
  phone: phoneSchema,
});

export const registerVerifySchema = z.object({
  phone: phoneSchema,
  code: otpCodeSchema,
  fullName: z.string().trim().min(3),
  password: passwordSchema,
});

export const resetVerifySchema = z.object({
  phone: phoneSchema,
  code: otpCodeSchema,
  password: passwordSchema,
});

export type OtpStartInput = z.infer<typeof otpStartSchema>;
export type RegisterVerifyInput = z.infer<typeof registerVerifySchema>;
export type ResetVerifyInput = z.infer<typeof resetVerifySchema>;
