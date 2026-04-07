import mongoose, { Schema, model, models } from "mongoose";

export interface IProduct {
  _id: string; 
  name: string;
  description: string;
  imageUrl: string;
}

const ProductSchema = new Schema<IProduct>({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
});

export const Product = models.Product || model<IProduct>("Product", ProductSchema);