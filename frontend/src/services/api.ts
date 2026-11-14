import type { Customer, EntityStatus, Order, Product } from '../types/api.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    let errorMsg = `Error ${response.status}`;
    try {
      const body = await response.json();
      if (Array.isArray(body.message)) {
        errorMsg = body.message.join(' | ');
      } else if (typeof body.message === 'string') {
        errorMsg = body.message;
      }
    } catch {
      // Fallback cuando la respuesta no es JSON
    }
    throw new Error(errorMsg);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Clientes
  getCustomers: () => request<Customer[]>('/customers'),
  createCustomer: (data: {
    name: string;
    document: string;
    email: string;
    status?: EntityStatus;
  }) =>
    request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCustomerStatus: (id: number, status: EntityStatus) =>
    request<Customer>(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Productos
  getProducts: () => request<Product[]>('/products'),
  createProduct: (data: {
    code: string;
    name: string;
    price: number;
    stock: number;
    status?: EntityStatus;
  }) =>
    request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProduct: (
    id: number,
    data: Partial<{ price: number; stock: number; status: EntityStatus; name: string }>,
  ) =>
    request<Product>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Pedidos
  getOrders: () => request<Order[]>('/orders'),
  getOrder: (id: number) => request<Order>(`/orders/${id}`),
  createOrder: (data: {
    customerId: number;
    discountPercentage?: number;
    items?: Array<{ productId: number; quantity: number }>;
  }) =>
    request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  addOrderItem: (orderId: number, data: { productId: number; quantity: number }) =>
    request<Order>(`/orders/${orderId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateOrderItemQuantity: (
    orderId: number,
    itemId: number,
    quantity: number,
  ) =>
    request<Order>(`/orders/${orderId}/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),
  removeOrderItem: (orderId: number, itemId: number) =>
    request<Order>(`/orders/${orderId}/items/${itemId}`, {
      method: 'DELETE',
    }),
  updateOrderDiscount: (orderId: number, discountPercentage: number) =>
    request<Order>(`/orders/${orderId}/discount`, {
      method: 'PATCH',
      body: JSON.stringify({ discountPercentage }),
    }),
  confirmOrder: (orderId: number) =>
    request<Order>(`/orders/${orderId}/confirm`, { method: 'POST' }),
  cancelOrder: (orderId: number) =>
    request<Order>(`/orders/${orderId}/cancel`, { method: 'POST' }),
  completeOrder: (orderId: number) =>
    request<Order>(`/orders/${orderId}/complete`, { method: 'POST' }),
};
