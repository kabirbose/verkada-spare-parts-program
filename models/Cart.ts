import { Schema, model, models } from "mongoose";

export interface ICartItem {
  partId: string;
  partName: string;
  quantity: number;
}

export interface ICart {
  _id: string;
  items: ICartItem[];
}

const CartItemSchema = new Schema<ICartItem>(
  {
    partId: { type: String, required: true },
    partName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const CartSchema = new Schema<ICart>({
  _id: { type: String, required: true },
  items: { type: [CartItemSchema], default: [] },
});

export const Cart = models.Cart || model<ICart>("Cart", CartSchema);
