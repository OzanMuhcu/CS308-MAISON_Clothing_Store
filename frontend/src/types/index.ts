export interface User {
  id: number;
  name: string;
  email: string;
  role: "customer" | "sales_manager" | "product_manager";
  createdAt: string;
  /** Story 14: user's saved default delivery address; null if not yet set. */
  defaultAddress?: OrderAddress | null;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stockQty: number;
  sku: string;
  imageUrl: string;
  category: string;
  model: string;
  serialNumber: string;
  warrantyStatus: string;
  distributorInfo: string;
  avgRating: number;
  ratingCount: number;
}

export interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  product: Product;
}

export interface GuestCartItem {
  productId: number;
  quantity: number;
  name: string;
  price: number;
  imageUrl: string;
  stockQty: number;
  sku: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Story 16
export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface SavedAddress extends OrderAddress {
  id: number;
  label: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedCard {
  id: number;
  label: string;
  cardholderFullName: string;
  cardNumber: string;
  cvv: string;
  last4: string;
  expiry: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  totalAmount: number;
  status: string;
  address: OrderAddress;
  invoiceNo: string | null;
  createdAt: string;
  items: OrderItem[];
}

// Wishlist
export interface WishlistItem {
  id: number;
  wishlistId: number;
  productId: number;
  createdAt: string;
  product: Product;
}

export interface WishlistList {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
}

// Reviews
export interface ReviewComment {
  id: number;
  userId: number;
  userName: string;
  text: string;
  createdAt: string;
}

export interface ReviewRating {
  id: number;
  userId: number;
  userName: string;
  value: number;
  createdAt: string;
}

export interface ProductReviews {
  comments: ReviewComment[];
  ratings: ReviewRating[];
  avgRating: number;
  ratingCount: number;
}

export interface MyReviewData {
  canReview: boolean;
  myRating: number | null;
  myComments: { id: number; text: string; status: string; createdAt: string }[];
}
