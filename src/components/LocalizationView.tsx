"use client";

import React, { useState } from "react";

export interface TranslationRow {
  key: string;
  timeRange: string;
  maxChars: number;
  pl: string;
  en: string;
  de: string;
  cs: string;
  status: "OK" | "WARNING_LENGTH" | "REVIEW";
}

interface LocalizationViewProps {
  showToast: (msg: string) => void;
}

export const LocalizationView: React.FC<LocalizationViewProps> = ({ showToast }) => {
  const [rows, setRows] = useState<TranslationRow[]>([
    {
      key: "hero_01",
      timeRange: "0.0–1.4 s",
      maxChars: 32,
      pl: "Nowa kolekcja na Twój sposób",
      en: "New collection, your way",
      de: "Neue Kollektion, dein Stil",
      cs: "Nová kolekce po tvém",
      status: "OK",
    },
    {
      key: "detail_02",
      timeRange: "1.4–4.8 s",
      maxChars: 28,
      pl: "Jedwab, który otula ciało",
      en: "Silk that gently embraces you",
      de: "Seide, die dich sanft umhüllt",
      cs: "Hedvábí, které hladí tělo",
      status: "OK",
    },
    {
      key: "cta_03",
      timeRange: "8.5–10.0 s",
      maxChars: 20,
      pl: "Odkryj teraz w atelier",
      en: "Discover now in atelier",
      de: "Jetzt online im Atelier entdecken",
      cs: "Objevte nyní v ateliéru",
      status: "WARNING_LENGTH", // DE exceeds 20 chars
    },
  ]);

  const [approvals, setApprovals] = useState([
    { code: "pl-PL", label: "🇵🇱 Polski (PL) · 3 formaty", status: "Zaakceptowany", by: "anna.k@atelier · 08:15" },
    { code: "en-US", label: "🇬🇧 English (EN) · 3 formaty", status: "Zaakceptowany", by: "marta.w@atelier · 08:22" },
    { code: "de-DE", label: "🇩🇪 Deutsch (DE) · 3 formaty", status: "Do akceptacji", by: "Sprawdź długość CTA (33/20 zn.)" },
    { code: "cs-CZ", label: "🇨🇿 Čeština (CZ) · 3 formaty", status: "Roboczy", by: "Szkic AI z Excel Online" },
  ]);

  const [editingKey, setEditingKey] = useState<string | null>(null);

  // QA validator
  const checkStatus = (text: string, max: number): "OK" | "WARNING_LENGTH" => {
    return text.length > max ? "WARNING_LENGTH" : "OK";
  };

  const handleTextChange = (key: string, field: "pl" | "en" | "de" | "cs", val: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.key === key) {
          const updated = { ...r, [field]: val };
          const isWarn =
            updated.pl.length > r.maxChars ||
            updated.en.length > r.maxChars ||
            updated.de.length > r.maxChars ||
            updated.cs.length > r.maxChars;
          return { ...updated, status: isWarn ? "WARNING_LENGTH" : "OK" };
        }
        return r;
      })
    );
  };

  const handlePushToSharePoint = () => {
    showToast("Wypchnięto nowe klucze i szkice AI do arkusza TranslationsTable.xlsx w SharePoint.");
  };

  const handlePullFromSharePoint = () => {
    showToast("Pobrano najnowsze zatwierdzone komórki z Microsoft Excel Online.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest font-extrabold text-[var(--accent)]">
            05 / LOKALIZACJA &amp; MICROSOFT EXCEL ONLINE
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-[var(--ink-primary)]">
            Żywa synchronizacja z arkuszem tłumaczy.
          </h1>
          <p className="text-sm text-[var(--ink-secondary)]">
            Połączenie dwukierunkowe przez Microsoft Graph API: edytuj teksty, kontroluj limity znaków na żywo i zatwierdzaj rynki.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePushToSharePoint}
            className="px-4 py-2 rounded-xl text-xs font-bold border bg-[var(--bg-card)] border-[var(--border-strong)] hover:border-[var(--accent)] text-[var(--ink-primary)]"
          >
            ↑ Wypchnij szkic AI do Excela
          </button>
          <button
            onClick={handlePullFromSharePoint}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[var(--accent)] shadow-[var(--shadow-pop)] hover:opacity-95"
          >
            ↻ Synchronizuj z Excel Online
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-6 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                  Tabela tłumaczeń (TranslationsTable.xlsx)
                </h2>
                <small className="text-xs text-[var(--ink-muted)]">
                  Automatyczna walidacja znaków względem czasu trwania sceny w wideo
                </small>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--status-ok-bg)] text-[var(--status-ok-ink)]">
                ✓ Połączono z SharePoint
              </span>
            </div>

            <div className="overflow-x-auto border border-[var(--border-subtle)] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] text-[var(--ink-secondary)]">
                  <tr>
                    <th className="p-3 font-bold uppercase text-[10px]">Scena &amp; Limit</th>
                    <th className="p-3 font-bold uppercase text-[10px]">🇵🇱 Polski</th>
                    <th className="p-3 font-bold uppercase text-[10px]">🇬🇧 English</th>
                    <th className="p-3 font-bold uppercase text-[10px]">🇩🇪 Deutsch</th>
                    <th className="p-3 font-bold uppercase text-[10px]">🇨🇿 Čeština</th>
                    <th className="p-3 font-bold uppercase text-[10px]">Status QA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--ink-primary)]">
                  {rows.map((row) => (
                    <tr key={row.key} className="hover:bg-[var(--bg-subtle)]">
                      <td className="p-3 font-mono">
                        <strong className="block text-[var(--accent)]">{row.key}</strong>
                        <small className="text-[10px] text-[var(--ink-muted)] block">
                          {row.timeRange} · max {row.maxChars} zn.
                        </small>
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={row.pl}
                          onChange={(e) => handleTextChange(row.key, "pl", e.target.value)}
                          className="w-full p-1.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-card)] text-xs text-[var(--ink-primary)]"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={row.en}
                          onChange={(e) => handleTextChange(row.key, "en", e.target.value)}
                          className="w-full p-1.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-card)] text-xs text-[var(--ink-primary)]"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={row.de}
                          onChange={(e) => handleTextChange(row.key, "de", e.target.value)}
                          className={`w-full p-1.5 rounded border text-xs text-[var(--ink-primary)] ${
                            row.de.length > row.maxChars
                              ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30"
                              : "border-[var(--border-subtle)] bg-[var(--bg-card)]"
                          }`}
                        />
                        {row.de.length > row.maxChars && (
                          <small className="text-[9px] text-amber-600 block mt-0.5">
                            {row.de.length}/{row.maxChars} zn. (Za długie!)
                          </small>
                        )}
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={row.cs}
                          onChange={(e) => handleTextChange(row.key, "cs", e.target.value)}
                          className="w-full p-1.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-card)] text-xs text-[var(--ink-primary)]"
                        />
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            row.status === "OK"
                              ? "bg-[var(--status-ok-bg)] text-[var(--status-ok-ink)]"
                              : "bg-[var(--status-warn-bg)] text-[var(--status-warn-ink)]"
                          }`}
                        >
                          {row.status === "OK" ? "✓ Poprawne" : "⚠ Sprawdź DE"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Approvals Column */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
              Workflow akceptacji rynków
            </h2>
            <p className="text-xs text-[var(--ink-secondary)]">
              Kliknij status, aby zatwierdzić rynek do końcowego renderingu.
            </p>

            <div className="space-y-2.5">
              {approvals.map((item, idx) => (
                <div
                  key={item.code}
                  className="p-3 rounded-xl border bg-[var(--bg-subtle)] border-[var(--border-subtle)] flex items-center justify-between"
                >
                  <div>
                    <b className="text-xs block text-[var(--ink-primary)]">{item.label}</b>
                    <small className="text-[10px] text-[var(--ink-muted)]">{item.by}</small>
                  </div>
                  <button
                    onClick={() => {
                      const next =
                        item.status === "Zaakceptowany"
                          ? "Do akceptacji"
                          : item.status === "Do akceptacji"
                          ? "Roboczy"
                          : "Zaakceptowany";
                      setApprovals((prev) =>
                        prev.map((a, i) =>
                          i === idx
                            ? {
                                ...a,
                                status: next,
                                by: `Zmieniono teraz: Ty (${new Date().toLocaleTimeString("pl-PL", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })})`,
                              }
                            : a
                        )
                      );
                      showToast(`Rynek ${item.code}: status zmieniony na ${next}.`);
                    }}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold shadow-sm ${
                      item.status === "Zaakceptowany"
                        ? "bg-[var(--status-ok-bg)] text-[var(--status-ok-ink)]"
                        : item.status === "Do akceptacji"
                        ? "bg-[var(--status-warn-bg)] text-[var(--status-warn-ink)]"
                        : "bg-[var(--bg-card)] text-[var(--ink-secondary)] border border-[var(--border-subtle)]"
                    }`}
                  >
                    {item.status === "Zaakceptowany"
                      ? "✓ Zaakceptowany"
                      : item.status === "Do akceptacji"
                      ? "⚠ Do akceptacji"
                      : "● Roboczy"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
