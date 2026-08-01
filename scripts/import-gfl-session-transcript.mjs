import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const source = "https://docs.google.com/document/d/1k-5VDKmux762yNhVygVvsc46S-hcI_i6pcA-ulrDFrk/export?format=txt";
const outputDirectory = path.resolve("website", "assets");
const outputFile = path.join(outputDirectory, "gfl-session-transcript-0003.txt");

const response = await fetch(source);
if (!response.ok) throw new Error(`Transcript export failed: ${response.status} ${response.statusText}`);
const text = await response.text();
if (!text.trim()) throw new Error("Transcript export was empty.");

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputFile, text, "utf8");
console.log(`Imported ${text.length} characters to ${outputFile}`);
