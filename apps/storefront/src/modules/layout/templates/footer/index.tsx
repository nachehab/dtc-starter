import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { Text, clx } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"

export default async function Footer() {
  const { collections } = await listCollections({
    fields: "*products",
  })
  const productCategories = await listCategories()

  return (
    <footer className="content-container mb-6 mt-10">
      <div className="rounded-[28px] border border-white/10 bg-[rgba(10,23,34,0.86)] px-6 py-10 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-[18px] small:px-10">
        <div className="flex flex-col gap-y-10 xsmall:flex-row items-start justify-between">
          <div className="max-w-sm">
            <LocalizedClientLink href="/" className="flex items-center gap-4">
              <Image
                src="/riders-paradise-logo.png"
                alt="Riders Paradise"
                width={180}
                height={118}
                className="w-[150px] rounded-[10px] bg-white p-2 object-contain"
              />
            </LocalizedClientLink>
            <p className="mt-5 text-small-regular leading-6 text-[#b7c0b3]">
              Ride harder. Gear smarter. Premium ebike gear, helmets, grips,
              apparel, parts, and accessories for the full-throttle lifestyle.
            </p>
          </div>

          <div className="text-small-regular gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-3">
            {productCategories && productCategories?.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus text-white">Categories</span>
                <ul className="grid grid-cols-1 gap-2" data-testid="footer-categories">
                  {productCategories?.slice(0, 6).map((c) => {
                    if (c.parent_category) {
                      return
                    }

                    const children =
                      c.category_children?.map((child) => ({
                        name: child.name,
                        handle: child.handle,
                        id: child.id,
                      })) || null

                    return (
                      <li className="flex flex-col gap-2 text-[#b7c0b3] txt-small" key={c.id}>
                        <LocalizedClientLink
                          className={clx("hover:text-[#c6ff5e]", children && "txt-small-plus")}
                          href={`/categories/${c.handle}`}
                          data-testid="category-link"
                        >
                          {c.name}
                        </LocalizedClientLink>
                        {children && (
                          <ul className="grid grid-cols-1 ml-3 gap-2">
                            {children.map((child) => (
                              <li key={child.id}>
                                <LocalizedClientLink
                                  className="hover:text-[#c6ff5e]"
                                  href={`/categories/${child.handle}`}
                                  data-testid="category-link"
                                >
                                  {child.name}
                                </LocalizedClientLink>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {collections && collections.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus text-white">Collections</span>
                <ul
                  className={clx("grid grid-cols-1 gap-2 text-[#b7c0b3] txt-small", {
                    "grid-cols-2": (collections?.length || 0) > 3,
                  })}
                >
                  {collections?.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <LocalizedClientLink
                        className="hover:text-[#c6ff5e]"
                        href={`/collections/${c.handle}`}
                      >
                        {c.title}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-y-2">
              <span className="txt-small-plus text-white">Riders</span>
              <ul className="grid grid-cols-1 gap-y-2 text-[#b7c0b3] txt-small">
                <li>
                  <LocalizedClientLink href="/store" className="hover:text-[#c6ff5e]">
                    Premium Ebike Gear
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink href="/account" className="hover:text-[#c6ff5e]">
                    Rider Account
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink href="/cart" className="hover:text-[#c6ff5e]">
                    Cart
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex w-full flex-col justify-between gap-3 border-t border-white/10 pt-6 text-[#b7c0b3] small:flex-row">
          <Text className="txt-compact-small">
            © {new Date().getFullYear()} Riders Paradise. All rights reserved.
          </Text>
          <Text className="txt-compact-small">
            Built for riders who live full throttle.
          </Text>
        </div>
      </div>
    </footer>
  )
}
