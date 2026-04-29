import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout",
}

export default async function Checkout() {
  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  const customer = await retrieveCustomer()

  return (
    <div className="content-container py-12">
      <div className="mb-8 rounded-[28px] border border-white/10 bg-[rgba(10,23,34,0.86)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-[18px]">
        <span className="rp-pill mb-4">Secure checkout</span>
        <h1 className="rp-heading text-5xl font-bold uppercase leading-none text-white">
          Gear up and roll out
        </h1>
      </div>
      <div className="grid grid-cols-1 gap-8 small:grid-cols-[1fr_416px]">
        <div className="rp-card p-6">
          <PaymentWrapper cart={cart}>
            <CheckoutForm cart={cart} customer={customer} />
          </PaymentWrapper>
        </div>
        <CheckoutSummary cart={cart} />
      </div>
    </div>
  )
}
