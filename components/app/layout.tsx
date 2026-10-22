
import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "M D Faizan | Medical Student, Researcher",
  description: "3rd year medical student sharing clinical pearls, research breakdowns, and study strategies. Educational content only.",
  openGraph: {
    title: "M D Faizan",
    description: "Medical student journey - clinical pearls and research simplified",
    type: "website",
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* PASTE YOUR ADSENSE ID HERE AFTER APPROVAL */}
        {/* <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXX" crossOrigin="anonymous"></script> */}
      </head>
      <body className={inter.className}>
        <header className="sticky top-0 bg-white/80 backdrop-blur border-b z-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between">
            <a href="/" className="font-bold text-lg">Dr Faizan</a>
            <nav className="flex gap-6 text-sm">
              <a href="/blog">Blog</a>
              <a href="/about">About</a>
              <a href="/research">Research</a>
              <a href="/contact">Contact</a>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
        <footer className="border-t mt-20 py-10 text-sm text-gray-500 max-w-6xl mx-auto px-6">
          <p>Content for educational purposes only and not medical advice. © {new Date().getFullYear()} M D Faizan</p>
          <div className="flex gap-4 mt-2">
            <a href="/privacy">Privacy</a>
            <a href="/contact">Contact</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
