"use client"

import { placeOrder } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "@modules/checkout/components/error-message"
import { Button } from "@modules/common/components/ui"
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js"
import React, { useState } from "react"

type PayPalPaymentButtonProps = {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback

const PayPalPaymentButton: React.FC<PayPalPaymentButtonProps> = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [{ isResolved }] = usePayPalScriptReducer()

  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const getPayPalOrderId = (): string | null => {
    if (!paymentSession?.data) {
      return null
    }

    return (
      (paymentSession.data.order_id as string) ||
      (paymentSession.data.orderId as string) ||
      (paymentSession.data.id as string) ||
      null
    )
  }

  const createOrder = async () => {
    setSubmitting(true)
    setErrorMessage(null)

    try {
      if (!paymentSession) {
        throw new Error("Payment session not found")
      }

      const existingOrderId = getPayPalOrderId()

      if (existingOrderId) {
        return existingOrderId
      }

      throw new Error(
        "PayPal order not found. Please ensure the payment session is properly initialized."
      )
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, "Failed to create PayPal order"))
      setSubmitting(false)
      throw error
    }
  }

  const onApprove = async () => {
    try {
      setSubmitting(true)
      setErrorMessage(null)
      await onPaymentCompleted()
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(error, "Failed to process PayPal payment")
      )
      setSubmitting(false)
    }
  }

  const onError = (err: Record<string, unknown>) => {
    setErrorMessage(
      (err.message as string) || "An error occurred with PayPal payment"
    )
    setSubmitting(false)
  }

  const onCancel = () => {
    setSubmitting(false)
    setErrorMessage("PayPal payment was cancelled")
  }

  if (!isResolved) {
    return (
      <>
        <Button
          disabled={true}
          size="large"
          isLoading={true}
          data-testid={dataTestId}
        >
          Loading PayPal...
        </Button>
        <ErrorMessage
          error={errorMessage}
          data-testid="paypal-payment-error-message"
        />
      </>
    )
  }

  return (
    <>
      <div className="mb-4">
        <PayPalButtons
          createOrder={createOrder}
          onApprove={onApprove}
          onError={onError}
          onCancel={onCancel}
          style={{
            layout: "horizontal",
            color: "black",
            shape: "rect",
            label: "buynow",
          }}
          disabled={notReady || submitting}
          data-testid={dataTestId}
        />
      </div>
      <ErrorMessage
        error={errorMessage}
        data-testid="paypal-payment-error-message"
      />
    </>
  )
}

export default PayPalPaymentButton
