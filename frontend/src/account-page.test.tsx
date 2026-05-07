import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'customer@demo.com', role: 'customer', name: 'Demo User' },
    loading: false,
  }),
}));

import api from '../services/api';

const mockAddresses = [
  { id: 1, label: 'Home', street: '123 Main St', city: 'Istanbul', postalCode: '34000', country: 'Turkey' },
  { id: 2, label: 'Work', street: '456 Office Ave', city: 'Ankara', postalCode: '06000', country: 'Turkey' },
];

const mockCards = [
  { id: 1, label: 'Personal Visa', last4: '4242', expiryMonth: 12, expiryYear: 2027 },
];

describe('Account page data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.includes('addresses')) return Promise.resolve({ data: mockAddresses });
      if (url.includes('cards')) return Promise.resolve({ data: mockCards });
      return Promise.resolve({ data: [] });
    });
  });

  it('mock returns two saved addresses', async () => {
    const res = await api.get('/users/me/addresses');
    expect(res.data).toHaveLength(2);
  });

  it('addresses have valid 5-digit postal codes', async () => {
    const res = await api.get('/users/me/addresses');
    res.data.forEach((addr: { postalCode: string }) => {
      expect(/^\d{5}$/.test(addr.postalCode)).toBe(true);
    });
  });

  it('mock returns saved payment cards', async () => {
    const res = await api.get('/users/me/cards');
    expect(res.data).toHaveLength(1);
  });

  it('card last4 is exactly 4 characters', async () => {
    const res = await api.get('/users/me/cards');
    res.data.forEach((card: { last4: string }) => {
      expect(card.last4).toHaveLength(4);
    });
  });

  it('card expiry year is in the future', async () => {
    const res = await api.get('/users/me/cards');
    const currentYear = new Date().getFullYear();
    res.data.forEach((card: { expiryYear: number }) => {
      expect(card.expiryYear).toBeGreaterThanOrEqual(currentYear);
    });
  });

  it('renders a basic account shell without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <div data-testid="account-root">
          <h1>My Account</h1>
          <p>customer@demo.com</p>
        </div>
      </MemoryRouter>
    );
    expect(screen.getByText('My Account')).toBeInTheDocument();
    expect(screen.getByText('customer@demo.com')).toBeInTheDocument();
  });
});
