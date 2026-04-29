import { Button, Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"

const Hero = () => {
  return (
    <section className="content-container pt-8 small:pt-12">
      <div className="grid gap-6 overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(10,23,34,0.86)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-[18px] small:grid-cols-[1.08fr_0.92fr] small:p-8">
        <div className="grid min-h-[460px] content-center gap-6 rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(9,20,14,0.96),rgba(18,50,29,0.86))] p-6 small:min-h-[560px] small:p-10">
          <span className="rp-pill w-fit">Premium Ebike Gear</span>
          <div className="grid gap-4">
            <Heading
              level="h1"
              className="rp-heading max-w-4xl text-[3.4rem] font-bold uppercase leading-[0.92] text-white small:text-[5.6rem]"
            >
              Built for riders who live full throttle
            </Heading>
            <Text className="max-w-2xl text-large-regular leading-7 text-[#b7c0b3]">
              Shop helmets, grips, apparel, parts, and accessories with a dark
              premium edge made for ebike streets, trail days, and everyday
              rider life.
            </Text>
          </div>
          <div className="flex flex-wrap gap-3">
            <LocalizedClientLink href="/store">
              <Button size="large">Shop the gear</Button>
            </LocalizedClientLink>
            <LocalizedClientLink href="/cart">
              <Button size="large" variant="secondary">
                View cart
              </Button>
            </LocalizedClientLink>
          </div>
        </div>

        <div className="grid gap-5 rounded-[24px] border border-white/10 bg-white/[0.04] p-6">
          <div className="rounded-[24px] bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
            <Image
              src="/riders-paradise-logo.png"
              alt="Riders Paradise logo"
              width={720}
              height={520}
              priority
              className="mx-auto max-h-[360px] w-full object-contain"
            />
          </div>
          <div className="grid gap-4 rounded-[20px] border border-white/10 bg-white/[0.04] p-6">
            <span className="rp-pill w-fit">Ride harder. Gear smarter.</span>
            <Text className="leading-7 text-[#b7c0b3]">
              Forest-inspired branding, lime accents, and tough product cards
              give every ride essential the premium Riders Paradise treatment.
            </Text>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
