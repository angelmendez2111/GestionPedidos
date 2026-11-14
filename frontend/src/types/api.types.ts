export type EntityStatus = 'ACTIVO' | 'INACTIVO';

export type OrderStatus =
  | 'PENDIENTE'
  | 'CONFIRMADO'
  | 'CANCELADO'
  | 'COMPLETADO';

export interface Customer {
  id: number;
  name: string;
  document: string;
  email: string;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  price: number;
  stock: number;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  customer: Customer;
  status: OrderStatus;
  discountPercentage: number;
  subtotal: number;
  discount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}
