"use client";

import { useState } from "react";
import Link from "next/link";
import { IProduct } from "@/models/Product";
import { ISparePart } from "@/models/SparePart";
import StatusBadge from "@/components/ui/StatusBadge";

interface ProductDetailProps {
  product: IProduct;
  parts: ISparePart[];
}

export default function ProductDetail({ product, parts }: ProductDetailProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredParts = parts.filter(
    (part) =>
      part.sparePart.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (part.type && part.type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">

        {/* Back Button & Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium mb-6 transition-colors">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Models
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex items-center gap-6">
              <img src={product.imageUrl} alt={product.name} className="w-24 h-24 rounded-lg object-cover border border-gray-200 shadow-sm bg-white" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{product.name} Spare Parts</h1>
                <p className="text-gray-500 mt-1">{product.description}</p>
              </div>
            </div>
            <div className="w-full md:w-72">
              <input
                type="text"
                placeholder="Search parts by name or type..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Parts Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  <th className="px-6 py-4">Spare Part</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Available At</th>
                  <th className="px-6 py-4">In Stock</th>
                  <th className="px-6 py-4">ETA</th>
                  <th className="px-6 py-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredParts.length > 0 ? (
                  filteredParts.map((part) => (
                    <tr key={part._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{part.sparePart}</td>
                      <td className="px-6 py-4 text-gray-600">{part.type || "-"}</td>
                      <td className="px-6 py-4">
                        <StatusBadge value={part.availableAt} variant="location" />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge value={part.inStockStatus} variant="stock" />
                      </td>
                      <td className="px-6 py-4 text-gray-600">{part.eta || "-"}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm max-w-xs truncate" title={part.notes}>
                        {part.notes || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {parts.length === 0
                        ? `No spare parts are currently listed for the ${product.name}.`
                        : `No parts found matching "${searchTerm}".`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
