import mongoose, { Schema, model, models } from "mongoose";

export interface ISparePart {
  _id: string;              // Numeric part ID string, e.g. "267"
  sparePart: string;        // Display name, e.g. "CD61 Bubble"
  compatibleProduct: string[]; // Device names this part fits, e.g. ["CD61", "CD62"]
  type: string;             // Part category, e.g. "Bubble", "Mount"
  availableAt: string;      // Storage location, e.g. "Warehouse Aisle 4"
  inStockStatus: string;    // Availability, e.g. "Yes", "No", "5 Left"
  eta: string;              // Expected restock date if out of stock, e.g. "5/23/2026"
  notes: string;            // Free-form instructions or additional info
  imageUrl: string;         // External URL or base64 data URL
}

const SparePartSchema = new Schema<ISparePart>({
  _id:              { type: String, required: true },
  sparePart:        { type: String, required: true },
  compatibleProduct: [{ type: String }],
  type:             { type: String },
  availableAt:      { type: String },
  inStockStatus:    { type: String },
  eta:              { type: String },
  notes:            { type: String },
  imageUrl:         { type: String },
});

// Guard against model re-registration during Next.js hot-reloads
export const SparePart = models.SparePart || model<ISparePart>("SparePart", SparePartSchema);
