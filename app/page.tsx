import { DepoimentsMarquee } from "@/components/custom/depoiments-marquee";
import { ResumeEvaluator } from "@/components/custom/resume-evaluator";
import { LightRays } from "@/components/ui/light-rays";
import { NumberTicker } from "@/components/ui/number-ticker";
import { ArrowRightIcon, CheckIcon, LockIcon } from "lucide-react";
import Link from "next/link";

export default function Page() {
  return (
    <main className="relative overflow-hidden">
      <header className="hidden lg:flex justify-center w-full border-b border-zinc-900 bg-zinc-950">
        <div className="w-full max-w-7xl flex items-center justify-between p-4">
          <div className="w-fit flex items-center gap-6">
            <Link href="#">Como funciona</Link>
            <Link href="#">Preços</Link>
            <Link href="#">FAQ</Link>
          </div>
          <button className="bg-lime-300 text-zinc-950 font-bold px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer w-fit">
            Analisar currículo
            <ArrowRightIcon size={18} />
          </button>
        </div>
      </header>
      <section className="relative z-10 w-full max-w-7xl mx-auto py-8 lg:py-0 h-auto lg:h-screen flex flex-col lg:flex-row items-center justify-center gap-8 px-4">
        <div className="w-full flex flex-col gap-6">
          <div className="bg-lime-300/15 text-lime-300 border border-lime-300/20 text-sm font-semibold px-4 py-2 w-fit rounded-full">IA + ANÁLISE ATS</div>
          <h2 className="text-5xl font-black leading-14">
            Seu currículo <span className="text-lime-300">passa</span> pelo <br /> filtro ou vai pro lixo?
          </h2>
          <p className="text-lg text-zinc-400">75% dos currículos são descartados antes de um humano ler. Nossa IA analisa seu currículo contra os sistemas ATS e mostra exatamente o que corrigir.</p>
          <Link href="#input-cv" className="bg-lime-300 text-zinc-950 font-bold px-6 py-3 rounded-lg flex items-center gap-2 cursor-pointer w-fit">
            Analisar grátis agora
            <ArrowRightIcon size={18} />
          </Link>
          <ul className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
            <li className="text-sm text-zinc-400 flex items-center gap-1"><CheckIcon size={16} /> Sem cadastro</li>
            <li className="text-sm text-zinc-400 flex items-center gap-1"><CheckIcon size={16} /> Resultado em segundos</li>
            <li className="text-sm text-zinc-400 flex items-center gap-1"><CheckIcon size={16} /> Relatório base gratuito</li>
          </ul>
        </div>
        <div className="w-full hidden lg:block">
          <DepoimentsMarquee />
        </div>
      </section>
      <section className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center justify-center gap-8 px-4 py-10">
        <div className="flex items-center">
          <span className="text-6xl">+</span>
          <NumberTicker
            value={27}
            className="text-8xl font-medium tracking-tighter whitespace-pre-wrap text-zinc-50"
          />
        </div>
      </section>
      <section id="input-cv" className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center justify-center gap-8 px-4 py-25 mb-50">
        <div className="text-center">
          <p className="text-sm text-lime-300 font-bold tracking-wider mb-2">COMECE AGORA</p>
          <h2 className="text-3xl font-bold mb-4">Análise seu currículo gratuitamente</h2>
          <div className="flex items-center justify-center gap-2">
            <div className="bg-zinc-900/50 text-zinc-400 font-semibold border border-zinc-800/70 text-xs px-4 py-2 w-fit rounded-full tracking-wider">PDF</div>
            <div className="bg-zinc-900/50 text-zinc-400 font-semibold border border-zinc-800/70 text-xs px-4 py-2 w-fit rounded-full tracking-wider">DOCX</div>
          </div>
        </div>
        <ResumeEvaluator />
        <p className="text-sm text-zinc-400 flex items-center gap-2"><LockIcon size={16} /> Seus dados não são armazenados e são utilizados apenas durante a análise</p>
      </section>

      <LightRays />
    </main>
  )
}
