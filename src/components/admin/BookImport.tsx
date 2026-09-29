"use client";

import { useRef, useState, useTransition } from "react";
import { Download, FileUp } from "lucide-react";
import { importBooks, type ImportRowResult } from "@/app/admin/actions/books";
import { Panel, Table, Td, Th } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";
import { csvToObjects, toCsv } from "@/lib/csv";
import { useT } from "@/lib/i18n/client";
import { errorMessage } from "@/lib/i18n/errors";

const HEADERS = ["title", "title_bn", "isbn", "publisher", "authors", "categories", "language", "binding", "edition", "pages", "mrp", "sale_price", "cost_price", "stock", "rack", "class_level", "description", "status"];
const SAMPLE = [HEADERS, ["WBCS Preliminary Guide", "ডব্লিউবিসিএস প্রিলিমিনারি গাইড", "9788123456789", "Chhaya Prakashani", "A. Writer; B. Editor", "wbcs", "bn", "paperback", "3rd", "480", "450", "400", "300", "25", "R2-S3", "WBCS", "Complete guide", "draft"]];

export function BookImport() {
  const { t, lang } = useT();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState("");
  const [report, setReport] = useState<{ results: ImportRowResult[]; created: number; updated: number; dry: boolean } | null>(null);
  const [pending, start] = useTransition();

  const download = () => {
    const blob = new Blob([toCsv(SAMPLE)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "books-template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setReport(null);
    setFileName(file.name);
    const parsed = csvToObjects(await file.text());
    setRows(parsed);
    if (parsed.length) run(parsed, true);
  };

  const run = (data: Record<string, string>[], dry: boolean) =>
    start(async () => {
      const res = await importBooks(data, { dryRun: dry });
      if (!res.ok) return toast.error(errorMessage(lang, res.error, res.detail));
      setReport({ ...res.data!, dry });
      if (!dry) toast.success(t("admin.import.done", { created: res.data!.created, updated: res.data!.updated }));
    });

  const failed = report?.results.filter((r) => !r.ok) ?? [];

  return (
    <div className="space-y-4">
      <Panel title={t("admin.import.step1")}>
        <p className="mb-3 text-sm text-slate-600">{t("admin.import.help")}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={download}><Download size={16} /> {t("admin.import.template")}</Button>
          <Button onClick={() => input.current?.click()} disabled={pending}><FileUp size={16} /> {t("admin.import.choose")}</Button>
          <input ref={input} type="file" accept=".csv,text/csv" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
        {fileName ? <p className="mt-3 text-sm">{fileName} — {t("admin.import.rows", { n: rows.length })}</p> : null}
      </Panel>

      {report ? (
        <Panel title={report.dry ? t("admin.import.preview") : t("admin.import.result")} padded={false}>
          <div className="flex flex-wrap items-center gap-4 border-b px-4 py-3 text-sm">
            <span className="text-stock">{t("admin.import.willCreate", { n: report.created })}</span>
            <span className="text-sky-700">{t("admin.import.willUpdate", { n: report.updated })}</span>
            <span className={failed.length ? "font-semibold text-red-600" : "text-slate-500"}>{t("admin.import.errors", { n: failed.length })}</span>
            {report.dry ? (
              <Button className="ml-auto" disabled={pending || report.created + report.updated === 0} onClick={() => run(rows, false)}>
                {t("admin.import.confirm", { n: report.created + report.updated })}
              </Button>
            ) : null}
          </div>
          {failed.length ? (
            <Table>
              <thead><tr><Th>#</Th><Th>{t("admin.col.book")}</Th><Th>{t("admin.import.error")}</Th></tr></thead>
              <tbody>
                {failed.map((r) => (
                  <tr key={r.row} className="bg-red-50/60">
                    <Td>{r.row}</Td>
                    <Td>{r.title || "—"}</Td>
                    <Td className="text-red-700">{errorMessage(lang, r.error)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : null}
        </Panel>
      ) : null}
    </div>
  );
}
