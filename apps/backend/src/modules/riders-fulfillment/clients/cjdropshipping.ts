type CJOptions = {
  apiKey?: string
}

type CJTokenResponse = {
  code: number
  result: boolean
  message: string
  data?: {
    accessToken: string
    accessTokenExpiryDate: string
    refreshToken?: string
    refreshTokenExpiryDate?: string
  }
}

export class CJDropshippingClient {
  private apiKey?: string
  private accessToken?: string
  private accessTokenExpiry?: number

  private baseUrl = "https://developers.cjdropshipping.com/api2.0/v1"

  constructor(options: CJOptions) {
    this.apiKey = options.apiKey
  }

  private async getAccessToken() {
    if (!this.apiKey) {
      throw new Error("CJ_API_KEY is missing")
    }

    if (this.accessToken && this.accessTokenExpiry && Date.now() < this.accessTokenExpiry) {
      return this.accessToken
    }

    const res = await fetch(`${this.baseUrl}/authentication/getAccessToken`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiKey: this.apiKey,
      }),
    })

    const json = (await res.json()) as CJTokenResponse

    if (!res.ok || !json.result || !json.data?.accessToken) {
      throw new Error(
        `CJ token failed: ${res.status} ${JSON.stringify(json)}`
      )
    }

    this.accessToken = json.data.accessToken

    // CJ access tokens last 15 days, but cache safely shorter.
    this.accessTokenExpiry = Date.now() + 1000 * 60 * 60 * 24 * 10

    return this.accessToken
  }

  async createOrder(payload: any) {
    const token = await this.getAccessToken()

    const address = payload.shipping_address || {}

    const cjPayload = {
      orderNumber: payload.order_id,
      shippingZip: address.postal_code || "",
      shippingCountryCode: String(address.country_code || "CA").toUpperCase(),
      shippingCountry: address.country_code || "CA",
      shippingProvince: address.province || "",
      shippingCity: address.city || "",
      shippingCounty: "",
      shippingPhone: address.phone || "",
      shippingCustomerName:
        `${address.first_name || ""} ${address.last_name || ""}`.trim() ||
        payload.email ||
        "Customer",
      shippingAddress: address.address_1 || "",
      shippingAddress2: address.address_2 || "",
      email: payload.email || "",
      payType: 3,
      logisticName: "CJPacket",
      fromCountryCode: "CN",
      platform: "Api",
      shopLogisticsType: 2,
      products: payload.items.map((item: any) => {
        const cleanSku = String(item.sku || "")
          .replace(/^DS-/, "")

        return {
          vid: item.variant?.metadata?.cj_vid,
          quantity: Number(item.quantity || 1),
          storeLineItemId: item.id,
        }
      }),
    }

    const res = await fetch(`${this.baseUrl}/shopping/order/createOrderV2`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "CJ-Access-Token": token,
        platformToken: "",
      },
      body: JSON.stringify(cjPayload),
    })

    const json = await res.json()

    if (!res.ok || json.result === false || json.success === false) {
      throw new Error(
        `CJ create order failed: ${res.status} ${JSON.stringify(json)}`
      )
    }

    return {
      provider: "cj",
      status: "submitted",
      external_order_id: json?.data?.orderId,
      cj_order_number: json?.data?.orderNumber,
      cj_pay_url: json?.data?.cjPayUrl,
      raw: json,
    }
  }

  async cancelOrder(externalOrderId: string) {
    return {
      provider: "cj",
      status: "manual_cancel_required",
      external_order_id: externalOrderId,
    }
  }
}