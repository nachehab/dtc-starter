import {
  defineMiddlewares,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http";
import { rewritePublicAssetUrls } from "../lib/public-asset-url";

const rewriteAssetResponseUrls = (
  _req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) => {
  const originalJson = res.json.bind(res);

  res.json = ((body: unknown) => {
    return originalJson(rewritePublicAssetUrls(body));
  }) as typeof res.json;

  next();
};

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin*",
      middlewares: [rewriteAssetResponseUrls],
    },
    {
      matcher: "/store*",
      middlewares: [rewriteAssetResponseUrls],
    },
  ],
});
