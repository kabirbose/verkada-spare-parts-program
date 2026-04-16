import mongoose, { Schema, model, models } from "mongoose";

export interface IProduct {
  _id: string;        // URL-safe slug, e.g. "cd63"
  name: string;       // Display name, e.g. "CD63"
  description: string; // Category label, e.g. "Indoor Dome Camera"
  imageUrl: string;   // External URL or base64 data URL
}

const ProductSchema = new Schema<IProduct>({
  _id:         { type: String, required: true },
  name:        { type: String, required: true },
  description: { type: String, required: true },
  imageUrl:    { type: String, required: true },
});

// Guard against model re-registration during Next.js hot-reloads
export const Product = models.Product || model<IProduct>("Product", ProductSchema);
