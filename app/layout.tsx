import "./globals.css";
import { Inter } from "next/font/google";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "M D Faizan | 3rd Year Medical Student - Clinical Pearls & Study Tips",
  description: "Sharing my journey through medical school in Russia — from research papers and clinical insights to daily study vlogs and tips for med students.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="font-bold text-xl text-gray-900 hover:text-blue-600">
              Dr Faizan
            </Link>
            <nav className="flex gap-4 text-sm font-medium text-gray-600">
              <Link href="/blog" className="hover:text-black">Blog</Link>
              <Link href="/about" className="hover:text-black">About</Link>
              <Link href="/faizan" className="hover:text-black">Research</Link>
              <Link href="/contact" className="hover:text-black">Contact</Link>
            </nav>
          </div>
        </header>

        {children}

        <footer className="border-t mt-20 py-10 text-sm text-gray-500 max-w-4xl mx-auto px-6">
          <p>Content for educational purposes only and not medical advice. © 2026 M D Faizan</p>
          <div className="flex gap-4 mt-2">
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/contact" className="hover:underline">Contact</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}