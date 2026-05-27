export class ManualOEMClient {
  async createOrder(payload: any) {
    return {
      provider: "oem_manual",
      status: "manual_review_required",
      external_order_id: `manual_oem_${Date.now()}`,
      payload,
    }
  }

  async cancelOrder(externalOrderId: string) {
    return {
      provider: "oem_manual",
      status: "manual_review_required",
      external_order_id: externalOrderId,
    }
  }
}