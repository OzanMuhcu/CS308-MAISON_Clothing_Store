export function isDiscountActive(
  discount: number,
  startsAt?: Date | null,
  endsAt?: Date | null
) {
  if (discount <= 0) return false;
  const now = new Date();
  if (startsAt && now < startsAt) return false;
  if (endsAt && now > endsAt) return false;
  return true;
}

export function getEffectivePrice(product: {
  price: number;
  discount?: number | null;
  discountStartsAt?: Date | null;
  discountEndsAt?: Date | null;
}) {
  const discount = Number(product.discount ?? 0);
  if (!isDiscountActive(discount, product.discountStartsAt, product.discountEndsAt)) {
    return Number(product.price);
  }
  const next = Number(product.price) * (1 - discount / 100);
  return Math.max(0, Math.round(next * 100) / 100);
}
