import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Cart } from "@/models/Cart";

const CART_ID = "main";

// GET /api/cart
export async function GET() {
  await dbConnect();
  const cart = await Cart.findById(CART_ID);
  return NextResponse.json(cart ?? { _id: CART_ID, items: [] });
}

// POST /api/cart — add part, or increment quantity if already in cart
export async function POST(req: Request) {
  await dbConnect();
  const { partId, partName } = await req.json();

  let cart = await Cart.findById(CART_ID);
  if (!cart) {
    cart = await Cart.create({ _id: CART_ID, items: [] });
  }

  const existing = cart.items.find((item: { partId: string }) => item.partId === partId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.items.push({ partId, partName, quantity: 1 });
  }

  await cart.save();
  return NextResponse.json(cart);
}

// DELETE /api/cart — clear entire cart
export async function DELETE() {
  await dbConnect();
  const cart = await Cart.findById(CART_ID);
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  return NextResponse.json({ _id: CART_ID, items: [] });
}
