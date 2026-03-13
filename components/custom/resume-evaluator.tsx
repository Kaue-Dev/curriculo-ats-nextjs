"use client";

import Image from "next/image";
import { FolderOpenIcon, Loader2Icon, XIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

type ApiAnalysisMeta = {
  id: string;
  filename: string | null;
  createdAt: string;
};

type ApiSuccess = {
  success: true;
  evaluation: ResumeEvaluation;
  analysis: ApiAnalysisMeta | null;
  premium: { unlocked: boolean; lockedSectionsCount: number; lockedTipsCount?: number };
  credits: { balance: number };
};
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
  const [isPayLoading, setIsPayLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [evaluation, setEvaluation] = useState<ResumeEvaluation | null>(null);
  const [analysis, setAnalysis] = useState<ApiAnalysisMeta | null>(null);
  const [premium, setPremium] = useState<{
    unlocked: boolean;
    lockedSectionsCount: number;
    lockedTipsCount?: number;
  } | null>(null);
  const [creditsBalance, setCreditsBalance] = useState<number | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminToken, setAdminToken] = useState<string>("");

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
    setAnalysis(null);
    setPremium(null);

    try {
      abortRef.current?.abort();
      const abortController = new AbortController();
      abortRef.current = abortController;

      const formData = new FormData();
      formData.set("file", nextFile, nextFile.name);

      const response = await fetch("/api/resume/evaluate", {
        method: "POST",
        body: formData,
        headers: showAdmin && adminToken ? { "x-admin-token": adminToken } : undefined,
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
      setAnalysis(data.analysis);
      setPremium(data.premium);
      setCreditsBalance(data.credits.balance);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  }, [adminToken, showAdmin]);

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
      setAnalysis(null);
      setPremium(null);
    },
    []
  );

  const clearFile = useCallback(() => {
    abortRef.current?.abort();
    setFile(null);
    setEvaluation(null);
    setError(null);
    setIsLoading(false);
    setAnalysis(null);
    setPremium(null);
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

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setShowAdmin(params.get("admin") === "1");
    } catch {
      setShowAdmin(false);
    }
  }, []);

  useEffect(() => {
    if (!showAdmin) return;
    try {
      const token = localStorage.getItem("cv_admin_token") || "";
      setAdminToken(token);
    } catch {
      // ignore
    }
  }, [showAdmin]);

  useEffect(() => {
    let isMounted = true;

    async function loadLatest() {
      try {
        // If user returned from Mercado Pago, refresh credits and try to unlock.
        const mpStatus = new URLSearchParams(window.location.search).get("mp");
        if (mpStatus === "success") {
          const creditsRes = await fetch("/api/credits", {
            method: "GET",
            headers: showAdmin && adminToken ? { "x-admin-token": adminToken } : undefined,
          });
          if (creditsRes.ok) {
            const creditsJson = (await creditsRes.json()) as { success: true; balance: number };
            if (isMounted) setCreditsBalance(creditsJson.balance);
          }

          // Try unlock latest (will return 402 if still no credits)
          await fetch("/api/resume/unlock-latest", {
            method: "POST",
            headers: showAdmin && adminToken ? { "x-admin-token": adminToken } : undefined,
          }).catch(() => {});
        }

        const res = await fetch("/api/resume/latest", {
          method: "GET",
          headers: showAdmin && adminToken ? { "x-admin-token": adminToken } : undefined,
        });

        if (res.status === 404) return;
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) return;

        const data = (await res.json()) as ApiSuccess | ApiError;
        if (!isMounted) return;
        if (!res.ok) return;
        if (!("success" in data) || !data.success) return;

        setEvaluation(data.evaluation);
        setAnalysis(data.analysis);
        setPremium(data.premium);
        setCreditsBalance(data.credits.balance);
      } catch {
        // ignore
      }
    }

    void loadLatest();
    return () => {
      isMounted = false;
    };
  }, [adminToken, showAdmin]);

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
            {analysis?.filename ? (
              <p className="text-xs text-zinc-500 break-all">Arquivo: {analysis.filename}</p>
            ) : null}
            {typeof creditsBalance === "number" ? (
              <p className="text-xs text-zinc-500">Créditos: {creditsBalance}</p>
            ) : null}
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

            {premium && !premium.unlocked && premium.lockedSectionsCount > 0 ? (
              <div className="relative border border-zinc-800/70 rounded-lg p-4 overflow-hidden">
                <div className="filter blur-sm select-none pointer-events-none opacity-70">
                  {Array.from({ length: Math.min(premium.lockedSectionsCount, 6) }).map((_, idx) => (
                    <div key={idx} className="border border-zinc-800/70 rounded-lg p-4 mb-3 last:mb-0">
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <p className="font-bold">Seção premium</p>
                        <p className="text-sm text-zinc-400">-- / 100</p>
                      </div>
                      <ul className="list-disc pl-5 text-sm text-zinc-300 space-y-1">
                        <li>Dica premium</li>
                        <li>Dica premium</li>
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/40">
                  <div className="text-center px-4">
                    <p className="text-sm text-zinc-300 mb-4">
                      Tenha acesso a mais{" "}
                      <span className="font-bold text-zinc-50">
                        {premium.lockedTipsCount ?? "várias"} dicas
                      </span>{" "}
                      por apenas <span className="font-bold text-lime-300">R$ 7,90</span>
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        if (isPayLoading) return;
                        setIsPayLoading(true);
                        try {
                          // If user already has credits, unlock without payment.
                          if (typeof creditsBalance === "number" && creditsBalance > 0) {
                            const res = await fetch("/api/resume/unlock-latest", {
                              method: "POST",
                              headers:
                                showAdmin && adminToken ? { "x-admin-token": adminToken } : undefined,
                            });
                            const data = (await res.json()) as ApiSuccess | ApiError;
                            if (!res.ok) {
                              throw new Error("error" in data ? data.error : "Falha ao desbloquear.");
                            }
                            if (!("success" in data) || !data.success) throw new Error("Falha ao desbloquear.");
                            setEvaluation(data.evaluation);
                            setAnalysis(data.analysis);
                            setPremium(data.premium);
                            setCreditsBalance(data.credits.balance);
                            setIsPayLoading(false);
                            return;
                          }

                          const checkoutRes = await fetch("/api/payments/mercadopago/create-checkout", {
                            method: "POST",
                          });
                          const checkout = (await checkoutRes.json()) as
                            | { success: true; initPoint?: string; sandboxInitPoint?: string }
                            | ApiError;
                          if (!checkoutRes.ok) {
                            throw new Error("error" in checkout ? checkout.error : "Falha ao iniciar pagamento.");
                          }
                          if (!("success" in checkout) || !checkout.success || !checkout.initPoint) {
                            throw new Error("Falha ao iniciar pagamento.");
                          }

                          window.location.href = checkout.initPoint;
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Erro inesperado.");
                          setIsPayLoading(false);
                        }
                      }}
                      disabled={isPayLoading}
                      className="bg-lime-300 text-zinc-950 font-bold px-4 py-2 rounded-lg inline-flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isPayLoading ? (
                        <>
                          Carregando...
                          <Loader2Icon className="animate-spin" size={18} />
                        </>
                      ) : typeof creditsBalance === "number" && creditsBalance > 0 ? (
                        "Desbloquear agora"
                      ) : (
                        "Desbloquear por R$ 7,90"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {showAdmin ? (
        <div className="w-fit mx-auto text-center">
        <button
          type="button"
          onClick={() => setIsAdminOpen((v) => !v)}
          className="text-xs text-zinc-500 underline underline-offset-4"
        >
          {isAdminOpen ? "Fechar admin" : "Admin"}
        </button>

        {isAdminOpen ? (
          <div className="mt-3 border border-zinc-800/70 bg-zinc-900/20 rounded-lg p-4 flex flex-col gap-3">
            <label className="text-xs text-zinc-400 font-semibold">Admin token</label>
            <input
              value={adminToken}
              onChange={(e) => {
                const next = e.target.value;
                setAdminToken(next);
                try {
                  localStorage.setItem("cv_admin_token", next);
                } catch {
                  // ignore
                }
              }}
              className="w-full bg-zinc-950/40 border border-zinc-800/70 rounded-lg px-3 py-2 text-sm"
              placeholder="Cole o ADMIN_TOKEN aqui"
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await fetch("/api/credits/grant", {
                      method: "POST",
                      headers: {
                        "content-type": "application/json",
                        ...(adminToken ? { "x-admin-token": adminToken } : {}),
                      },
                      body: JSON.stringify({ credits: 3 }),
                    });
                    const res = await fetch("/api/credits", {
                      method: "GET",
                      headers: adminToken ? { "x-admin-token": adminToken } : undefined,
                    });
                    if (!res.ok) return;
                    const data = (await res.json()) as { success: true; balance: number };
                    setCreditsBalance(data.balance);
                  } catch {
                    // ignore
                  }
                }}
                className="border border-zinc-700 text-zinc-200 px-3 py-2 rounded-lg text-sm hover:cursor-pointer"
              >
                +3 créditos (teste)
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await fetch("/api/credits/reset", {
                      method: "POST",
                      headers: adminToken ? { "x-admin-token": adminToken } : undefined,
                    });
                    const res = await fetch("/api/credits", {
                      method: "GET",
                      headers: adminToken ? { "x-admin-token": adminToken } : undefined,
                    });
                    if (!res.ok) return;
                    const data = (await res.json()) as { success: true; balance: number };
                    setCreditsBalance(data.balance);
                  } catch {
                    // ignore
                  }
                }}
                className="border border-zinc-700 text-zinc-200 px-3 py-2 rounded-lg text-sm hover:cursor-pointer"
              >
                Zerar créditos
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdminToken("");
                  try {
                    localStorage.removeItem("cv_admin_token");
                  } catch {
                    // ignore
                  }
                }}
                className="border border-zinc-700 text-zinc-200 px-3 py-2 rounded-lg text-sm hover:cursor-pointer"
              >
                Limpar token
              </button>
            </div>
          </div>
        ) : null}
      </div>
      ) : null}
    </div>
  );
}
