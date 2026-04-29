import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import ProductActionsWrapper from "./product-actions-wrapper"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <>
      <div className="content-container py-8 small:py-12" data-testid="product-container">
        <div className="mb-8 rounded-[28px] border border-white/10 bg-[rgba(10,23,34,0.86)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-[18px] small:p-8">
          <span className="rp-pill mb-4">Ride harder. Gear smarter.</span>
          <h1 className="rp-heading text-5xl font-bold uppercase leading-none text-white">
            Premium rider detail
          </h1>
        </div>
        <div className="grid gap-6 small:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.35fr)_minmax(280px,0.85fr)] small:items-start">
        <div className="rp-card flex flex-col small:sticky small:top-28 small:py-0 w-full p-6 gap-y-6">
          <ProductInfo product={product} />
          <ProductTabs product={product} />
        </div>
        <div className="block w-full relative">
          <ImageGallery images={images} />
        </div>
        <div className="rp-card flex flex-col small:sticky small:top-28 small:py-0 w-full p-6 gap-y-8">
          <ProductOnboardingCta />
          <Suspense
            fallback={
              <ProductActions
                disabled={true}
                product={product}
                region={region}
              />
            }
          >
            <ProductActionsWrapper id={product.id} region={region} />
          </Suspense>
        </div>
        </div>
      </div>
      <div
        className="content-container my-16"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
