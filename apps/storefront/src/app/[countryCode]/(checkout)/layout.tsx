import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import Image from "next/image"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full relative small:min-h-screen">
      <div className="h-20 border-b border-white/10 bg-[#061018]/85 backdrop-blur-[18px]">
        <nav className="flex h-full items-center content-container justify-between">
          <LocalizedClientLink
            href="/cart"
            className="text-small-semi text-[#b7c0b3] flex items-center gap-x-2 uppercase flex-1 basis-0 hover:text-white"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90" size={16} />
            <span className="mt-px hidden small:block txt-compact-plus text-ui-fg-subtle hover:text-ui-fg-base ">
              Back to shopping cart
            </span>
            <span className="mt-px block small:hidden txt-compact-plus text-ui-fg-subtle hover:text-ui-fg-base">
              Back
            </span>
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/"
            className="flex items-center gap-3 text-white hover:text-[#c6ff5e]"
            data-testid="store-link"
          >
            <Image
              src="/riders-paradise-logo.png"
              alt="Riders Paradise"
              width={92}
              height={72}
              className="h-14 w-[72px] rounded-[10px] bg-white p-1 object-contain"
            />
            <span className="rp-heading hidden text-2xl font-bold uppercase small:block">
              Riders Paradise
            </span>
          </LocalizedClientLink>
          <div className="flex-1 basis-0" />
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">{children}</div>
      <div className="py-4 w-full flex items-center justify-center text-[#b7c0b3]">
        Ride harder. Gear smarter.
      </div>
    </div>
  )
}
