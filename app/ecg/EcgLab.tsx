"use client";

import { useState } from "react";

const questions = [
  { q: "Which ECG wave represents atrial depolarization?", options: ["P wave", "QRS complex", "T wave"], answer: 0, explain: "The P wave represents electrical activation (depolarization) of the atria." },
  { q: "What does the QRS complex represent?", options: ["Atrial repolarization only", "Ventricular depolarization", "Ventricular repolarization"], answer: 1, explain: "The QRS complex represents ventricular depolarization. Atrial repolarization is usually hidden within it." },
  { q: "At standard paper speed, one small horizontal square equals:", options: ["0.20 seconds", "0.10 seconds", "0.04 seconds"], answer: 2, explain: "At 25 mm/s, a 1 mm small square represents 0.04 seconds." },
];

function Waveform({ paused }: { paused: boolean }) {
  return <div className={`ecg-paper ${paused ? "is-paused" : ""}`}>
    <svg viewBox="0 0 900 210" role="img" aria-label="Illustrative normal ECG waveform with P wave, QRS complex and T wave">
      <path className="ecg-trace-shadow" d="M0 125 L90 125 Q110 125 120 111 Q132 95 145 125 L210 125 L235 130 L250 125 L270 125 L284 145 L300 24 L317 166 L334 125 L390 125 Q420 125 438 96 Q466 62 492 125 L620 125 Q700 125 730 125 L900 125" />
      <path className="ecg-trace" pathLength="1000" d="M0 125 L90 125 Q110 125 120 111 Q132 95 145 125 L210 125 L235 130 L250 125 L270 125 L284 145 L300 24 L317 166 L334 125 L390 125 Q420 125 438 96 Q466 62 492 125 L620 125 Q700 125 730 125 L900 125" />
      <g className="ecg-labels"><text x="125" y="82">P</text><text x="300" y="18">QRS</text><text x="465" y="51">T</text></g>
      <g className="ecg-guides"><path d="M132 88 V104 M300 22 V36 M466 55 V75" /></g>
    </svg>
    <div className="ecg-paper-caption"><span>Illustrative normal sinus beat</span><span>25 mm/s · 10 mm/mV</span></div>
  </div>;
}

export default function EcgLab() {
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState("waves");
  const [answer, setAnswer] = useState<number | null>(null);
  const [question, setQuestion] = useState(0);
  const current = questions[question];

  return <main className="ecg-page">
    <section className="ecg-hero">
      <div className="ecg-container">
        <div className="ecg-kicker"><span /> INTERACTIVE MEDICAL LEARNING</div>
        <div className="ecg-hero-grid">
          <div><p className="ecg-overline">CARDIOLOGY · ECG BASICS</p><h1>Understand the rhythm.<br /><em>Read the signal.</em></h1>
            <p className="ecg-intro">A visual introduction to electrocardiography. Explore how the heart’s electrical activity becomes the waves and intervals we interpret on an ECG.</p>
            <a className="ecg-primary-link" href="#ecg-explorer">Explore the ECG <span>↓</span></a>
          </div>
          <div className="ecg-hero-card"><div className="ecg-live-label"><i /> ECG SIGNAL · EDUCATIONAL SIMULATION</div><Waveform paused={paused} /><div className="ecg-controls"><button onClick={() => setPaused(v => !v)}>{paused ? "▶ Resume waveform" : "Ⅱ Pause waveform"}</button><span>{paused ? "Paused" : "Simulated signal running"}</span></div></div>
        </div>
        <div className="ecg-disclaimer">Learning simulation only — not a medical device and not suitable for diagnosing a real ECG.</div>
      </div>
    </section>

    <section className="ecg-container ecg-section" id="ecg-explorer">
      <div className="ecg-section-heading"><div><p className="ecg-overline">01 / THE BASICS</p><h2>What is an ECG?</h2></div><p>An electrocardiogram records voltage changes produced by cardiac electrical activity using electrodes placed on the skin.</p></div>
      <div className="ecg-fact-grid">
        <article><b>Electrical activity</b><p>Depolarization and repolarization create the electrical signals detected at the body surface.</p></article>
        <article><b>Non-invasive test</b><p>Skin electrodes detect signals; they do not send electricity into the heart.</p></article>
        <article><b>A clinical snapshot</b><p>A standard 12-lead ECG records multiple views of cardiac activity over a short period.</p></article>
      </div>
    </section>

    <section className="ecg-dark-section"><div className="ecg-container ecg-section">
      <div className="ecg-section-heading light"><div><p className="ecg-overline">02 / INTERACTIVE EXPLORER</p><h2>Meet the ECG waves.</h2></div><p>Select a waveform feature to understand what it represents in the cardiac electrical cycle.</p></div>
      <div className="ecg-explorer">
        <div className="ecg-tabs" role="tablist" aria-label="ECG waveform features">
          {[["waves","P · QRS · T"],["intervals","Intervals"],["segments","Segments"]].map(([id,label]) => <button key={id} className={active === id ? "selected" : ""} onClick={() => setActive(id)} role="tab" aria-selected={active === id}>{label}</button>)}
        </div>
        <div className="ecg-explorer-body">
          <div className="ecg-mini-strip"><Waveform paused={paused} /></div>
          {active === "waves" && <div className="ecg-explain-grid">
            <article><span className="ecg-wave-letter">P</span><div><h3>P wave</h3><p>Atrial depolarization — electrical activation spreads through the atria.</p></div></article>
            <article><span className="ecg-wave-letter">QRS</span><div><h3>QRS complex</h3><p>Ventricular depolarization. Atrial repolarization occurs at about the same time and is usually obscured.</p></div></article>
            <article><span className="ecg-wave-letter">T</span><div><h3>T wave</h3><p>Ventricular repolarization — the ventricles recover electrically.</p></div></article>
          </div>}
          {active === "intervals" && <div className="ecg-detail-list"><article><b>PR interval · 0.12–0.20 s</b><p>From the start of the P wave to the start of the QRS complex; reflects atrial-to-ventricular conduction time.</p></article><article><b>QRS duration · usually 0.06–0.10 s</b><p>Time taken for ventricular depolarization. A QRS of 0.12 s or more is generally considered prolonged.</p></article><article><b>QT interval</b><p>From the start of QRS to the end of T; represents ventricular depolarization and repolarization. Interpret QT after correcting for heart rate (QTc).</p></article></div>}
          {active === "segments" && <div className="ecg-detail-list"><article><b>PR segment</b><p>From the end of P to the start of QRS; normally near the isoelectric baseline.</p></article><article><b>ST segment</b><p>From the end of QRS (J point) to the start of T; normally near the baseline. Elevation or depression may have clinical significance in context.</p></article><article><b>TP segment</b><p>From the end of T to the next P wave; often used as the isoelectric reference baseline.</p></article></div>}
        </div>
      </div>
    </div></section>

    <section className="ecg-container ecg-section">
      <div className="ecg-section-heading"><div><p className="ecg-overline">03 / PAPER & CALIBRATION</p><h2>Read the grid.</h2></div><p>ECG paper converts time and voltage into measurable horizontal and vertical distances.</p></div>
      <div className="ecg-measure-grid">
        <div className="ecg-grid-visual"><div className="ecg-grid-square"><span>1 small square</span><strong>0.04 s</strong></div><div className="ecg-grid-square large"><span>1 large square</span><strong>0.20 s</strong></div><small>Standard calibration: 25 mm/s · 10 mm = 1 mV</small></div>
        <div className="ecg-measure-facts"><article><strong>0.04 s</strong><span>One small horizontal square (1 mm)</span></article><article><strong>0.20 s</strong><span>One large horizontal square (5 mm)</span></article><article><strong>1 mV</strong><span>10 mm vertical deflection at standard gain</span></article><article><strong>25 mm/s</strong><span>Standard paper speed in most routine ECGs</span></article></div>
      </div>
      <div className="ecg-note"><b>Remember:</b> If paper speed or gain is changed, the usual square measurements must be adjusted accordingly.</div>
    </section>

    <section className="ecg-blue-section"><div className="ecg-container ecg-section">
      <div className="ecg-section-heading light"><div><p className="ecg-overline">04 / THE 12-LEAD ECG</p><h2>Twelve views. One heart.</h2></div><p>A standard 12-lead ECG uses 10 physical electrodes to create 12 leads — six limb leads and six chest leads.</p></div>
      <div className="ecg-lead-grid"><article><span>I · II · III</span><h3>Standard limb leads</h3><p>Three bipolar views of the electrical potential between limb electrodes.</p></article><article><span>aVR · aVL · aVF</span><h3>Augmented limb leads</h3><p>Three unipolar views looking at the heart in the frontal plane.</p></article><article><span>V1–V6</span><h3>Precordial leads</h3><p>Six chest views that examine electrical activity in the horizontal plane.</p></article></div>
      <p className="ecg-placement-note">Chest electrode landmarks: V1 — 4th intercostal space, right sternal border; V2 — 4th intercostal space, left sternal border; V4 — 5th intercostal space, midclavicular line; V3 — midway between V2 and V4; V5 — anterior axillary line, level with V4; V6 — midaxillary line, level with V4.</p>
    </div></section>

    <section className="ecg-container ecg-section">
      <div className="ecg-section-heading"><div><p className="ecg-overline">05 / FIRST INTERPRETATION</p><h2>A systematic approach.</h2></div><p>Use the same sequence each time so that important findings are less likely to be missed.</p></div>
      <ol className="ecg-checklist">{["Check patient details and ECG calibration","Calculate the heart rate","Assess rhythm and regularity","Determine the cardiac axis","Inspect P waves and PR interval","Measure QRS duration and morphology","Assess ST segments and T waves","Measure QT and consider QTc","Compare with previous ECGs and clinical context"].map((item,i)=><li key={item}><span>{String(i+1).padStart(2,"0")}</span>{item}</li>)}</ol>
    </section>

    <section className="ecg-quiz-section"><div className="ecg-container ecg-section">
      <div className="ecg-section-heading light"><div><p className="ecg-overline">06 / TEST YOURSELF</p><h2>Quick knowledge check.</h2></div><p>Try these short questions to reinforce the fundamentals.</p></div>
      <div className="ecg-quiz"><div className="ecg-quiz-top"><span>QUESTION {question+1} OF {questions.length}</span><span>{answer === null ? "Choose one answer" : answer === current.answer ? "Correct" : "Review the explanation"}</span></div><h3>{current.q}</h3><div className="ecg-options">{current.options.map((option,i)=><button key={option} onClick={()=>setAnswer(i)} className={answer === i ? (i === current.answer ? "correct" : "incorrect") : ""} disabled={answer !== null}>{String.fromCharCode(65+i)} <span>{option}</span></button>)}</div>{answer !== null && <div className="ecg-feedback"><b>{answer === current.answer ? "Well done!" : "Not quite."}</b> {current.explain}<button onClick={()=>{setQuestion((question+1)%questions.length);setAnswer(null)}}>{question === questions.length-1 ? "Start again" : "Next question"} →</button></div>}</div>
    </div></section>

    <section className="ecg-container ecg-bottom"><div><p className="ecg-overline">KEEP LEARNING</p><h2>Build your ECG foundations, one wave at a time.</h2><p>This page is an educational introduction. Real ECG interpretation requires clinical context, supervised practice, and assessment by a qualified clinician.</p></div><a href="#ecg-explorer">Back to the explorer ↑</a></section>
  </main>;
}
