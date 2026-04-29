import { HttpTypes } from "@medusajs/types"
import { getPublicAssetUrl } from "@lib/util/public-asset-url"
import { Container } from "@modules/common/components/ui"
import Image from "next/image"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  return (
    <div className="flex items-start relative">
      <div className="flex flex-col flex-1 gap-y-4">
        {images.map((image, index) => {
          const imageUrl = getPublicAssetUrl(image.url)

          return (
            <Container
              key={image.id}
              className="relative aspect-[4/3] w-full overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04]"
              id={image.id}
            >
              {!!imageUrl && (
                <Image
                  src={imageUrl}
                  priority={index <= 2 ? true : false}
                  className="absolute inset-0 rounded-[24px]"
                  alt={`Product image ${index + 1}`}
                  fill
                  sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
                  style={{
                    objectFit: "cover",
                  }}
                />
              )}
            </Container>
          )
        })}
      </div>
    </div>
  )
}

export default ImageGallery
