import { DepoimentsMarquee } from "@/components/custom/depoiments-marquee";
import { LightRays } from "@/components/ui/light-rays";
import { ArrowRightIcon, CheckIcon, FolderOpenIcon, LockIcon } from "lucide-react";
import Image from "next/image";
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
      <section className="relative z-10 w-full max-w-7xl mx-auto py-8 lg:py-0 min-h-screen flex flex-col lg:flex-row items-center justify-center gap-8 px-4">
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
      <section id="input-cv" className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center justify-center gap-8 px-4 mb-50">
        <div className="text-center">
          <p className="text-sm text-lime-300 font-bold tracking-wider mb-2">COMECE AGORA</p>
          <h2 className="text-3xl font-bold mb-4">Análise seu currículo gratuitamente</h2>
          <div className="flex items-center justify-center gap-2">
            <div className="bg-zinc-900/50 text-zinc-400 font-semibold border border-zinc-800/70 text-xs px-4 py-2 w-fit rounded-full tracking-wider">PDF</div>
            <div className="bg-zinc-900/50 text-zinc-400 font-semibold border border-zinc-800/70 text-xs px-4 py-2 w-fit rounded-full tracking-wider">DOCX</div>
            <div className="bg-zinc-900/50 text-zinc-400 font-semibold border border-zinc-800/70 text-xs px-4 py-2 w-fit rounded-full tracking-wider">DOC</div>
          </div>
        </div>
        <div className="w-full max-w-200 border border-dashed border-lime-300/30 rounded-lg bg-zinc-900/20 px-6 py-10 flex flex-col items-center justify-center gap-6">
          <Image src="/candidato.png" alt="Candidato Icone" width={100} height={100} />
          <div className="text-center">
            <p className="text-2xl font-semibold mb-2">Arraste seu currículo aqui</p>
            <p className="text-sm text-zinc-400">Ou clique para selecionar um arquivo</p>
          </div>
          <button className="border border-lime-300/50 text-lime-300 font-semibold px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer w-fit transition-all ease-in-out duration-300 hover:bg-lime-300 hover:text-zinc-950">
            Selecionar arquivo
            <FolderOpenIcon size={18} />
          </button>
        </div>
        <p className="text-sm text-zinc-400 flex items-center gap-2"><LockIcon size={16} /> Seus dados são usados apenas para análise e descartados após 24h</p>
      </section>

      <LightRays />
    </main>
  )
}
