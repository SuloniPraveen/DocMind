"use client";

import React, { useState } from "react";
import styles from "./page.module.css";

type AnyResult = any;

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnyResult | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setStatus(null);
    setResult(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setStatus("Uploading and analysing PDF for summarization");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file); // keep name consistent with /api/extract

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.status === "error") {
        setStatus(data.error || "Something went wrong while processing.");
        setLoading(false);
        return;
      }

      const payload =
        data.normalized || data.data || data.extraction || data.result || data;

      setResult(payload);
      setStatus("Extraction complete ✅");
    } catch (err: any) {
      setStatus(err?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  // ---- derive values for UI from result ----

  const docType =
    result?.documentType || result?.type || result?.articleType || "Unknown";
  const year = result?.date || result?.year || "Unknown";
  const authors: string[] =
    result?.authors || result?.author_list || result?.author || [];

  const sections: any[] = Array.isArray(result?.sections) ? result.sections : [];

  // Helper: get summary text from sections first, then from fallback fields
  function getSummaryText(
    sectionIdKeyword: string,
    fallbackKeys: string[]
  ): string | undefined {
    if (sections.length) {
      const sec =
        sections.find(
          (s) =>
            s.id === sectionIdKeyword ||
            String(s.title || "")
              .toLowerCase()
              .includes(sectionIdKeyword)
        ) || sections.find((s) =>
          String(s.title || "").toLowerCase().includes(sectionIdKeyword)
        );

      if (sec) {
        if (Array.isArray(sec.bullets) && sec.bullets.length) {
          return sec.bullets.join(" ");
        }
        if (typeof sec.text === "string") return sec.text;
      }
    }

    for (const key of fallbackKeys) {
      const val = result?.[key];
      if (typeof val === "string" && val.trim()) return val;
    }

    return undefined;
  }

  const contentSummary = getSummaryText("content", [
    "contentSummary",
    "abstract",
    "summary",
  ]);
  const methodsSummary = getSummaryText("methods", [
    "methodsSummary",
    "methods",
  ]);
  const findingsSummary = getSummaryText("findings", [
    "findingsSummary",
    "results",
    "findings",
  ]);
  const conclusionsSummary = getSummaryText("conclusion", [
    "conclusionsSummary",
    "conclusion",
    "conclusions",
  ]);

  return (
    <main className={styles.container}>
      <div className={styles.inner}>
        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.title}>
            DocMind – Your Helper to Ease Research Findings!
          </h1>
          <p className={styles.subtitle}>
            Upload a scientific PDF and get
            concise summaries via Ollama. Fully private on your machine.
          </p>
        </header>

        {/* Upload + controls */}
        <section className={styles.card}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div
              className={styles.dropZone}
              onClick={() => document.getElementById("pdf-input")?.click()}
            >
              <div className={styles.dropIcon}>📄</div>

              <div className={styles.dropTextGroup}>
                {file ? (
                  <>
                    <p className={styles.dropFileName}>{file.name}</p>
                    <p className={styles.dropFileMeta}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </>
                ) : (
                  <>
                    <p className={styles.dropTitle}>
                      Drop a PDF here or choose a file
                    </p>
                    <p className={styles.dropSubtitle}>
                      Scientific papers work best (research articles, reviews,
                      etc.).
                    </p>
                  </>
                )}
              </div>

              <label className={styles.chooseButton}>
                <input
                  id="pdf-input"
                  type="file"
                  accept="application/pdf"
                  className={styles.hiddenInput}
                  onChange={handleFileChange}
                />
                Choose PDF
              </label>
            </div>

            <div className={styles.formFooter}>
              <div className={styles.modelInfo}>
                Ollama model: <span className={styles.modelName}>mistral</span>{" "}
                <span className={styles.modelNote}>
                  (configurable via <code>OLLAMA_MODEL</code>)
                </span>
              </div>

              <button
                type="submit"
                disabled={!file || loading}
                className={`${styles.primaryButton} ${
                  (!file || loading) && styles.primaryButtonDisabled
                }`}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner} />
                    Analysing…
                  </>
                ) : (
                  <>
                    <span>Run Extraction</span>
                    <span>⚙️</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {status && (
            <div className={styles.status}>
              <span
                className={`${styles.statusDot} ${
                  status.includes("complete")
                    ? styles.statusDotSuccess
                    : styles.statusDotWarn
                }`}
              />
              <span>{status}</span>
            </div>
          )}

          <div className={styles.stepsGrid}>
            <div className={styles.stepCard}>
              <p className={styles.stepTitle}>1. Parse &amp; Chunk</p>
              <p className={styles.stepBody}>
                We read the PDF, clean the text, and chunk pages into
                ~9k-character segments.
              </p>
            </div>
            <div className={styles.stepCard}>
              <p className={styles.stepTitle}>2. Local LLM</p>
              <p className={styles.stepBody}>
                Each chunk is sent to Ollama (mistral / llama3.1) fully offline.
              </p>
            </div>
            <div className={styles.stepCard}>
              <p className={styles.stepTitle}>3. Merge &amp; Summarise</p>
              <p className={styles.stepBody}>
                We validate and merge outputs into a single 7-field JSON and
                show it here.
              </p>
            </div>
          </div>
        </section>

        {/* Results */}
        {result && (
          <section className={styles.results}>
            <div className={styles.metaCard}>
              <div>
                <h2 className={styles.metaTitle}>
                  {docType} <span className={styles.metaYear}>({year})</span>
                </h2>
                <p className={styles.metaAuthors}>
                  <span className={styles.metaLabel}>Authors:</span>{" "}
                  {Array.isArray(authors) && authors.length
                    ? authors.join(", ")
                    : "Not detected"}
                </p>
              </div>
              <p className={styles.metaNote}>
                Structured 7-field JSON generated fully offline on your machine.
                Copy these into your notes or literature review.
              </p>
            </div>

            <div className={styles.summaryGrid}>
              <SummaryCard title="Content Summary" text={contentSummary} />
              <SummaryCard title="Methods Summary" text={methodsSummary} />
              <SummaryCard title="Findings Summary" text={findingsSummary} />
              <SummaryCard
                title="Conclusions Summary"
                text={conclusionsSummary}
              />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function SummaryCard({ title, text }: { title: string; text?: string }) {
  const content =
    text && text !== "Unknown"
      ? text
      : "No details extracted for this section.";

  return (
    <div className={styles.summaryCard}>
      <h3 className={styles.summaryTitle}>{title}</h3>
      <p className={styles.summaryBody}>{content}</p>
    </div>
  );
}
