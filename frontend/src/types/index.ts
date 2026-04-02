export interface User {
  id: number;
  name: string;
  email: string;
  role: "customer" | "sales_manager" | "product_manager";
  createdAt: string;
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
}

export interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  product: Product;
}

/** Guest cart item stored in localStorage before login */
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
