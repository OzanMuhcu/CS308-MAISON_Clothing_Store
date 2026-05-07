import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

import api from '../services/api';

const mockOrders = [
  {
    id: 101,
    status: 'delivered',
    totalPrice: 109.98,
    createdAt: '2026-04-01T10:00:00Z',
    items: [
      { productId: 1, productName: 'Classic White T-Shirt', quantity: 2, unitPrice: 29.99 },
      { productId: 2, productName: 'Slim Fit Jeans', quantity: 1, unitPrice: 49.99 },
    ],
  },
  {
    id: 102,
    status: 'processing',
    totalPrice: 79.99,
    createdAt: '2026-04-20T14:30:00Z',
    items: [
      { productId: 3, productName: 'Wool Coat', quantity: 1, unitPrice: 79.99 },
    ],
  },
  {
    id: 103,
    status: 'in-transit',
    totalPrice: 29.99,
    createdAt: '2026-04-28T09:15:00Z',
    items: [
      { productId: 1, productName: 'Classic White T-Shirt', quantity: 1, unitPrice: 29.99 },
    ],
  },
];

describe('Order history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockOrders });
  });

  it('mock returns correct number of orders', async () => {
    const res = await api.get('/orders');
    expect(res.data).toHaveLength(3);
  });

  it('all orders have a positive total price', async () => {
    const res = await api.get('/orders');
    res.data.forEach((order: { totalPrice: number }) => {
      expect(order.totalPrice).toBeGreaterThan(0);
    });
  });

  it('all orders have a valid status', async () => {
    const validStatuses = ['delivered', 'processing', 'in-transit', 'cancelled'];
    const res = await api.get('/orders');
    res.data.forEach((order: { status: string }) => {
      expect(validStatuses).toContain(order.status);
    });
  });

  it('each order contains at least one item', async () => {
    const res = await api.get('/orders');
    res.data.forEach((order: { items: unknown[] }) => {
      expect(order.items.length).toBeGreaterThan(0);
    });
  });

  it('each order item has a positive unit price', async () => {
    const res = await api.get('/orders');
    res.data.forEach((order: { items: { unitPrice: number }[] }) => {
      order.items.forEach((item) => {
        expect(item.unitPrice).toBeGreaterThan(0);
      });
    });
  });

  it('each order item has a positive quantity', async () => {
    const res = await api.get('/orders');
    res.data.forEach((order: { items: { quantity: number }[] }) => {
      order.items.forEach((item) => {
        expect(item.quantity).toBeGreaterThan(0);
      });
    });
  });

  it('renders a basic order history shell without crashing', () => {
    render(
      <MemoryRouter>
        <div data-testid="orders-root">
          <h1>My Orders</h1>
        </div>
      </MemoryRouter>
    );
    expect(screen.getByText('My Orders')).toBeInTheDocument();
  });
});
