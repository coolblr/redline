import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseDocumentFile } from "@/lib/parse-document";

function fixtureFile(name: string, type: string): File {
  const bytes = readFileSync(path.join(__dirname, "..", "fixtures", name));
  return new File([bytes], name, { type });
}

describe("parseDocumentFile — .txt", () => {
  it("extracts the exact text of a real .txt File via FileReader/file.text()", async () => {
    const content = "Line one.\nLine two has a clause about indemnification.\n";
    const file = new File([content], "contract.txt", { type: "text/plain" });

    const result = await parseDocumentFile(file);

    expect(result.text).toBe(content);
    expect(result.warning).toBeUndefined();
  });

  it("detects .txt by extension even with no/incorrect MIME type", async () => {
    const content = "Plain text with no MIME type set.";
    const file = new File([content], "notes.txt", { type: "" });

    const result = await parseDocumentFile(file);

    expect(result.text).toBe(content);
  });
});

describe("parseDocumentFile — rejected file types", () => {
  it("throws a clear, specific error for an unsupported file type", async () => {
    const file = new File(["<xml/>"], "contract.rtf", {
      type: "application/rtf",
    });

    await expect(parseDocumentFile(file)).rejects.toThrow(
      /\.txt[\s\S]*\.pdf[\s\S]*\.docx/
    );
  });

  it("throws for a file with no recognizable extension or MIME type", async () => {
    const file = new File(["data"], "mystery-file", { type: "" });

    await expect(parseDocumentFile(file)).rejects.toThrow(/mystery-file/);
  });
});

describe("parseDocumentFile — .pdf", () => {
  // sample.pdf is a real, hand-built single-page PDF (tests/fixtures, see
  // its generation script referenced in the ticket report) containing the
  // literal text "Hello from a real minimal PDF fixture." — extracted here
  // via the actual pdfjs-dist code path parseDocumentFile uses, not a mock.
  it("extracts real text from a real minimal PDF fixture", async () => {
    const file = fixtureFile("sample.pdf", "application/pdf");

    const result = await parseDocumentFile(file);

    expect(result.text).toBe("Hello from a real minimal PDF fixture.");
    expect(result.warning).toBeUndefined();
  });

  it("returns a warning instead of throwing when a PDF has no extractable text", async () => {
    // sample-empty.pdf is a real, valid single-page PDF whose content
    // stream has no text-showing operators at all — standing in for a
    // scanned/image-only page, which pdfjs genuinely cannot extract text
    // from (this is the real no-OCR behavior, not a simulated one).
    const file = fixtureFile("sample-empty.pdf", "application/pdf");

    const result = await parseDocumentFile(file);

    expect(result.text).toBe("");
    expect(result.warning).toMatch(/scanned image/i);
  });
});

describe("parseDocumentFile — .docx", () => {
  // sample.docx is a real, hand-built minimal .docx (a valid OOXML zip
  // with [Content_Types].xml, _rels/.rels, and word/document.xml — see the
  // generation script referenced in the ticket report) containing two real
  // paragraphs, extracted here via the actual mammoth code path
  // parseDocumentFile uses, not a mock.
  it("extracts real text from a real minimal DOCX fixture", async () => {
    const file = fixtureFile(
      "sample.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    const result = await parseDocumentFile(file);

    expect(result.text).toContain("Hello from a real minimal DOCX fixture.");
    expect(result.text).toContain(
      "Second paragraph, to check paragraph breaks survive extraction."
    );
    expect(result.warning).toBeUndefined();
  });
});
