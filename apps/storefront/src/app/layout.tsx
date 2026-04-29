import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Rajdhani, Space_Grotesk } from "next/font/google"
import "styles/globals.css"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-space-grotesk",
})

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-rajdhani",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: "Riders Paradise | Premium Ebike Gear",
    template: "%s | Riders Paradise",
  },
  description:
    "Premium ebike gear, helmets, apparel, parts, and accessories for riders who live full throttle.",
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-mode="dark"
      className={`${spaceGrotesk.variable} ${rajdhani.variable}`}
    >
      <body>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
