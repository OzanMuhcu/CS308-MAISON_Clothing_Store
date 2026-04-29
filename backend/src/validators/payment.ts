import { z } from "zod";

export const paymentSchema = z
  .object({
    cardholderFullName: z
      .string()
      .trim()
      .min(2, "Cardholder full name is required")
      .regex(/^[A-Za-z\s'.-]{2,}$/, "Cardholder full name is required"),

    cardNumber: z
      .string()
      .trim()
      .transform((val) => val.replace(/\s/g, ""))
      .refine((val) => /^\d{16}$/.test(val), {
        message: "Card number must be exactly 16 digits",
      }),

    expiry: z
      .string()
      .trim()
      .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Expiry must be in MM/YY format"),

    cvv: z
      .string()
      .trim()
      .regex(/^\d{3,4}$/, "CVV must be 3 or 4 digits"),
  })
  .superRefine((data, ctx) => {
    const [monthStr, yearStr] = data.expiry.split("/");
    const month = Number(monthStr);
    const year = Number(`20${yearStr}`);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (
      Number.isNaN(month) ||
      Number.isNaN(year) ||
      year < currentYear ||
      (year === currentYear && month < currentMonth)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expiry"],
        message: "Card has expired or date is invalid",
      });
    }
  });