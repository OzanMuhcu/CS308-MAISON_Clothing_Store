import { z } from "zod";

export const paymentSchema = z.object({
  cardholderFullName: z
    .string()
    .trim()
    .regex(/^[A-Za-z\s'.-]{2,}$/, "Cardholder full name is required"),
  cardNumber: z
    .string()
    .transform((v) => v.replace(/\s/g, ""))
    .pipe(
      z
        .string()
        .regex(/^\d{16}$/, "Card number must be exactly 16 digits")
    ),
  expiry: z
    .string()
    .regex(/^\d{2}\/\d{2}$/, "Expiry must be in MM/YY format")
    .refine(
      (val) => {
        const [mm, yy] = val.split("/").map(Number);
        if (mm < 1 || mm > 12) return false;
        const now = new Date();
        const expYear = 2000 + yy;
        return (
          expYear > now.getFullYear() ||
          (expYear === now.getFullYear() && mm >= now.getMonth() + 1)
        );
      },
      { message: "Card has expired or date is invalid" }
    ),
  cvv: z
    .string()
    .regex(/^\d{3}$/, "CVV must be exactly 3 digits"),
});
