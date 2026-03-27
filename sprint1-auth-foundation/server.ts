import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import cartRoutes from './routes/cart';
import wishlistRoutes from './routes/wishlist';
import orderRoutes from './routes/orders';
import invoiceRoutes from './routes/invoices';
import reviewRoutes from './routes/reviews';
import discountRoutes from './routes/discounts';
import deliveryRoutes from './routes/deliveries';

const app = express();

app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }));
app.use('/storage', express.static(path.join(process.cwd(), 'storage')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/deliveries', deliveryRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use(errorHandler);

if (require.main === module) {
  app.listen(config.port, () => console.log(`Server running on port ${config.port}`));
}

export default app;
