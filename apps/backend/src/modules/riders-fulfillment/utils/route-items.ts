export type RoutedProvider = "printful" | "cj" | "oem_manual"

export type RoutedGroup = {
  provider: RoutedProvider
  items: any[]
}

export function routeItems(items: any[]): RoutedGroup[] {
  const groups: Record<RoutedProvider, any[]> = {
    printful: [],
    cj: [],
    oem_manual: [],
  }

  for (const item of items) {
    const sku =
      item?.sku ||
      item?.variant_sku ||
      item?.variant?.sku ||
      item?.line_item?.variant_sku ||
      ""

    if (sku.startsWith("APP-")) {
      groups.printful.push(item)
      continue
    }

if (sku.startsWith("DS-") || sku.startsWith("CJ")) {
  groups.cj.push(item)
  continue
}
    groups.oem_manual.push(item)
  }

  return Object.entries(groups)
    .filter(([, groupedItems]) => groupedItems.length > 0)
    .map(([provider, groupedItems]) => ({
      provider: provider as RoutedProvider,
      items: groupedItems,
    }))
}