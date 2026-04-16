import mongoose, { Schema, model, models } from "mongoose";

export interface ISparePart {
  _id: string;
  compatibleProduct: string[];
  sparePart: string;
  notes: string;
  availableAt: string;
  type: string;
  inStockStatus: string;
  eta: string;
  imageUrl: string;
}

const SparePartSchema = new Schema<ISparePart>({
  _id: { type: String, required: true },
  compatibleProduct: [{ type: String }],
  sparePart: { type: String, required: true },
  notes: { type: String },
  availableAt: { type: String },
  type: { type: String },
  inStockStatus: { type: String },
  eta: { type: String },
  imageUrl: { type: String },
});

export const SparePart = models.SparePart || model<ISparePart>("SparePart", SparePartSchema);