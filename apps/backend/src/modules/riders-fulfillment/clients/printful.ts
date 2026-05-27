type PrintfulOptions = {
  apiKey?: string
}

export class PrintfulClient {
  private apiKey?: string

  constructor(options: PrintfulOptions) {
    this.apiKey = options.apiKey
  }

  async createOrder(payload: any) {
    if (!this.apiKey) {
      return {
        provider: "printful",
        status: "skipped_missing_api_key",
        payload,
      }
    }

    return {
      provider: "printful",
      status: "mock_submitted",
      external_order_id: `printful_${Date.now()}`,
      payload,
    }
  }

  async cancelOrder(externalOrderId: string) {
    return {
      provider: "printful",
      status: "mock_cancelled",
      external_order_id: externalOrderId,
    }
  }
}