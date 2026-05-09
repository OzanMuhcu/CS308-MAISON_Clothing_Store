import nodemailer from "nodemailer";
import { env } from "../config/env";

export type DiscountCampaign = {
  name?: string | null;
  type?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
};

type Recipient = {
  name: string;
  email: string;
};

function formatDate(value?: Date | null) {
  if (!value) return null;
  return value.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function buildCampaignLine(campaign: DiscountCampaign) {
  const parts: string[] = [];
  if (campaign.name) parts.push(campaign.name);
  if (campaign.type) parts.push(campaign.type);
  const start = formatDate(campaign.startsAt);
  const end = formatDate(campaign.endsAt);
  if (start && end) parts.push(`Active ${start} - ${end}`);
  else if (start) parts.push(`Starts ${start}`);
  else if (end) parts.push(`Ends ${end}`);
  return parts.length > 0 ? parts.join(" | ") : null;
}

async function createEmailTransporter() {
  const usingRealSmtp = Boolean(env.smtp.host && env.smtp.user);

  if (usingRealSmtp) {
    return nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }

  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

export async function sendWishlistDiscountNotification(
  recipients: Recipient[],
  product: { name: string; price: number; discount: number },
  campaign: DiscountCampaign
): Promise<{ previewUrl?: string } | null> {
  if (recipients.length === 0) return null;

  const transporter = await createEmailTransporter();
  const usingRealSmtp = Boolean(env.smtp.host && env.smtp.user);
  const fromEmail = env.smtp.from || "noreply@maison.local";
  const campaignLine = buildCampaignLine(campaign);
  const discountedPrice = Math.max(0, product.price * (1 - product.discount / 100));

  const info = await transporter.sendMail({
    from: fromEmail,
    to: recipients.map((r) => r.email).join(","),
    subject: `MAISON — ${product.name} is now discounted`,
    text: `Hello,\n\nA product from your wishlist is now discounted.\n\nProduct: ${product.name}\nOriginal price: $${product.price.toFixed(2)}\nDiscount: ${product.discount.toFixed(2)}%\nNow: $${discountedPrice.toFixed(2)}${campaignLine ? `\nCampaign: ${campaignLine}` : ""}\n\nVisit MAISON to view the item.\n`,
    html: `<p>Hello,</p><p>A product from your wishlist is now discounted.</p><p><strong>Product:</strong> ${product.name}<br/><strong>Original price:</strong> $${product.price.toFixed(2)}<br/><strong>Discount:</strong> ${product.discount.toFixed(2)}%<br/><strong>Now:</strong> $${discountedPrice.toFixed(2)}${campaignLine ? `<br/><strong>Campaign:</strong> ${campaignLine}` : ""}</p><p>Visit MAISON to view the item.</p>`,
  });

  if (!usingRealSmtp) {
    const previewUrl = nodemailer.getTestMessageUrl(info) as string | null;
    if (previewUrl) {
      console.log(`[Email] Wishlist discount preview: ${previewUrl}`);
      return { previewUrl };
    }
  }

  console.log(`[Email] Wishlist discount sent to ${recipients.length} recipients`);
  return null;
}
