import Link from "next/link";

const researchTopics = [
  { number: "01", category: "Research & discovery", title: "Medical research", description: "Explore questions in medicine, review scientific literature, and document evidence-based findings.", mark: "⌕" },
  { number: "02", category: "Clinical learning", title: "Case studies", description: "A structured space for learning from clinical cases, connecting symptoms, mechanisms, and medical concepts.", mark: "＋" },
  { number: "03", category: "Knowledge library", title: "Study notes", description: "Clear, organised notes and useful learning points collected throughout medical school.", mark: "▤" },
];

export default function FaizanPage() {
  return (
    <main className="min-h-screen" style={{ color: "var(--navy)", background: "rgba(244,248,252,.92)" }}>
      <div className="wrap" style={{ paddingTop: "34px", paddingBottom: "76px" }}>
        <Link href="/" className="inline-link" style={{ display: "inline-flex", marginBottom: "25px" }}>← Back to Home</Link>

        <section style={{
          position: "relative", overflow: "hidden", minHeight: "330px", borderRadius: "22px",
          display: "flex", alignItems: "end", padding: "clamp(25px, 5vw, 54px)",
          backgroundImage: "linear-gradient(90deg, rgba(10,29,53,.88), rgba(16,43,78,.60) 58%, rgba(16,43,78,.18)), url('/images/faizan-reseachpage.jpg')",
          backgroundSize: "cover", backgroundPosition: "center", boxShadow: "0 22px 55px rgba(16,43,78,.15)"
        }}>
          <div style={{ position: "relative", zIndex: 1, maxWidth: "650px" }}>
            <div className="eyebrow" style={{ color: "#d5e8f8" }}><span className="dot" /> RESEARCH · CURIOSITY · EVIDENCE</div>
            <h1 style={{ color: "#fff", fontSize: "clamp(38px, 6vw, 64px)", lineHeight: 1.04, letterSpacing: "-.06em", fontWeight: 800, margin: "19px 0 15px" }}>
              Research &amp; <span style={{ color: "#9bc8ec" }}>Discovery.</span>
            </h1>
            <p style={{ color: "#e0ebf5", fontSize: "14px", lineHeight: 1.85, maxWidth: "540px", margin: 0 }}>
              A space for medical research, thoughtful questions, case-based learning, and ideas grounded in science.
            </p>
          </div>
        </section>

        <section style={{ paddingTop: "54px" }}>
          <div className="section-head">
            <div><div className="eyebrow">THE RESEARCH SPACE</div>
              <h2 style={{ color: "var(--deep)", fontSize: "clamp(30px, 4vw, 42px)", letterSpacing: "-.055em", margin: "12px 0 0" }}>Explore my <span>work.</span></h2>
            </div>
            <p>Research, clinical learning, and study material — organised into clear sections.</p>
          </div>
          <div className="study-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 245px), 1fr))" }}>
            {researchTopics.map((item) => (
              <article key={item.number} className="study-card" style={{ minHeight: "245px" }}>
                <div className="card-top"><span>{item.number}</span><b>{item.mark}</b></div>
                <small className="card-tag">{item.category}</small>
                <h3>{item.title}</h3><p>{item.description}</p>
                <div className="card-foot"><span>Content will be added here</span><span aria-hidden="true">↗</span></div>
              </article>
            ))}
          </div>
        </section>

        <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "11px", lineHeight: 1.8, margin: "55px auto 0", maxWidth: "650px" }}>
          Educational content only. Research summaries and study notes are intended for learning and do not replace professional medical advice.
        </p>
      </div>
    </main>
  );
}
