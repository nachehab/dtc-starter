import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { HttpTypes } from "@medusajs/types"

export default function CollectionTemplate({
  sortBy,
  collection,
  page,
  countryCode,
}: {
  sortBy?: SortOptions
  collection: HttpTypes.StoreCollection
  page?: string
  countryCode: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  return (
    <div className="content-container py-8 small:py-12">
      <div className="mb-8 rounded-[28px] border border-white/10 bg-[rgba(10,23,34,0.86)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-[18px] small:p-8">
        <span className="rp-pill mb-4">Riders Paradise</span>
        <h1 className="rp-heading text-5xl font-bold uppercase leading-none text-white">
          {collection.title}
        </h1>
        <p className="mt-4 max-w-2xl text-[#b7c0b3]">
          Premium gear selected for riders who live full throttle.
        </p>
      </div>
      <div className="flex flex-col gap-8 small:flex-row small:items-start">
      <RefinementList sortBy={sort} />
      <div className="w-full">
        <div className="mb-8">
          <h2 className="rp-heading text-3xl font-bold uppercase text-white">
            Featured products
          </h2>
        </div>
        <Suspense
          fallback={
            <SkeletonProductGrid
              numberOfProducts={collection.products?.length}
            />
          }
        >
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            collectionId={collection.id}
            countryCode={countryCode}
          />
        </Suspense>
      </div>
      </div>
    </div>
  )
}
