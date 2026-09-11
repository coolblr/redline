# 09: answerQuestion seam

**What to build:** The `answerQuestion(documentText, question) → Answer` seam and a document-scoped Q&A box. Answers only from what the uploaded document supports.

**Blocked by:** 03 (needs the schema and a document's stored extracted text; does not need Flag[] from 04)

**Status:** done

- [x] User can ask a free-text question scoped to one document (Q&A box on the document page, available as soon as a document exists — doesn't require analysis to have run first, since it only needs the extracted text)
- [x] Answer persists to `qa_history` (03)
- [x] A known-absent-answer fixture (a question about a clause type not present in the document) produces an explicit "document doesn't address this" response, never an inferred answer — verified live; caught and fixed a real prompt bug in the process (see BUILD-REPORT.md)
- [x] Output passes the shared outcome-prediction copy check (ADR-0007)
