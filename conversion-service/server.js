/* eslint-disable @typescript-eslint/no-require-imports -- This standalone CommonJS service runs directly in Node.js inside Docker. */
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { execFile } = require("child_process");
const { promisify } = require("util");

const app = express();
const execFileAsync = promisify(execFile);
const secret = process.env.CONVERTER_API_SECRET;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null,
    file.originalname.toLowerCase().endsWith(".pptx") &&
    file.mimetype === "application/vnd.openxmlformats-officedocument.presentationml.presentation")
});

app.use((req, res, next) => {
  if (!secret || req.get("authorization") !== `Bearer ${secret}`) return res.status(401).json({ error: "Unauthorized" });
  next();
});

app.post("/convert", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "A valid PPTX file is required." });
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "faizan-pptx-"));
  try {
    const input = path.join(dir, "presentation.pptx");
    const output = path.join(dir, "out");
    await fs.promises.mkdir(output);
    await fs.promises.writeFile(input, req.file.buffer);
    await execFileAsync("libreoffice", ["-env:UserInstallation=file://" + path.join(dir, "profile"),
      "--headless", "--convert-to", "pdf", "--outdir", output, input],
      { timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
    const pdf = await fs.promises.readFile(path.join(output, "presentation.pdf"));
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="presentation-${crypto.randomUUID()}.pdf"`, "Cache-Control": "no-store" });
    res.send(pdf);
  } catch (error) {
    console.error("LibreOffice error:", error);
    res.status(500).json({ error: "LibreOffice could not convert this presentation." });
  } finally {
    await fs.promises.rm(dir, { recursive: true, force: true });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));
app.listen(process.env.PORT || 8080, () => console.log("PPTX converter ready"));
