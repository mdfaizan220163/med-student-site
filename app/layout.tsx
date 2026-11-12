import "./globals.css";
import { Inter } from "next/font/google";
import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import SignOutButton from "@/app/components/sign-out-button";
const inter = Inter({ subsets: ["latin"] });
export const metadata = { title: "MD Faizan | Medical Learning & Resources", description: "Medical notes, study resources, research, and the journey of an MBBS student at IKBFU, Kaliningrad." };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
  let user = null;
  if (supabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }
  return <html lang="en"><body className={inter.className}>
    <header className="site-header"><div className="header-inner">
      <Link href="/" className="brand"><span className="brand-symbol">✳</span><span>MD FAIZAN</span><span className="brand-ai">FAIZAN AI</span></Link>
      <nav className="site-nav" aria-label="Main navigation"><Link href="/anatomy">Study hub</Link><Link href="/ai-studio">Faizan AI</Link><Link href="/presentation-studio">Presentation maker</Link><Link href="/study-notebook">Study Notebook</Link><Link href="/blog">Blog</Link><Link href="/faizan">Research</Link><Link href="/russia">Russia guide</Link><Link href="/about">About</Link><Link href="/contact" className="nav-cta">Contact ↗</Link>{user ? <><Link href="/account" className="nav-cta">My account</Link><SignOutButton /></> : <Link href="/login" className="nav-cta">Log in / Sign up</Link>}</nav>
    </div></header>{children}
    <footer className="site-footer"><div className="footer-inner"><span>© 2026 MD Faizan · Built for curious medical minds.</span><div className="footer-links"><Link href="/privacy">Privacy</Link><Link href="/contact">Contact</Link><a href="https://instagram.com/flar.orc.067" target="_blank" rel="noreferrer">Instagram ↗</a><a href="https://youtube.com/@medicosfaizan" target="_blank" rel="noreferrer">YouTube ↗</a><a href="https://linkedin.com/in/md-faizan-b285442a8" target="_blank" rel="noreferrer">LinkedIn ↗</a></div></div></footer>
  </body></html>;
}