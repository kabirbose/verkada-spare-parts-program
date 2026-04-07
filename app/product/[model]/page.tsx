import dbConnect from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { SparePart } from "@/models/SparePart";
import ProductDetail from "@/components/ProductDetail";
import Link from "next/link";

export default async function ProductPage({ params }: { params: Promise<{ model: string }> }) {
  // 1. Await the params
  const resolvedParams = await params;
  const modelId = resolvedParams.model.toLowerCase();

  // 2. Connect to MongoDB
  await dbConnect();

  // 3. Fetch the specific product by its _id
  const rawProduct = await Product.findOne({ _id: modelId }).lean();

  if (!rawProduct) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Product Not Found</h1>
        <Link href="/" className="text-blue-600 hover:underline">← Back to Models</Link>
      </div>
    );
  }

  // Convert mongoose document to a plain JS object
  const product = { ...rawProduct, _id: rawProduct._id.toString() } as any;

  // 4. Fetch all spare parts where 'compatibleProduct' array contains this product's name
  const rawParts = await SparePart.find({ compatibleProduct: product.name }).lean();

  const parts = rawParts.map((p: any) => ({
    ...p,
    _id: p._id.toString(),
  }));

  // 5. Pass data to the Client Component
  return <ProductDetail product={product} parts={parts} />;
}