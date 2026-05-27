import { AbstractFulfillmentProviderService } from "@medusajs/framework/utils"

import { PrintfulClient } from "./clients/printful"
import { CJDropshippingClient } from "./clients/cjdropshipping"
import { ManualOEMClient } from "./clients/manual-oem"
import { routeItems } from "./utils/route-items"

type InjectedDependencies = {
  logger: any
}

type Options = {
  api_key?: string
  cj_api_key?: string
  cj_email?: string
  cj_password?: string
  printful_api_key?: string
  mode?: "test" | "production"
}

export default class RidersFulfillmentProviderService extends AbstractFulfillmentProviderService {
  static identifier = "riders"

  protected logger_: any
  protected options_: Options

  protected printfulClient_: PrintfulClient
  protected cjClient_: CJDropshippingClient
  protected manualOEMClient_: ManualOEMClient

  constructor(container: InjectedDependencies, options: Options) {
    super()

    this.logger_ = container.logger
    this.options_ = options

    this.printfulClient_ = new PrintfulClient({
      apiKey: options.printful_api_key,
    })

    this.cjClient_ = new CJDropshippingClient({
      apiKey: options.cj_api_key,
      email: options.cj_email,
      password: options.cj_password,
    })

    this.manualOEMClient_ = new ManualOEMClient()
  }

  async getFulfillmentOptions() {
    return [
      {
        id: "riders-standard",
        name: "Riders Paradise Standard Fulfillment",
      },
      {
        id: "riders-express",
        name: "Riders Paradise Express Fulfillment",
      },
    ]
  }

  async validateOption(data: Record<string, unknown>) {
    return ["riders-standard", "riders-express"].includes(String(data.id))
  }

  async canCalculate() {
    return true
  }

  async calculatePrice(optionData: any, data: any, context: any) {
    const country =
      data?.shipping_address?.country_code ||
      context?.shipping_address?.country_code

    const base = optionData?.id === "riders-express" ? 2499 : 999
    const international = country && country !== "ca" ? 1500 : 0

    return {
      calculated_amount: base + international,
      is_calculated_price_tax_inclusive: false,
    }
  }

  async validateFulfillmentData(optionData: any, data: any) {
    return {
      ...data,
      provider: "riders",
      option_id: optionData?.id,
    }
  }

async createFulfillment(data: any, items: any[], order: any) {
  this.logger_.warn("?????? RIDERS CREATE FULFILLMENT TRIGGERED ??????")
  this.logger_.warn(`[riders] data: ${JSON.stringify(data)}`)
  this.logger_.warn(`[riders] items: ${JSON.stringify(items)}`)
  this.logger_.warn(`[riders] order_id: ${order?.id}`)

  const groups = routeItems(items)

  this.logger_.warn(`[riders] routed groups: ${JSON.stringify(groups)}`)

  const providerOrders: any[] = []
    for (const group of groups) {
      const payload = {
        order_id: order?.id,
        email: order?.email,
        currency_code: order?.currency_code,
        shipping_address: order?.shipping_address,
items: group.items.map((item: any) => {
  const rawSku =
    item.sku ||
    item.variant_sku ||
    item.variant?.sku ||
    item.line_item?.variant_sku ||
    item.line_item?.variant?.sku ||
    ""

  const metadata = {
    ...(item.inventory_item?.metadata || {}),
    ...(item.variant?.metadata || {}),
    ...(item.line_item?.variant?.metadata || {}),
    ...(item.line_item?.metadata || {}),
    ...(item.metadata || {}),
  }

  const cjVid =
    metadata.cj_vid ||
    metadata.vid ||
    item.cj_vid ||
    item.vid

  const cjSku =
    metadata.cj_variant_sku ||
    metadata.cj_sku ||
    item.cj_variant_sku ||
    item.cj_sku ||
    rawSku.replace(/^DS-/, "")

  return {
    id: item.id,
    title: item.title,
    sku: cjSku,
    cj_sku: cjSku,
    vid: cjVid,
    cj_vid: cjVid,
    original_sku: rawSku,
    quantity: Number(item.quantity || 1),
  }
}),
      }

      if (group.provider === "printful") {
        providerOrders.push(await this.printfulClient_.createOrder(payload))
      }

if (group.provider === "cj") {
  this.logger_.warn(
    `[riders] CJ outgoing items: ${JSON.stringify(
      payload.items.map((item: any) => ({
        id: item.id,
        original_sku: item.original_sku,
        sku: item.sku,
        cj_sku: item.cj_sku,
        vid: item.vid,
        cj_vid: item.cj_vid,
        quantity: item.quantity,
      }))
    )}`
  )
}

      if (group.provider === "oem_manual") {
        providerOrders.push(await this.manualOEMClient_.createOrder(payload))
      }
    }

    return {
      data: {
        routed_by: "riders-fulfillment",
        mode: this.options_.mode || "test",
        provider_orders: providerOrders,
      },
      labels: providerOrders
        .filter((order) => order.tracking_number)
        .map((order) => ({
          tracking_number: order.tracking_number,
          tracking_url: order.tracking_url,
          label_url: order.label_url,
        })),
    }
  }

  async cancelFulfillment(data: any) {
    this.logger_.info(
      `[riders-fulfillment] cancel requested ${JSON.stringify(data)}`
    )

    return {
      canceled: true,
      provider: "riders",
      data,
    }
  }

  async createReturnFulfillment(data: any) {
    return {
      data: {
        provider: "riders",
        return_status: "manual_review_required",
        original_data: data,
      },
      labels: [],
    }
  }
}