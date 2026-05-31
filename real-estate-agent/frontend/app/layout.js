import "./globals.css";

export const metadata = {
  title: "Real Estate Agent",
  description: "Property recommendations and market insights for home buyers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
