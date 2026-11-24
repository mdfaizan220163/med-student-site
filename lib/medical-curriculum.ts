export const MEDICAL_TEXTBOOKS = [
  { id: "robbins", label: "Robbins & Cotran", field: "Pathology", topics: ["pathology", "morphology", "histology", "inflammation", "neoplasm"] },
  { id: "guyton", label: "Guyton and Hall", field: "Physiology", topics: ["physiology", "mechanism", "regulation", "cardiovascular", "respiratory"] },
  { id: "grays", label: "Gray's Anatomy", field: "Anatomy", topics: ["anatomy", "structure", "relations", "blood supply", "nerve supply"] },
  { id: "harrison", label: "Harrison's", field: "Internal Medicine", topics: ["clinical", "diagnosis", "differential", "management", "medicine"] },
  { id: "lippincott", label: "Lippincott Pharmacology", field: "Pharmacology", topics: ["drug", "pharmacology", "mechanism of action", "adverse effect", "pharmacokinetics"] },
  { id: "jawetz", label: "Jawetz Microbiology", field: "Microbiology", topics: ["microbiology", "bacteria", "virus", "fungus", "culture", "stain"] },
  { id: "bailey", label: "Bailey & Love Surgery", field: "Surgery", topics: ["surgery", "operative", "procedure", "wound", "trauma"] },
  { id: "bates", label: "Bates' Guide to Physical Examination", field: "Clinical Examination", topics: ["examination", "inspection", "palpation", "percussion", "auscultation", "history"] },
] as const;

export type MedicalTextbookId = typeof MEDICAL_TEXTBOOKS[number]["id"];

export function getSelectedTextbooks(raw: string): string[] {
  const requested = new Set(raw.split(",").map((value) => value.trim()));
  return MEDICAL_TEXTBOOKS.filter((book) => requested.has(book.id)).map((book) => book.label);
}

export function getMedicalDiscipline(topic: string): string {
  const value = topic.toLowerCase();
  if (/pharmacolog|drug|antibiotic|agonist|antagonist|dose|adverse effect/.test(value)) return "pharmacology";
  if (/microbiolog|bacter|virus|fung|parasite|culture|gram stain|mycobacter/.test(value)) return "microbiology";
  if (/anatom|nerve|artery|vein|muscle|organ relations|blood supply/.test(value)) return "anatomy";
  if (/surgery|operative|wound|hernia|trauma|incision|suture/.test(value)) return "surgery";
  if (/examination|physical exam|percussion|auscultation|palpation|inspection|clinical signs/.test(value)) return "clinical examination";
  if (/physiolog|mechanism|regulation|cardiac cycle|lung volumes|ventilation/.test(value)) return "physiology";
  if (/patholog|infarct|inflammation|neoplasm|necrosis|abscess|thrombo|embol|granuloma|morphology/.test(value)) return "pathology";
  return "internal medicine";
}

export function getTextbookGuidance(topic: string, selected: string[]): string {
  const discipline = getMedicalDiscipline(topic);
  const books = selected.length ? selected : MEDICAL_TEXTBOOKS.map((book) => book.label);
  return [
    "PREFERRED TEXTBOOK FRAMEWORKS (selected by the student): " + books.join("; ") + ".",
    "Primary discipline inferred from the topic: " + discipline + ".",
    "Use the most relevant selected textbook framework first; use other selected books only for complementary perspectives.",
    "Important source-integrity rule: these books are preferences, not connected full-text sources unless the user has uploaded or connected an edition. Do not claim to have searched a book, quote it, invent edition/page numbers, or fabricate a citation. Clearly label foundational textbook-level explanation separately from retrieved research.",
    "For pathology, prioritize etiology, pathogenesis, gross morphology, microscopic morphology, clinical features, complications, and diagnosis when relevant.",
    "For physiology, prioritize normal function, regulation, mechanisms, graphs, and clinical correlations.",
    "For anatomy, prioritize location, parts, relations, blood supply, innervation, lymphatic drainage, and applied anatomy.",
    "For medicine and clinical examination, prioritize history, symptoms, signs, examination sequence, differential diagnosis, investigations, and management principles.",
    "For pharmacology, prioritize class, mechanism, effects, indications, contraindications, adverse effects, interactions, and important examples.",
    "For microbiology, prioritize morphology, classification, virulence, pathogenesis, clinical disease, specimen, stains, culture media, identification, and antimicrobial susceptibility.",
    "For surgery, prioritize indications, contraindications, preparation, principles, instruments/procedure overview, complications, and postoperative care.",
  ].join("\n");
}

export function getSlideVisualQuery(topic: string, title: string, visualType = ""): string {
  const combined = (topic + " " + title + " " + visualType).toLowerCase();
  const subject = topic.trim();
  if (/microscop|histolog|h\s*&\s*e|stain|cellular|granuloma|necrosis|giant cell|elastic fiber|curschmann|charcot|sputum/.test(combined)) {
    const stain = /acid.fast|ziehl|afb|mycobacter/.test(combined) ? "Ziehl Neelsen acid fast bacilli" : /gram|bacter|microb/.test(combined) ? "Gram stained bacteria" : "H&E histopathology";
    return subject + " " + title + " " + stain + " real histopathology microscopy photomicrograph labeled educational";
  }
  if (/gross|specimen|macroscopic|organ morphology|cut surface|ulcer|mass|infarct|abscess/.test(combined)) {
    return subject + " " + title + " gross pathology specimen museum photograph cut section labeled";
  }
  if (/x.ray|radiograph|ct scan|computed tomography|mri|ultrasound|imaging/.test(combined)) {
    return subject + " " + title + " medical radiology image X-ray CT MRI ultrasound annotated educational";
  }
  if (/anatom|nerve|artery|vein|muscle|organ|cross.section|relations/.test(combined)) {
    return subject + " " + title + " anatomical illustration labeled atlas";
  }
  if (/bacter|virus|fung|parasite|culture|colony|gram stain/.test(combined)) {
    return subject + " " + title + " microbiology microscopy culture plate stain educational";
  }
  if (/pathogenesis|mechanism|pathway|cycle|sequence|flowchart/.test(combined)) {
    return subject + " " + title + " medical mechanism pathway educational diagram";
  }
  return subject + " " + title + " medical educational diagram labeled";
}
