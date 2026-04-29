import { Suspense } from "react"

import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import Image from "next/image"

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative min-h-20 mx-auto border-b border-white/10 bg-[#061018]/85 backdrop-blur-[18px] duration-200">
        <nav className="content-container text-[#b7c0b3] flex items-center justify-between w-full min-h-20 text-small-regular gap-4">
          <div className="flex-1 basis-0 h-full flex items-center">
            <div className="h-full">
              <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
            </div>
          </div>

          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="flex items-center gap-3 hover:text-white"
              data-testid="nav-store-link"
            >
              <Image
                src="/riders-paradise-logo.png"
                alt="Riders Paradise"
                width={92}
                height={72}
                priority
                className="h-14 w-[72px] rounded-[10px] bg-white p-1 object-contain small:h-[72px] small:w-[92px]"
              />
              <span className="rp-heading hidden text-2xl font-bold uppercase leading-none text-white xsmall:block">
                Riders Paradise
              </span>
            </LocalizedClientLink>
          </div>

          <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
            <div className="hidden small:flex items-center gap-x-6 h-full">
              <LocalizedClientLink
                className="hover:text-white"
                href="/store"
                data-testid="nav-storefront-link"
              >
                Shop
              </LocalizedClientLink>
              <LocalizedClientLink
                className="hover:text-white"
                href="/account"
                data-testid="nav-account-link"
              >
                Account
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-white hover:text-[#c6ff5e] flex gap-2"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Cart (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
