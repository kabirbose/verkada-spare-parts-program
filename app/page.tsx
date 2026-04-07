import ProductsGrid from "@/components/ProductsGrid";
import dbConnect from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { SparePart } from "@/models/SparePart";

export default async function Page() {
  await dbConnect();
  
  // Fetch BOTH collections!
  const products = await Product.find({}).lean();
  const parts = await SparePart.find({}).lean();

  // Convert MongoDB ObjectIds to standard strings before passing to Client component
  const serializedProducts = products.map(p => ({ ...p, _id: p._id.toString() }));
  const serializedParts = parts.map(p => ({ ...p, _id: p._id.toString() }));

  return (
    <main className="container mx-auto p-8">
      {/* Pass both down to the grid! */}
      <ProductsGrid 
        products={serializedProducts as any} 
        spareParts={serializedParts as any} 
      />
    </main>
  );
}