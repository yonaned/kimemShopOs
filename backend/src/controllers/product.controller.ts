import { Response, NextFunction } from 'express';
import { db } from '../db';
import { products } from '../db/schema';
import { eq } from 'drizzle-orm';
import { ApiError } from '../utils/ApiError';
import { AuthRequest } from '../middleware/auth.middleware';

export const createProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, price, image } = req.body;
    if (!name || !price) {
      throw new ApiError(400, 'Product name and price are required');
    }
    const [newProduct] = await db.insert(products).values({
      name,
      description,
      price,
      image
    }).returning();

    res.status(201).json(newProduct);
  } catch (error) {
    next(error);
  }
};

export const getProducts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const allProducts = await db.select().from(products);
    res.status(200).json(allProducts);
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    const [product] = await db.select().from(products).where(eq(products.id, id));

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, price, image } = req.body;

    const [updatedProduct] = await db.update(products).set({
      name,
      description,
      price,
      image,
      updatedAt: new Date()
    }).where(eq(products.id, id)).returning();

    if (!updatedProduct) {
      throw new ApiError(404, 'Product not found');
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    const [deletedProduct] = await db.delete(products).where(eq(products.id, id)).returning();

    if (!deletedProduct) {
      throw new ApiError(404, 'Product not found');
    }

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};