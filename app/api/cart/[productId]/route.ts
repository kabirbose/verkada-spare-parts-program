import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Cart } from "@/models/Cart";

const CART_ID = "main";

// PUT /api/cart/[partId] — update quantity
export async function PUT(req: Request, { params }: { params: Promise<{ productId: string }> }) {
  await dbConnect();
  const { productId: partId } = await params;
  const { quantity } = await req.json();

  const cart = await Cart.findById(CART_ID);
  if (!cart) return NextResponse.json({ error: "Cart not found" }, { status: 404 });

  const item = cart.items.find((i: { partId: string }) => i.partId === partId);
  if (!item) return NextResponse.json({ error: "Item not found in cart" }, { status: 404 });

  item.quantity = Math.max(1, quantity);
  await cart.save();
  return NextResponse.json(cart);
}

// DELETE /api/cart/[partId] — remove a single item
export async function DELETE(_req: Request, { params }: { params: Promise<{ productId: string }> }) {
  await dbConnect();
  const { productId: partId } = await params;

  const cart = await Cart.findById(CART_ID);
  if (!cart) return NextResponse.json({ error: "Cart not found" }, { status: 404 });

  cart.items = cart.items.filter((i: { partId: string }) => i.partId !== partId);
  await cart.save();
  return NextResponse.json(cart);
}
