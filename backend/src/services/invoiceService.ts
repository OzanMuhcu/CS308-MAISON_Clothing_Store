import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";
import { env } from "../config/env";

interface InvoiceItem {
  productName: string;
  productId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface InvoiceData {
  invoiceNo: string;
  date: Date;
  customerName: string;
  customerEmail: string;
  address: {
    fullName?: string;
    line1?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  items: InvoiceItem[];
  totalAmount: number;
}

/**
 * Generate a PDF invoice as a Buffer (no filesystem writes needed).
 */
export function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    doc.fontSize(22).font("Helvetica-Bold").text("MAISON", { align: "center" });
    doc.fontSize(10).font("Helvetica").text("Invoice", { align: "center" });
    doc.moveDown(1.5);

    // Invoice meta
    doc.fontSize(9).font("Helvetica");
    doc.text(`Invoice No: ${data.invoiceNo}`);
    doc.text(`Date: ${data.date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`);
    doc.moveDown(0.5);
    doc.text(`Customer: ${data.customerName}`);
    doc.text(`Email: ${data.customerEmail}`);
    if (data.address.line1) {
      doc.text(`Address: ${data.address.line1}, ${data.address.city || ""} ${data.address.postalCode || ""} ${data.address.country || ""}`);
    }
    doc.moveDown(1);

    // Table header
    const left = 50;
    const colName = left;
    const colId = 260;
    const colQty = 320;
    const colPrice = 380;
    const colTotal = 460;
    const y0 = doc.y;

    doc.font("Helvetica").fontSize(8);
    doc.text("PRODUCT", colName, y0, { width: 200 });
    doc.text("ID", colId, y0, { width: 50 });
    doc.text("QTY", colQty, y0, { width: 50, align: "center" });
    doc.text("PRICE", colPrice, y0, { width: 70, align: "right" });
    doc.text("TOTAL", colTotal, y0, { width: 70, align: "right" });

    doc.moveTo(left, y0 + 14).lineTo(530, y0 + 14).lineWidth(0.5).stroke();
    doc.font("Helvetica").fontSize(9);

    let y = y0 + 22;
    for (const item of data.items) {
      doc.text(item.productName, colName, y, { width: 200 });
      doc.text(String(item.productId), colId, y, { width: 50 });
      doc.text(String(item.quantity), colQty, y, { width: 50, align: "center" });
      doc.text(`$${item.unitPrice.toFixed(2)}`, colPrice, y, { width: 70, align: "right" });
      doc.text(`$${item.lineTotal.toFixed(2)}`, colTotal, y, { width: 70, align: "right" });
      y += 18;
    }

    // Total
    doc.moveTo(left, y + 4).lineTo(530, y + 4).lineWidth(0.5).stroke();
    y += 14;
    doc.font("Helvetica").fontSize(11);
    doc.text(`Total: $${data.totalAmount.toFixed(2)}`, colPrice, y, { width: 140, align: "right" });

    doc.moveDown(3);
    doc.font("Helvetica").fontSize(7).fillColor("#888");
    doc.text("Thank you for shopping with MAISON.", left, doc.y, { align: "center", width: 480 });

    doc.end();
  });
}

/**
 * Send invoice email with PDF attachment.
 * Uses Ethereal test account if SMTP env vars are not set (preview URL logged).
 * Failures are caught and logged — they do NOT block order creation.
 */
export async function sendInvoiceEmail(
  data: InvoiceData,
  pdfBuffer: Buffer
): Promise<{ previewUrl?: string }> {
  const usingRealSmtp = Boolean(env.smtp.host && env.smtp.user);
  console.log(`[Email] Sending invoice ${data.invoiceNo} via ${usingRealSmtp ? "real SMTP (" + env.smtp.host + ")" : "Ethereal (test)"} …`);

  try {
    let transporter: nodemailer.Transporter;
    let isEthereal = false;
    let fromEmail: string;

    if (usingRealSmtp) {
      // Use configured SMTP (e.g. Gmail: host=smtp.gmail.com, port=587)
      transporter = nodemailer.createTransport({
        host: env.smtp.host,
        port: env.smtp.port,
        secure: env.smtp.port === 465,   // true for 465, false for 587/TLS
        auth: { user: env.smtp.user, pass: env.smtp.pass },
      });
      fromEmail = env.smtp.from;
    } else {
      // Fall back to Ethereal test account
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      isEthereal = true;
      fromEmail = testAccount.user;
    }

    const info = await transporter.sendMail({
      from: fromEmail,
      to: data.customerEmail,
      subject: `MAISON — Invoice ${data.invoiceNo}`,
      text: `Dear ${data.customerName},\n\nThank you for your purchase.\nYour invoice (${data.invoiceNo}) is attached.\n\nTotal: $${data.totalAmount.toFixed(2)}\n\nMAISON`,
      html: `<p>Dear ${data.customerName},</p><p>Thank you for your purchase. Your invoice is attached.</p><p><strong>Invoice:</strong> ${data.invoiceNo}<br/><strong>Total:</strong> $${data.totalAmount.toFixed(2)}</p><p>MAISON</p>`,
      attachments: [
        {
          filename: `${data.invoiceNo}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    if (isEthereal) {
      const previewUrl = nodemailer.getTestMessageUrl(info) as string;
      console.log(`[Email] Ethereal preview URL: ${previewUrl}`);
      return { previewUrl };
    }

    console.log(`[Email] Invoice sent via real SMTP to ${data.customerEmail} (messageId: ${info.messageId})`);
    return {};
  } catch (err) {
    console.error(`[Email] Failed to send invoice ${data.invoiceNo} (${usingRealSmtp ? "real SMTP" : "Ethereal"}):`, err);
    return {};
  }
}
