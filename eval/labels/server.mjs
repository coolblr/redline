// Local server for the labelling page (npm run label). Node built-ins only.
// Listens on 127.0.0.1, port 4317 or the next free port. Serves the page,
// flags.json and the two PRD sections, and saves labels to labels.json each
// time one changes.

import { createServer } from "node:http";
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const prdPath = path.join(here, "..", "..", "PRD.md");
const labelsPath = path.join(here, "labels.json");

// Word for word from PRD.md: everything under the heading, up to the next "## ".
function prdSection(markdown, heading) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim() === `## ${heading}`);
  if (start === -1) return null;
  let end = lines.findIndex((l, i) => i > start && l.startsWith("## "));
  if (end === -1) end = lines.length;
  return lines.slice(start, end).join("\n").trim();
}

const EMPTY = { labels: {}, reflection: "" };

function readLabels() {
  if (!existsSync(labelsPath)) return EMPTY;
  try {
    return JSON.parse(readFileSync(labelsPath, "utf-8"));
  } catch {
    return EMPTY;
  }
}

function send(res, status, type, body) {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(body);
}

const server = createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");

  if (req.method === "GET" && url.pathname === "/") {
    return send(res, 200, "text/html; charset=utf-8", readFileSync(path.join(here, "index.html")));
  }
  if (req.method === "GET" && url.pathname === "/flags.json") {
    return send(res, 200, "application/json", readFileSync(path.join(here, "flags.json")));
  }
  if (req.method === "GET" && url.pathname === "/prd.json") {
    const md = readFileSync(prdPath, "utf-8");
    return send(res, 200, "application/json", JSON.stringify({
      sections: ["What good looks like", "My red lines"].map((h) => ({ heading: h, text: prdSection(md, h) })),
    }));
  }
  if (req.method === "GET" && url.pathname === "/labels.json") {
    return send(res, 200, "application/json", JSON.stringify(readLabels()));
  }
  if (req.method === "POST" && url.pathname === "/labels.json") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; if (body.length > 1e6) req.destroy(); });
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        if (typeof data !== "object" || data === null || typeof data.labels !== "object") throw new Error("bad shape");
        const tmp = labelsPath + ".tmp";
        writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n");
        renameSync(tmp, labelsPath);
        send(res, 200, "application/json", '{"ok":true}');
      } catch {
        send(res, 400, "application/json", '{"ok":false}');
      }
    });
    return;
  }
  send(res, 404, "text/plain", "Not found");
});

function listen(port) {
  server.once("error", (err) => {
    if (err.code === "EADDRINUSE" && port < 4417) listen(port + 1);
    else throw err;
  });
  server.listen(port, "127.0.0.1", () => {
    console.log(`Labelling page: http://127.0.0.1:${port}`);
  });
}
listen(4317);
