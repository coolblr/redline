/**
 * Client-side document text extraction.
 *
 * Everything here runs in the browser. No original file bytes are ever
 * sent anywhere — this module reads a `File` the user picked and returns
 * plain extracted text, which is the only thing the rest of the app is
 * allowed to persist (CLAUDE.md: "the uploaded file is parsed in the
 * browser; only extracted text is stored, never the original file").
 *
 * OCR is out of scope on purpose: a scanned/image-only PDF produces little
 * or no extractable text, and that's reported back as a warning rather
 * than worked around.
 */

export type ParsedDocument = {
  text: string;
  warning?: string;
};

type FileKind = "txt" | "pdf" | "docx";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function parseDocumentFile(file: File): Promise<ParsedDocument> {
  const kind = detectKind(file);

  switch (kind) {
    case "txt":
      return parseTxt(file);
    case "pdf":
      return parsePdf(file);
    case "docx":
      return parseDocx(file);
    default:
      throw new Error(
        `Redline reads .txt, .pdf, and .docx files. "${file.name || "That file"}" isn't one of those. Try saving or exporting it as one of those formats first.`
      );
  }
}

function detectKind(file: File): FileKind | null {
  const name = file.name.toLowerCase();

  if (name.endsWith(".txt")) return "txt";
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".docx")) return "docx";

  // Extension is the primary signal; MIME type is a fallback for files
  // picked without a recognizable extension (e.g. some drag-and-drop
  // sources report only a MIME type).
  if (file.type === "text/plain") return "txt";
  if (file.type === "application/pdf") return "pdf";
  if (file.type === DOCX_MIME) return "docx";

  return null;
}

async function parseTxt(file: File): Promise<ParsedDocument> {
  const text = await file.text();
  return { text };
}

async function parsePdf(file: File): Promise<ParsedDocument> {
  // The "legacy" build is pdfjs-dist's own recommendation for any
  // environment that isn't a fully current browser — which, usefully,
  // includes Node.js. Using it everywhere means this exact function (not
  // a stand-in) can be exercised for real by both the browser and by
  // tests running under Node, with no separate code path for either.
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // Point pdfjs at its worker script only in a real browser. In Node
  // (tests), leaving this unset makes pdfjs fall back to running the
  // parser on the main thread instead of a Worker — slower, but correct,
  // and there's no bundler here to resolve the worker asset URL against.
  if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
  }

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjsLib.getDocument({ data }).promise;

  const pageTexts: string[] = [];
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();

    let pageText = "";
    for (const item of content.items) {
      if (!("str" in item)) continue;
      pageText += item.str;
      pageText += item.hasEOL ? "\n" : " ";
    }
    pageTexts.push(pageText.trim());
  }

  const text = pageTexts.join("\n\n").trim();

  if (text.length === 0) {
    return {
      text: "",
      warning:
        "Couldn't find any text in this PDF. It may be a scanned image, which this tool can't read.",
    };
  }

  return { text };
}

async function parseDocx(file: File): Promise<ParsedDocument> {
  const mammothModule = await import("mammoth");
  const mammoth = mammothModule.default;

  const arrayBuffer = await file.arrayBuffer();

  // mammoth ships two builds selected by the bundler: a browser build that
  // reads its input from an `arrayBuffer` key, and a Node build (what runs
  // under this same function in tests, since Vitest resolves packages the
  // Node way) that reads from a `buffer` key. Both ultimately hand the raw
  // bytes to the same zip reader, which accepts a plain ArrayBuffer either
  // way — so passing both keys with the same ArrayBuffer satisfies whichever
  // build is actually loaded, without branching on environment or mocking
  // either library in tests.
  const input = { arrayBuffer, buffer: arrayBuffer } as unknown as Parameters<
    typeof mammoth.extractRawText
  >[0];

  const result = await mammoth.extractRawText(input);
  const text = result.value.trim();

  if (text.length === 0) {
    return {
      text: "",
      warning: "Couldn't find any text in this document.",
    };
  }

  return { text };
}
