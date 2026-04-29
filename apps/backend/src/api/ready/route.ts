import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (_req: MedusaRequest, res: MedusaResponse) => {
  res.status(200).json({
    status: "ready",
    service: "medusa-backend",
    timestamp: new Date().toISOString(),
  })
}
