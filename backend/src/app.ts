import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import { ApiError } from './utils/ApiError';

dotenv.config();

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/products', productRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

app.use((err: ApiError, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({ error: message });
});

export default app;