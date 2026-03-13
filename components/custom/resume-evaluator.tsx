"use client";

import Image from "next/image";
import { FolderOpenIcon, Loader2Icon, XIcon } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

type ResumeEvaluationSection = {
  title: string;
  score: number;
  tips: string[];
};

type ResumeEvaluation = {
  overallScore: number;
  summary: string;
  sections: ResumeEvaluationSection[];
  raw?: string;
};

type ApiSuccess = { success: true; evaluation: ResumeEvaluation };
type ApiError = { error: string; details?: string; reqId?: string };

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function formatBytes(bytes: number) {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)}MB`;
  const kb = bytes / 1024;
  return `${Math.max(1, Math.round(kb))}KB`;
}

function isAllowedFile(file: File) {
  const name = (file.name || "").toLowerCase();
  return name.endsWith(".pdf") || name.endsWith(".docx");
}

export function ResumeEvaluator() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [evaluation, setEvaluation] = useState<ResumeEvaluation | null>(null);

  const fileLabel = useMemo(() => {
    if (!file) return null;
    return `${file.name} • ${formatBytes(file.size)}`;
  }, [file]);

  const pickFile = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const runEvaluation = useCallback(async (nextFile: File) => {
    setIsLoading(true);
    setError(null);
    setEvaluation(null);

    try {
      abortRef.current?.abort();
      const abortController = new AbortController();
      abortRef.current = abortController;

      const formData = new FormData();
      formData.set("file", nextFile, nextFile.name);

      const response = await fetch("/api/resume/evaluate", {
        method: "POST",
        body: formData,
        signal: abortController.signal,
      });

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(text || "Resposta inválida do servidor.");
      }

      const data = (await response.json()) as ApiSuccess | ApiError;
      if (!response.ok) {
        if ("error" in data) {
          const base = data.error || "Erro ao processar currículo.";
          const extra = data.details ? `\n\nDetalhes: ${data.details}` : "";
          const reqId = data.reqId ? `\nReqId: ${data.reqId}` : "";
          throw new Error(`${base}${extra}${reqId}`);
        }
        throw new Error("Erro ao processar currículo.");
      }

      if (!("success" in data) || !data.success) {
        throw new Error("Erro ao processar currículo.");
      }

      setEvaluation(data.evaluation);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const acceptFile = useCallback(
    async (nextFile: File | null | undefined) => {
      if (!nextFile) return;

      if (!isAllowedFile(nextFile)) {
        setError("Envie um arquivo PDF ou DOCX.");
        return;
      }

      if (nextFile.size > MAX_FILE_SIZE_BYTES) {
        setError("Arquivo excede 5MB.");
        return;
      }

      abortRef.current?.abort();
      setFile(nextFile);
      setError(null);
      setEvaluation(null);
    },
    []
  );

  const clearFile = useCallback(() => {
    abortRef.current?.abort();
    setFile(null);
    setEvaluation(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const onAnalyzeClick = useCallback(async () => {
    if (!file || isLoading) return;

    if (!isAllowedFile(file)) {
      setError("Envie um arquivo PDF ou DOCX.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("Arquivo excede 5MB.");
      return;
    }

    await runEvaluation(file);
  }, [file, isLoading, runEvaluation]);

  const onInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      await acceptFile(e.target.files?.[0]);
      e.target.value = "";
    },
    [acceptFile]
  );

  const onDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      await acceptFile(e.dataTransfer.files?.[0]);
    },
    [acceptFile]
  );

  return (
    <div className="w-full flex flex-col gap-6">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={onInputChange}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={pickFile}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") pickFile();
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
        onDrop={onDrop}
        className={[
          "w-full max-w-200 border border-dashed rounded-lg mx-auto px-6 py-10 flex flex-col items-center justify-center gap-6 cursor-pointer transition-colors",
          isDragging ? "bg-lime-300/10 border-lime-300/60" : "bg-zinc-900/20 border-lime-300/30",
        ].join(" ")}
      >
        <Image src="/candidato.png" alt="Candidato Icone" width={100} height={100} />
        <div className="text-center">
          <p className="text-2xl font-semibold mb-2">Arraste seu currículo aqui</p>
          <p className="text-sm text-zinc-400">Ou clique para selecionar um arquivo</p>
          {fileLabel ? (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-zinc-800/70 bg-zinc-950/40 px-3 py-1">
              <p className="text-xs text-zinc-300">{fileLabel}</p>
              <button
                type="button"
                aria-label="Remover arquivo"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  clearFile();
                }}
                disabled={isLoading}
                className="text-zinc-400 hover:text-zinc-100 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <XIcon size={14} />
              </button>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              pickFile();
            }}
            disabled={isLoading}
            className="border border-lime-300/50 text-lime-300 font-semibold px-4 py-2 rounded-lg flex items-center justify-center gap-2 w-full sm:w-fit transition-all ease-in-out duration-300 hover:bg-lime-300 hover:text-zinc-950 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {file ? "Selecionar outro arquivo" : "Selecionar arquivo"}
            <FolderOpenIcon size={18} />  
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void onAnalyzeClick();
            }}
            disabled={!file || isLoading}
            className="bg-lime-300 text-zinc-950 font-bold px-4 py-2 rounded-lg flex items-center justify-center gap-2 w-full sm:w-fit transition-all ease-in-out duration-300 hover:cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                Analisando...
                <Loader2Icon className="animate-spin" size={18} />
              </>
            ) : (
              "Analisar currículo"
            )}
          </button>
        </div>
      </div>

      {error ? (
        <div className="w-full max-w-200 border border-red-500/30 bg-red-500/10 text-red-200 rounded-lg mx-auto px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      {evaluation ? (
        <div className="w-full max-w-200 mx-auto border border-zinc-800/70 bg-zinc-900/20 rounded-lg p-6">
          <div className="flex flex-col gap-2 mb-6">
            <p className="text-sm text-zinc-400 font-semibold tracking-wider">RESULTADO</p>
            <div className="flex items-end gap-3">
              <p className="text-5xl font-black text-lime-300">{evaluation.overallScore}</p>
              <p className="text-zinc-400">/ 100</p>
            </div>
            <p className="text-zinc-200">{evaluation.summary}</p>
          </div>

          <div className="flex flex-col gap-4">
            {evaluation.sections?.map((section) => (
              <div key={section.title} className="border border-zinc-800/70 rounded-lg p-4">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <p className="font-bold">{section.title}</p>
                  <p className="text-sm text-zinc-400">{section.score} / 100</p>
                </div>
                <ul className="list-disc pl-5 text-sm text-zinc-300 space-y-1">
                  {section.tips?.map((tip, idx) => (
                    <li key={`${section.title}-${idx}`}>{tip}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
