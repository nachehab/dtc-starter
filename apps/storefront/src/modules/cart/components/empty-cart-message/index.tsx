import { Heading, Text } from "@modules/common/components/ui"

import InteractiveLink from "@modules/common/components/interactive-link"

const EmptyCartMessage = () => {
  return (
    <div className="rp-card my-12 flex flex-col items-start justify-center px-6 py-24" data-testid="empty-cart-message">
      <Heading
        level="h1"
        className="flex flex-row text-3xl-regular gap-x-2 items-baseline"
      >
        Cart
      </Heading>
      <Text className="text-base-regular mt-4 mb-6 max-w-[32rem]">
        Your cart is ready for premium ebike gear. Shop helmets, grips,
        apparel, parts, and accessories to kit out the next ride.
      </Text>
      <div>
        <InteractiveLink href="/store">Explore products</InteractiveLink>
      </div>
    </div>
  )
}

export default EmptyCartMessage
