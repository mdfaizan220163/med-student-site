import Link from "next/link";
const sections = [
  { n: "01", title: "Anatomy", tag: "Study resources", text: "Structured notes, visual learning, and revision resources for understanding the human body.", href: "/anatomy", icon: "✳" },
  { n: "02", title: "Research", tag: "Explore ideas", text: "Medical research, projects, scientific curiosity, and evidence-based learning.", href: "/faizan", icon: "⌘" },
  { n: "03", title: "Russia guide", tag: "Student life", text: "Practical guidance and experiences from studying medicine in Kaliningrad.", href: "/russia", icon: "↗" },
  { n: "04", title: "Vlogs & stories", tag: "Behind the journey", text: "Follow the everyday experiences, lessons, and milestones of medical school.", href: "/vlogs", icon: "▶" },
];
function SocialLinks() {
  return <div className="hero-socials" aria-label="Social media links">
    <span>Follow my journey</span>
    <a href="https://instagram.com/flar.orc.067" target="_blank" rel="noreferrer" aria-label="Instagram" title="Instagram">
      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="17.5" cy="6.8" r="1.2" fill="currentColor"/></svg>
    </a>
    <a href="https://linkedin.com/in/faizan-md-b285442a8" target="_blank" rel="noreferrer" aria-label="LinkedIn" title="LinkedIn">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5.2 3.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM3.5 9h3.4v11.5H3.5V9Zm5.5 0h3.3v1.6h.1A3.6 3.6 0 0 1 15.7 8c3.5 0 4.2 2.3 4.2 5.2v7.3h-3.5V14c0-1.6 0-3.6-2.2-3.6s-2.5 1.7-2.5 3.5v6.6H9V9Z"/></svg>
    </a>
    <a href="https://youtube.com/@medicosfaizan" target="_blank" rel="noreferrer" aria-label="YouTube" title="YouTube">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M23 7.1a3 3 0 0 0-2.1-2.1C19 4.5 12 4.5 12 4.5s-7 0-8.9.5A3 3 0 0 0 1 7.1 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.9 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.9 31 31 0 0 0-.5-4.9ZM9.8 15.5v-7l6 3.5-6 3.5Z"/></svg>
    </a>
  </div>;
}
export default function Home() {
 return <main>
  <section className="hero wrap"><div className="hero-copy"><div className="eyebrow"><span className="dot" /> MEDICINE · LEARNING · CURIOSITY</div><h1>Learning medicine.<br /><span>Sharing the journey.</span></h1><SocialLinks /><p className="hero-lead">A space for medical notes, useful resources, research, and the real experience of becoming a doctor — one day at a time.</p><div className="hero-actions"><Link href="/anatomy" className="btn btn-primary">Explore study hub <span>↗</span></Link><Link href="/about" className="btn btn-outline">Meet Faizan</Link></div><div className="hero-caption"><span /> MBBS student · IKBFU, Kaliningrad</div>
   <div className="ecg-home-card" style={{ marginTop: "22px", padding: "20px 22px", border: "1px solid var(--line, #dce5e8)", borderRadius: "18px", background: "rgba(255,255,255,0.82)", maxWidth: "520px" }}>
    <div className="eyebrow">CARDIOLOGY · INTERACTIVE LEARNING</div>
    <h2 style={{ margin: "8px 0", fontSize: "clamp(1.35rem, 3vw, 1.8rem)" }}>ECG Learning</h2>
    <p style={{ margin: "0 0 14px", lineHeight: 1.65 }}>Learn electrocardiography step by step — ECG waves, intervals, leads, paper measurements, and a systematic approach to interpretation.</p>
    <Link href="/ecg" className="btn btn-primary">Explore ECG <span>↗</span></Link>
   </div></div>
   <div className="hero-visual" aria-label="Medical learning artwork"><div className="orbit orbit-a" /><div className="orbit orbit-b" /><div className="visual-plus">+</div><div className="visual-star">✦</div><div className="visual-core"><div className="core-ring">✳</div><small>MEDICAL<br />KNOWLEDGE</small></div><div className="float-card float-top"><small>THE STUDY MINDSET</small><strong>Curiosity<br />meets science.</strong><span>Keep asking better questions.</span></div><div className="float-card float-bottom"><b>⌁</b><div><strong>Learn with purpose</strong><span>Understand · Apply · Grow</span></div></div></div></section>
  <section className="statement"><div className="wrap statement-inner"><strong>Medicine is more than memorizing facts.</strong><span>It is about understanding the human body, thinking critically, and never stopping learning.</span></div></section>
  <section className="wrap study" id="study-hub"><div className="section-head"><div><div className="eyebrow">YOUR LEARNING SPACE</div><h2>Explore the <span>study hub.</span></h2></div><p>Notes, experiences, and resources designed to make the medical journey a little clearer.</p></div><div className="study-grid">{sections.map((item) => <Link href={item.href} className="study-card" key={item.n}><div className="card-top"><span>{item.n}</span><b>{item.icon}</b></div><small className="card-tag">{item.tag}</small><h3>{item.title}</h3><p>{item.text}</p><div className="card-foot">Explore section <span>↗</span></div></Link>)}</div></section>
  <section className="ai-band"><div className="wrap ai-inner"><div className="ai-copy"><div className="eyebrow light"><span className="dot" /> STUDY WITH AI</div><h2>Meet <span>Faizan AI.</span></h2><p>Your medical study companion for clear explanations, revision, visual learning, and presentation planning.</p><div className="hero-actions"><Link href="/ai-studio" className="btn btn-white">Open Faizan AI <span>↗</span></Link><Link href="/presentation-studio" className="btn btn-outline">Make a presentation <span>↗</span></Link><Link href="/study-notebook" className="btn btn-outline">Study Notebook <span>↗</span></Link></div></div><div className="ai-window"><div className="window-head"><i /> FAIZAN AI <span>•••</span></div><h3>What would you like to study today?</h3><div className="fake-prompt">Explain the cardiac cycle step by step…</div><div className="tool-chips"><span>✧ Explain a topic</span><span>▤ Create notes</span><span>▧ Plan slides</span></div><small>For education · Not a substitute for clinical judgment</small></div></div></section>
  <section className="wrap about"><div className="monogram">MF<span>.</span></div><div><div className="eyebrow">A LITTLE ABOUT ME</div><h2>Hi, I’m Faizan.</h2><p>I’m a medical student documenting what I learn, the questions I explore, and the experiences that shape my path in medicine. This website is my growing notebook — and a place to connect with fellow learners.</p><Link href="/about" className="inline-link">More about my journey ↗</Link></div></section>
  <section className="contact-band"><div className="wrap contact-inner"><div><div className="eyebrow">LET’S CONNECT</div><h2>Curious minds learn better together.</h2></div><Link href="/contact" className="btn btn-primary">Get in touch <span>↗</span></Link></div></section>
 </main>;
}
