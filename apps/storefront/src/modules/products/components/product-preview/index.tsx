import { Text } from "@modules/common/components/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"

export default async function ProductPreview({
  product,
  isFeatured,
  region: _region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  // const pricedProduct = await listProducts({
  //   regionId: region.id,
  //   queryParams: { id: [product.id!] },
  // }).then(({ response }) => response.products[0])

  // if (!pricedProduct) {
  //   return null
  // }

  const { cheapestPrice } = getProductPrice({
    product,
  })

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group">
      <div
        className="h-full overflow-hidden rounded-[24px] border border-white/10 bg-[rgba(10,23,34,0.86)] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-[18px]"
        data-testid="product-wrapper"
      >
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          size="full"
          isFeatured={isFeatured}
        />
        <div className="mt-4 grid gap-3 px-2 pb-2 txt-compact-medium">
          <div className="flex items-start justify-between gap-3">
            <Text className="font-semibold text-white" data-testid="product-title">
              {product.title}
            </Text>
            <span className="rounded-full border border-[#c6ff5e]/20 bg-[#c6ff5e]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#c6ff5e]">
              Gear
            </span>
          </div>
          <div className="flex items-center justify-between gap-x-2 text-[#b7c0b3]">
            <span>Riders Paradise</span>
          <div className="flex items-center gap-x-2">
            {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
          </div>
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
