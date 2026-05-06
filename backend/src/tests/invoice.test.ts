import { generateInvoicePdf } from "../services/invoiceService";

const singleItemInvoice = {
  invoiceNo: "INV-9999-1",
  date: new Date("2025-01-15"),
  customerName: "Alice Smith",
  customerEmail: "alice@example.com",
  address: {
    fullName: "Alice Smith",
    line1: "123 Main St",
    city: "New York",
    postalCode: "10001",
    country: "US",
  },
  items: [
    { productName: "Classic Shirt", productId: 1, quantity: 2, unitPrice: 49.99, lineTotal: 99.98 },
  ],
  totalAmount: 99.98,
};

// ── generateInvoicePdf ────────────────────────────────────────────────────────

describe("generateInvoicePdf", () => {
  test("resolves to a Buffer instance", async () => {
    const buf = await generateInvoicePdf(singleItemInvoice);
    expect(buf).toBeInstanceOf(Buffer);
  });

  test("returns a non-empty buffer", async () => {
    const buf = await generateInvoicePdf(singleItemInvoice);
    expect(buf.length).toBeGreaterThan(0);
  });

  test("handles Turkish characters in customer name", async () => {
    const turkishInvoice = {
      ...singleItemInvoice,
      customerName: "Şenol Güneş",
      address: {
        ...singleItemInvoice.address,
        fullName: "Şenol Güneş",
      },
    };
    const buf = await generateInvoicePdf(turkishInvoice);
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);
  });

  test("handles Turkish characters in address", async () => {
    const turkishAddressInvoice = {
      ...singleItemInvoice,
      customerName: "Ahmet Yılmaz",
      address: {
        fullName: "Ahmet Yılmaz",
        line1: "İstiklal Caddesi No: 123",
        city: "İstanbul",
        postalCode: "34430",
        country: "Türkiye",
      },
    };
    const buf = await generateInvoicePdf(turkishAddressInvoice);
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);
  });

  test("handles multiple line items without throwing", async () => {
    const multiItem = {
      ...singleItemInvoice,
      items: [
        { productName: "Classic Shirt", productId: 1, quantity: 1, unitPrice: 49.99, lineTotal: 49.99 },
        { productName: "Slim Trousers", productId: 2, quantity: 2, unitPrice: 79.99, lineTotal: 159.98 },
        { productName: "Wool Coat", productId: 3, quantity: 1, unitPrice: 299.0, lineTotal: 299.0 },
      ],
      totalAmount: 508.97,
    };
    const buf = await generateInvoicePdf(multiItem);
    expect(buf.length).toBeGreaterThan(0);
  });

  test("handles missing optional address fields without throwing", async () => {
    const sparseAddress = {
      ...singleItemInvoice,
      address: {},
    };
    await expect(generateInvoicePdf(sparseAddress)).resolves.toBeInstanceOf(Buffer);
  });
});
