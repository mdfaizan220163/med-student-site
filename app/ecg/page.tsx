import type { Metadata } from "next";
import EcgLab from "./EcgLab";
import "./ecg.css";

export const metadata: Metadata = {
  title: "Dynamic ECG Learning Lab | MD Faizan",
  description: "An interactive introduction to electrocardiography: explore the ECG waveform, cardiac electrical cycle, intervals, leads, and rhythm basics.",
};

export default function EcgPage() {
  return <EcgLab />;
}
