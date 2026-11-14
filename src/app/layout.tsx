import type { Metadata, Viewport } from "next";
import "./globals.css";
import MarketingShell from "@/app/components/MarketingShell";


export const metadata: Metadata = {
  metadataBase: new URL("https://www.vanatvam.com"),
  title: {
    default: "Vanatvam | Sustainable Managed Farmland & Nature Communities",
    template: "%s |VanaTvam"
  },
  description: "Vanatvam creates sustainable managed farmland, native forest ecosystems, and nature communities across Karnataka & near Bangalore. Discover Brindavana, Madhuvana, Anantavana, and Ishavana.",
  keywords: [
    "Managed Farmland Bangalore", "Managed Farmland Karnataka", "Sustainable Farmland Karnataka",
    "Farm Plots Near Bangalore", "Agricultural Land Investment Karnataka", "Eco Friendly Farm Communities",
    "Nakshatra Vana Forest", "Navagraha Vana", "Natural Sustainable Farm Communities",
    "Farmland Investment Karnataka", "Biodiversity Restoration Karnataka", "Native Forest Restoration Karnataka",
    "Nature Communities Bangalore", "Weekend Farm Near Bangalore", "Farmhouse Plots Karnataka",
    "Brindavana Pavagada", "Madhuvana Maddur", "Anantavana Kabini", "Ishavana Kaveri Riverfront",
  ],
  authors: [{ name: "Vanatvam Private Limited" }],
  openGraph: {
    title: "Vanatvam | Sustainable Managed Farmland",
    description: "Experience living ecosystems withVanaTvam's sustainable managed farmlands in Karnataka.",
    url: "https://www.vanatvam.com",
    siteName: "Vanatvam",
    images: [
      {
        url: "/assets/project-images/Brindavana/Sunny Tropical Banana Orchard.webp",
        width: 1200,
        height: 630,
        alt: "Vanatvam Nature Communities",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  twitter: {
    title: "Vanatvam | Sustainable Managed Farmland",
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: "Vanatvam Private Limited",
  url: "https://www.vanatvam.com/",
  logo: "https://www.vanatvam.com/assets/images/logos/vanatvam.webp",
  description: "Vanatvam Private Limited is a Bengaluru-based company developing Natural Sustainable Farm Communities across Karnataka.",
  telephone: "+91-9999999999",
  email: "hello@vanatvam.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "#5, Anjanadri Plaza, 2nd Floor, Girinagar 1st Phase",
    addressLocality: "Bengaluru",
    addressRegion: "Karnataka",
    postalCode: "560085",
    addressCountry: "IN",
  },
  identifier: "CIN: U01100KA2022PTC159587",
  areaServed: {
    "@type": "AdministrativeArea",
    name: "Karnataka",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        {/* Resource Hints for Ultra-Fast Handshakes */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.sanity.io" />
        <link rel="dns-prefetch" href="https://india.kenyt.ai" />

        {/* Google Fonts loaded asynchronously in parallel */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Jost:wght@300;400;500;600&family=Manrope:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;1,500;1,600;1,700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
        />

        {/* Font Awesome Icons */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>
        <MarketingShell>{children}</MarketingShell>
      </body>
    </html>
  );
}
