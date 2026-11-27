"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

const questions = [
  { q: "Which ECG feature should be checked first in the rhythm assessment?", options: ["R–R interval regularity", "T-wave amplitude", "QT interval only"], answer: 0, explain: "The ECG Interpretation notes begin by comparing successive R–R intervals." },
  { q: "At 50 mm/s, one 1 mm horizontal square represents:", options: ["0.04 s", "0.02 s", "0.10 s"], answer: 1, explain: "The ECG Interpretation document states 1 mm = 0.02 s at 50 mm/s." },
  { q: "Which lead is described as usually positive for the P wave in sinus rhythm?", options: ["Lead II", "aVR", "V1 only"], answer: 0, explain: "The ECG Interpretation document lists a positive P wave in lead II and negative P wave in aVR as sinus-rhythm criteria." },
];

function Waveform({ paused, stage = 0 }: { paused: boolean; stage?: number }) {
  return <div className={`ecg-paper ${paused ? "is-paused" : ""}`}>
    <svg viewBox="0 0 900 210" role="img" aria-label="Illustrative normal ECG waveform with P wave, QRS complex and T wave">
      <path className="ecg-trace-shadow" d="M0 125 L90 125 Q110 125 120 111 Q132 95 145 125 L210 125 L235 130 L250 125 L270 125 L284 145 L300 24 L317 166 L334 125 L390 125 Q420 125 438 96 Q466 62 492 125 L620 125 Q700 125 730 125 L900 125" />
      <path className="ecg-trace" pathLength="1000" d="M0 125 L90 125 Q110 125 120 111 Q132 95 145 125 L210 125 L235 130 L250 125 L270 125 L284 145 L300 24 L317 166 L334 125 L390 125 Q420 125 438 96 Q466 62 492 125 L620 125 Q700 125 730 125 L900 125" />
      <g className="ecg-labels"><text x="125" y="82">P</text><text x="300" y="18">QRS</text><text x="465" y="51">T</text></g>
      <g className="ecg-guides"><path d="M132 88 V104 M300 22 V36 M466 55 V75" /></g>
      <circle className="ecg-stage-marker" cx={[120,145,250,300,466][stage]} cy={[111,125,125,24,96][stage]} r="8" />
    </svg>
    <div className="ecg-paper-caption"><span>Illustrative normal sinus beat</span><span>25 mm/s · 10 mm/mV</span></div>
  </div>;
}


const axisStops = [
  { angle: 0, title: "Horizontal axis boundary", info: "The ECG Interpretation notes describe the horizontal axis from 0° to +30°." },
  { angle: 60, title: "Normal axis", info: "The ECG Interpretation notes give the normal electrical axis as α = +30° to +70°. Vasilenko describes the normal-axis pattern with the largest R wave in lead II." },
  { angle: 90, title: "Vertical axis", info: "The ECG Interpretation notes give the vertical axis as +70° to +90°. Vasilenko explains that a low diaphragm position may be associated with a more vertical axis and a higher R wave in lead III." },
  { angle: 120, title: "Right axis deviation", info: "The ECG Interpretation notes define rightward deviation as +90° to ±180°. Its listed limb-lead pattern includes RIII > RII > RI." },
  { angle: 180, title: "Rightward axis range", info: "This lies within the rightward-deviation range described in the ECG Interpretation document (+90° to ±180°)." },
  { angle: -90, title: "Left axis deviation boundary", info: "The ECG Interpretation notes describe leftward deviation from 0° to −90°." },
  { angle: -30, title: "Leftward axis example", info: "The ECG Interpretation notes classify 0° to −90° as leftward deviation; interpretation should follow the limb-lead QRS pattern described in the document." },
];

const conductionStages = [
  { title: "SA node fires", wave: "P wave begins", detail: "The source notes describe sinus rhythm by the P wave preceding the QRS complex; the uploaded ECG interpretation document does not detail the full anatomical origin here.", region: "SA node" },
  { title: "Atrial depolarization", wave: "P wave", detail: "Vasilenko describes the P wave as atrial excitation; the ECG Interpretation notes assess its shape, polarity, amplitude and duration.", region: "Atria" },
  { title: "AV conduction interval", wave: "P–Q (PR) interval", detail: "The ECG Interpretation notes give the P–Q interval as 0.12–0.20 s and state that it reflects conduction through the atria, AV junction and His system.", region: "AV junction" },
  { title: "Ventricular depolarization", wave: "QRS complex", detail: "Vasilenko describes the QRS complex as ventricular excitation and gives a usual duration of 0.06–0.10 s.", region: "Ventricles" },
  { title: "Ventricular repolarization", wave: "T wave", detail: "Both uploaded sources describe the T wave as ventricular myocardial recovery / repolarization.", region: "Ventricles" },
];

function HeartConductionVisual({ stage }: { stage: number }) {
  return <svg className={`ecg-heart-svg stage-${stage}`} viewBox="0 0 440 360" role="img" aria-label="Schematic four-chamber heart and cardiac conduction pathway">
    <defs>
      <linearGradient id="heartShell" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f78d91"/><stop offset=".52" stopColor="#b83f58"/><stop offset="1" stopColor="#6e203c"/></linearGradient>
      <linearGradient id="oxygenated" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ff7774"/><stop offset="1" stopColor="#a92748"/></linearGradient>
      <linearGradient id="deoxygenated" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#65c6ef"/><stop offset="1" stopColor="#245b9b"/></linearGradient>
      <filter id="heartShadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8"/></filter>
    </defs>
    <ellipse cx="220" cy="318" rx="118" ry="17" fill="#050e1c" opacity=".32" filter="url(#heartShadow)"/>
    <path d="M130 88 C88 54 67 82 82 137 L112 213 C127 260 170 300 220 325 C274 294 312 255 330 209 L357 130 C375 73 332 49 294 86 C260 49 229 56 220 94 C199 55 158 55 130 88Z" fill="url(#heartShell)" stroke="#f7a0a5" strokeWidth="3"/>
    <path d="M119 116 C92 94 89 132 111 184 L144 239 C160 260 183 274 211 287 L211 166 C184 132 150 118 119 116Z" fill="url(#deoxygenated)" stroke="#9edcf7" strokeWidth="2"/>
    <path d="M230 165 L230 288 C270 269 297 241 312 203 L338 133 C348 99 325 91 297 115 C272 117 247 137 230 165Z" fill="url(#oxygenated)" stroke="#ffc0b8" strokeWidth="2"/>
    <path d="M126 105 C144 87 183 91 211 125 L211 157 C181 132 150 123 126 132Z" fill="#347eae" stroke="#a8e5fb" strokeWidth="2"/>
    <path d="M230 125 C258 91 291 89 316 106 L299 137 C274 127 251 139 230 157Z" fill="#e75e65" stroke="#ffc3bd" strokeWidth="2"/>
    <path d="M166 42 C164 8 178 4 188 32 L194 94" fill="none" stroke="#398cc4" strokeWidth="15" strokeLinecap="round"/>
    <path d="M278 43 C280 8 296 7 302 37 L294 100" fill="none" stroke="#d94d5c" strokeWidth="14" strokeLinecap="round"/>
    <path d="M166 40 L166 93 M278 42 L278 92" stroke="#e9f4ff" strokeWidth="3" opacity=".7"/>
    <path d="M220 106 L220 279" stroke="#f9d6a2" strokeWidth="4" strokeDasharray="5 6" opacity=".9"/>
    <path className="ecg-conduction-path" d="M166 104 Q190 116 218 143 L220 175 Q197 203 178 239 M220 175 Q246 202 267 241" fill="none" stroke="#ffe78a" strokeWidth="4" strokeLinecap="round" strokeDasharray="7 7"/>
    <circle className="ecg-impulse" cx={stage===0?166:stage===1?190:stage===2?220:stage===3?260:220} cy={stage===0?104:stage===1?125:stage===2?160:stage===3?230:270} r="9" fill="#fff2a8" stroke="#fff" strokeWidth="3"/>
    <g className="ecg-heart-labels"><text x="90" y="178">RA</text><text x="155" y="258">RV</text><text x="278" y="178">LA</text><text x="255" y="258">LV</text></g>
    <g className="ecg-heart-small"><text x="114" y="72">SVC</text><text x="310" y="69">Aorta</text><text x="220" y="345" textAnchor="middle">Schematic anatomy · not to scale</text></g>
  </svg>;
}

function AxisVisual({ angle }: { angle: number }) {
  const radians = angle * Math.PI / 180;
  const lead = (deg: number) => ({ x: 180 + 122 * Math.cos(deg * Math.PI / 180), y: 145 - 122 * Math.sin(deg * Math.PI / 180) });
  const end = { x: 180 + 108 * Math.cos(radians), y: 145 - 108 * Math.sin(radians) };
  const leads = [{name:"I",deg:0},{name:"II",deg:60},{name:"III",deg:120},{name:"aVL",deg:-30},{name:"aVF",deg:90},{name:"aVR",deg: -150}];
  return <svg className="ecg-axis-svg" viewBox="0 0 360 290" role="img" aria-label={`Hexaxial reference system with mean QRS axis ${angle} degrees`}>
    <circle cx="180" cy="145" r="112" fill="#102b46" stroke="#49647e" strokeDasharray="3 5"/>
    {leads.map(l=>{const p=lead(l.deg);return <g key={l.name}><line x1="180" y1="145" x2={p.x} y2={p.y} stroke="#7290a9" strokeWidth="1.5"/><text x={p.x+(p.x-180)*.12} y={p.y+(p.y-145)*.12} fill="#c3d6e6" fontSize="10" textAnchor="middle">{l.name}</text></g>;})}
    <line x1="180" y1="145" x2={end.x} y2={end.y} stroke="#ffcb75" strokeWidth="5" strokeLinecap="round"/>
    <path d={`M ${end.x-9*Math.sin(radians)} ${end.y-9*Math.cos(radians)} L ${end.x} ${end.y} L ${end.x+9*Math.sin(radians)} ${end.y+9*Math.cos(radians)}`} fill="none" stroke="#ffcb75" strokeWidth="4" strokeLinecap="round"/>
    <circle cx="180" cy="145" r="5" fill="#fff"/>
    <text x="180" y="278" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">Mean QRS axis: {angle}°</text>
  </svg>;
}


function Heart3DVisual({ stage }: { stage: number }) {
  const [viewerReady, setViewerReady] = useState(false);
  const [viewerFailed, setViewerFailed] = useState(false);
  const stages = [
    { name: "SA node", note: "The impulse begins high in the right atrium." },
    { name: "Atrial pathways", note: "Depolarization spreads across the right and left atria toward the AV node (P wave)." },
    { name: "AV node", note: "The impulse slows briefly at the AV node, producing the PR delay." },
    { name: "His–Purkinje system", note: "The impulse travels down the Bundle of His, right and left bundle branches, then through Purkinje fibres." },
    { name: "Ventricular recovery", note: "Ventricular cells repolarize; the ECG shows the T wave." },
  ];
  const ModelViewer = "model-viewer" as any;
  const route = "M 50 18 Q 43 26 44 38 L 50 48 L 50 62 Q 42 73 35 82 M 50 62 Q 58 73 65 82";
  return <div className="ecg-anatomical-model">
    <link rel="preconnect" href="https://ajax.googleapis.com" />
    <link rel="preload" href="/models/anatomical-human-heart.glb" as="fetch" crossOrigin="anonymous" />
    <Script src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js" type="module" strategy="afterInteractive" onReady={() => setViewerReady(true)} onError={() => setViewerFailed(true)} />
    <div className="ecg-model-visual">
      <div className="ecg-anatomical-viewer">
        <div className="ecg-heartbeat">
          {viewerReady ? <ModelViewer src="/models/anatomical-human-heart.glb" alt="Three-dimensional anatomical human heart model" shadow-intensity="1" exposure="1.15" camera-orbit="0deg 75deg 2.6m" camera-controls={false} auto-rotate={false} interaction-prompt="none" loading="eager" reveal="auto" /> : <div className="ecg-model-loading" role="status">{viewerFailed ? "3D heart could not load. Check the model file and internet connection." : "Loading anatomical 3D heart…"}</div>}
        </div>
      </div>
      <svg className={`ecg-impulse-overlay stage-${stage}`} viewBox="0 0 100 100" aria-label="Animated schematic electrical conduction pathway" role="img">
        <path className="ecg-impulse-route" d={route}/>
        <path className="ecg-impulse-active" d={route}/>
        <g className="ecg-impulse-nodes"><circle cx="50" cy="18" r="2.2"/><circle cx="44" cy="38" r="2"/><circle cx="50" cy="48" r="2"/><circle cx="50" cy="62" r="2"/><circle cx="35" cy="82" r="1.8"/><circle cx="65" cy="82" r="1.8"/></g>
        <circle className="ecg-impulse-particle" r="2.8"><animateMotion dur="2.8s" repeatCount="indefinite" path={route}/></circle>
        <g className="ecg-impulse-labels"><text x="54" y="17">SA</text><text x="54" y="49">AV</text><text x="54" y="61">His</text><text x="18" y="86">RBB</text><text x="68" y="86">LBB</text></g>
      </svg>
      <div className="ecg-model-badge">FRONT VIEW · SCHEMATIC ELECTRICAL PATHWAY</div>
    </div>
    <div className="ecg-model-stage-card"><span>LIVE CONDUCTION STEP {stage + 1} / 5</span><strong>{stages[stage].name}</strong><p>{stages[stage].note}</p></div>
    <div className="ecg-heart-3d-legend"><span><i className="blue"/>Right heart / venous side</span><span><i className="red"/>Left heart / arterial side</span><span><i className="gold"/>Electrical impulse (schematic overlay)</span></div>
  </div>;
}

export default function EcgLab() {
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState("waves");
  const [answer, setAnswer] = useState<number | null>(null);
  const [question, setQuestion] = useState(0);
  const [conductionStep, setConductionStep] = useState(0);
  const [axisIndex, setAxisIndex] = useState(1);
  const [axisPlaying, setAxisPlaying] = useState(true);
  const axisAngle = axisStops[axisIndex].angle;
  const [simulationRunning, setSimulationRunning] = useState(true);
  useEffect(() => { if (!simulationRunning) return; const timer = window.setInterval(() => setConductionStep(step => (step + 1) % conductionStages.length), 1800); return () => window.clearInterval(timer); }, [simulationRunning]);
  useEffect(() => { if (!axisPlaying) return; const timer = window.setInterval(() => setAxisIndex(index => (index + 1) % axisStops.length), 2800); return () => window.clearInterval(timer); }, [axisPlaying]);
  const axisLabel = axisAngle >= 30 && axisAngle <= 70 ? "Normal axis (PDF: +30° to +70°)" : axisAngle >= 0 && axisAngle < 30 ? "Horizontal axis (0° to +30°)" : axisAngle > 70 && axisAngle <= 90 ? "Vertical axis (+70° to +90°)" : axisAngle < 0 ? "Left axis deviation (0° to −90°)" : "Right axis deviation (+90° to +180°)";
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
          <div className="ecg-hero-card"><div className="ecg-live-label"><i /> ECG SIGNAL · EDUCATIONAL SIMULATION</div><Waveform paused={paused} stage={conductionStep} /><div className="ecg-controls"><button onClick={() => setPaused(v => !v)}>{paused ? "▶ Resume waveform" : "Ⅱ Pause waveform"}</button><span>{paused ? "Paused" : "Simulated signal running"}</span></div></div>
        </div>
        <div className="ecg-disclaimer">Learning simulation only — not a medical device and not suitable for diagnosing a real ECG.</div>
      </div>
    </section>


    <section className="ecg-conduction-section">
      <div className="ecg-container ecg-section">
        <div className="ecg-section-heading light"><div><p className="ecg-overline">LIVE MODEL / 01</p><h2>Follow the electrical impulse.</h2></div><p>A synchronized teaching schematic links the conduction sequence to the ECG event. Blood flow and electrical conduction are separate processes.</p></div>
        <div className="ecg-live-lab">
          <div className="ecg-heart-stage"><div className="ecg-model-tag">FOUR CHAMBERS · CONDUCTION PATHWAY</div><Heart3DVisual stage={conductionStep}/></div>
          <div className="ecg-stage-panel">
            <div className="ecg-stage-count">STEP {conductionStep+1} / {conductionStages.length}</div>
            <h3>{conductionStages[conductionStep].title}</h3><p>{conductionStages[conductionStep].detail}</p>
            <div className="ecg-wave-link"><span>ECG CORRELATION</span><strong>{conductionStages[conductionStep].wave}</strong></div>
            <div className="ecg-stage-dots">{conductionStages.map((s,i)=><button key={s.title} aria-label={s.title} className={i===conductionStep?"active":""} onClick={()=>setConductionStep(i)} />)}</div>
            <div className="ecg-stage-controls"><button onClick={()=>setSimulationRunning(v=>!v)}>{simulationRunning?"Pause":"Play"} sequence</button><button onClick={()=>setConductionStep(v=>(v+1)%conductionStages.length)}>Next step →</button></div>
          </div>
        </div>
        <div className="ecg-axis-lab">
          <div><p className="ecg-overline">LIVE MODEL / 02</p><h3>Mean QRS axis: guided automatic tour</h3><p>The vector moves automatically between important reference angles and pauses briefly at each one.</p>
            <div className="ecg-axis-status">PAUSE POINT {axisIndex+1} / {axisStops.length} · {axisAngle}° · {axisLabel}</div>
            <div className="ecg-axis-stop-info"><strong>{axisStops[axisIndex].title}</strong><p>{axisStops[axisIndex].info}</p></div>
            <button type="button" className="ecg-axis-play-toggle" onClick={()=>setAxisPlaying(v=>!v)}>{axisPlaying ? "Ⅱ Pause tour" : "▶ Resume tour"}</button>
          </div>
          <div className="ecg-axis-visual-wrap"><AxisVisual angle={axisAngle}/></div>
        </div>
      </div>
    </section>

    <section className="ecg-container ecg-section" id="ecg-explorer">
      <div className="ecg-section-heading"><div><p className="ecg-overline">01 / THE BASICS</p><h2>What is an ECG?</h2></div><p>An electrocardiogram records voltage changes produced by cardiac electrical activity using electrodes placed on the skin.</p></div>
      <div className="ecg-fact-grid">
        <article><b>Check the recording</b><p>Record patient details, examination date and time, clinical diagnosis, factors affecting the tracing, paper speed and calibration.</p></article>
        <article><b>Check signal quality</b><p>Inspect the control millivolt, artifacts, electrode contact and whether at least four cardiac cycles are present in each lead.</p></article>
        <article><b>Analyse systematically</b><p>Review rhythm, rhythm source, heart rate, conduction, electrical axis, waves, intervals, complexes and the final ECG report.</p></article>
      </div>
    </section>

    <section className="ecg-dark-section"><div className="ecg-container ecg-section">
      <div className="ecg-section-heading light"><div><p className="ecg-overline">02 / INTERACTIVE EXPLORER</p><h2>Meet the ECG waves.</h2></div><p>Select a waveform feature to understand what it represents in the cardiac electrical cycle.</p></div>
      <div className="ecg-explorer">
        <div className="ecg-tabs" role="tablist" aria-label="ECG waveform features">
          {[["waves","P · QRS · T"],["intervals","Intervals"],["segments","Segments"]].map(([id,label]) => <button key={id} className={active === id ? "selected" : ""} onClick={() => setActive(id)} role="tab" aria-selected={active === id}>{label}</button>)}
        </div>
        <div className="ecg-explorer-body">
          <div className="ecg-mini-strip"><Waveform paused={paused} stage={conductionStep} /></div>
          {active === "waves" && <div className="ecg-explain-grid">
            <article><span className="ecg-wave-letter">P</span><div><h3>P wave</h3><p>Both sources describe the P wave as atrial excitation / depolarization. The ECG Interpretation notes give duration up to 0.10 s and amplitude up to 2.5 mm; in sinus rhythm it is positive in lead II and negative in aVR.</p></div></article>
            <article><span className="ecg-wave-letter">QRS</span><div><h3>QRS complex</h3><p>Ventricular excitation. The Q wave corresponds to septal excitation; R is the principal positive wave; S is the negative wave recorded during completion of ventricular excitation. The ECG Interpretation notes flag Q greater than ¼ of R and wider than 0.03 s as pathological.</p></div></article>
            <article><span className="ecg-wave-letter">T</span><div><h3>T wave</h3><p>Ventricular myocardial repolarization. Vasilenko describes a normally asymmetrical contour with a gradual ascent and a steeper descent; assess polarity, amplitude and shape.</p></div></article>
          </div>}
          {active === "intervals" && <div className="ecg-detail-list"><article><b>P wave · up to 0.10 s</b><p>Reflects atrial excitation. The ECG Interpretation notes list amplitude up to 2.5 mm; Vasilenko describes changes with atrial enlargement.</p></article><article><b>P–Q (PR) interval · 0.12–0.20 s</b><p>The ECG Interpretation notes describe the overall conduction time through the atria, AV junction and His system.</p></article><article><b>QRS complex · 0.06–0.10 s</b><p>Corresponds to ventricular excitation / intraventricular conduction, according to both uploaded sources.</p></article><article><b>Q–T interval</b><p>Extends from the beginning of Q (or R if Q is absent) to the end of T. Both sources note that its duration depends on heart rate.</p></article></div>}
          {active === "segments" && <div className="ecg-detail-list"><article><b>ST (RS–T) segment</b><p>The ECG Interpretation notes instruct checking its position relative to the isoelectric line and measuring J-point deviation when displaced.</p></article><article><b>T wave</b><p>Represents ventricular repolarization. Assess polarity, amplitude and shape; Vasilenko describes the normal wave as asymmetrical.</p></article><article><b>T–P interval</b><p>Vasilenko describes this interval, from the end of T to the beginning of the next P, as the electrical diastole of the heart.</p></article></div>}
        </div>
      </div>
    </div></section>

    <section className="ecg-container ecg-section">
      <div className="ecg-section-heading"><div><p className="ecg-overline">03 / PAPER & CALIBRATION</p><h2>Read the grid.</h2></div><p>ECG paper converts time and voltage into measurable horizontal and vertical distances.</p></div>
      <div className="ecg-measure-grid">
        <div className="ecg-grid-visual"><div className="ecg-grid-square"><span>1 mm at 25 mm/s</span><strong>0.04 s</strong></div><div className="ecg-grid-square large"><span>1 mm at 50 mm/s</span><strong>0.02 s</strong></div><small>Control millivolt: 10 mm. At 25 mm/s, 5 mm = 0.20 s; at 50 mm/s, 5 mm = 0.10 s.</small></div>
        <div className="ecg-measure-facts"><article><strong>0.04 s</strong><span>1 mm horizontal at 25 mm/s</span></article><article><strong>0.02 s</strong><span>1 mm horizontal at 50 mm/s</span></article><article><strong>10 mm</strong><span>Control millivolt amplitude to check before analysis</span></article><article><strong>4 cycles</strong><span>Minimum cardiac cycles per lead stated in the ECG Interpretation notes</span></article></div>
      </div>
      <div className="ecg-note"><b>Heart-rate calculation from the uploaded ECG Interpretation notes:</b> At 50 mm/s, HR = 60 ÷ R–R duration in seconds (1 mm = 0.02 s). At 25 mm/s, for a regular rhythm, HR = 300 ÷ number of large squares between R waves (or 1500 ÷ small squares). For an irregular rhythm, the notes advise estimating minimum and maximum rates from the longest and shortest R–R intervals.</div>
    </section>

    <section className="ecg-blue-section"><div className="ecg-container ecg-section">
      <div className="ecg-section-heading light"><div><p className="ecg-overline">04 / THE 12-LEAD ECG</p><h2>Twelve views. One heart.</h2></div><p>A standard 12-lead ECG uses 10 physical electrodes to create 12 leads — six limb leads and six chest leads.</p></div>
      <div className="ecg-lead-grid"><article><span>I · II · III</span><h3>Standard limb leads</h3><p>Three bipolar views of the electrical potential between limb electrodes.</p></article><article><span>aVR · aVL · aVF</span><h3>Augmented limb leads</h3><p>Three unipolar views looking at the heart in the frontal plane.</p></article><article><span>V1–V6</span><h3>Precordial leads</h3><p>Six chest views that examine electrical activity in the horizontal plane.</p></article></div>
      <p className="ecg-placement-note">The ECG Interpretation notes require amplitude, shape and polarity to be assessed across all 12 leads. They identify lead II as a usual lead for measuring P and P–Q intervals, and V1–V2 / V6 for assessing selected ventricular conduction measures. The uploaded pages do not provide chest-electrode placement landmarks.</p>
    </div></section>

    <section className="ecg-container ecg-section">
      <div className="ecg-section-heading"><div><p className="ecg-overline">05 / FIRST INTERPRETATION</p><h2>A systematic approach.</h2></div><p>Use the same sequence each time so that important findings are less likely to be missed.</p></div>
      <ol className="ecg-checklist">{["Check patient details, examination conditions, recording speed and calibration","Check artifacts, electrode contact and number of cardiac cycles","Determine R–R regularity","Identify the rhythm source: sinus or non-sinus","Calculate heart rate","Assess conduction intervals and internal ventricular deflection","Determine the electrical axis and cardiac rotation","Analyse P, QRS, ST–T and QT elements in all leads","Write the ECG conclusion and compare with previous ECGs and clinical data"].map((item,i)=><li key={item}><span>{String(i+1).padStart(2,"0")}</span>{item}</li>)}</ol>
    </section>

    <section className="ecg-quiz-section"><div className="ecg-container ecg-section">
      <div className="ecg-section-heading light"><div><p className="ecg-overline">06 / TEST YOURSELF</p><h2>Quick knowledge check.</h2></div><p>Try these short questions to reinforce the fundamentals.</p></div>
      <div className="ecg-quiz"><div className="ecg-quiz-top"><span>QUESTION {question+1} OF {questions.length}</span><span>{answer === null ? "Choose one answer" : answer === current.answer ? "Correct" : "Review the explanation"}</span></div><h3>{current.q}</h3><div className="ecg-options">{current.options.map((option,i)=><button key={option} onClick={()=>setAnswer(i)} className={answer === i ? (i === current.answer ? "correct" : "incorrect") : ""} disabled={answer !== null}>{String.fromCharCode(65+i)} <span>{option}</span></button>)}</div>{answer !== null && <div className="ecg-feedback"><b>{answer === current.answer ? "Well done!" : "Not quite."}</b> {current.explain}<button onClick={()=>{setQuestion((question+1)%questions.length);setAnswer(null)}}>{question === questions.length-1 ? "Start again" : "Next question"} →</button></div>}</div>
    </div></section>

    <section className="ecg-container ecg-bottom"><div><p className="ecg-overline">SOURCE MATERIAL</p><h2>ECG analysis and interpretation.</h2><p>Content on this page is based on the uploaded “ECG interpretation” notes (12 pages) and Vasilenko, Propedeutics of Internal Diseases, Chapter 6, pp. 238–245. Where a topic is not covered in those pages, it is identified rather than filled in from an outside source. Educational use only; correlate ECG findings with clinical data.</p></div><a href="#ecg-explorer">Back to the explorer ↑</a></section>
  </main>;
}
