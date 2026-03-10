import { cn } from "@/lib/utils"
import { Marquee } from "@/components/ui/marquee"

const reviews = [
  {
    name: "Mariana S.",
    body: "Subi meu currículo e em minutos vi o que estava derrubando meu ATS: títulos confusos e poucas palavras-chave. Ajustei e meu score foi de 42 para 86.",
    img: "https://avatar.vercel.sh/mariana",
  },
  {
    name: "Rafael Lima",
    body: "Curti que ele compara com a vaga e aponta lacunas reais (skills, senioridade e resultados). As sugestões deixaram meu resumo muito mais direto e “escaneável” por ATS.",
    img: "https://avatar.vercel.sh/rafael",
  },
  {
    name: "Camila Rocha",
    body: "O diagnóstico de formatação salvou meu currículo: eu tinha ícones e duas colunas. Troquei por um layout simples, mantive as conquistas e parei de ser filtrada no automático.",
    img: "https://avatar.vercel.sh/camila",
  },
  {
    name: "Bruno Azevedo",
    body: "A análise por seção (experiência, skills, educação) foi certeira. Ele até sugeriu métricas de impacto e verbos de ação que deixaram minhas experiências mais fortes.",
    img: "https://avatar.vercel.sh/bruno",
  },
  {
    name: "Larissa Mendes",
    body: "Gostei do checklist de compatibilidade ATS e da revisão de palavras-chave por área. Em 1 tarde eu já tinha versões diferentes do currículo para cada vaga.",
    img: "https://avatar.vercel.sh/larissa",
  },
  {
    name: "Diego P.",
    body: "O melhor foi a clareza: mostra o que está bom, o que falta e como corrigir. Depois de aplicar as recomendações, comecei a receber mais retornos de recrutadores.",
    img: "https://avatar.vercel.sh/diego",
  },
]

const firstRow = reviews.slice(0, reviews.length / 2)
const secondRow = reviews.slice(reviews.length / 2)

const ReviewCard = ({
  name,
  body,
}: {
  name: string
  body: string
}) => {
  return (
    <figure className={cn("relative h-full w-full cursor-pointer overflow-hidden rounded-xl border border-zinc-800 p-4 bg-zinc-900/30 lg:w-50")}>
      <figcaption className="text-base text-zinc-50 font-medium">{name}</figcaption>
      <blockquote className="mt-2 text-zinc-400 text-sm">{body}</blockquote>
    </figure>
  )
}

export function DepoimentsMarquee() {
  return (
    <div className="relative flex h-125 w-full flex-row items-center justify-center overflow-hidden">
      <Marquee pauseOnHover vertical className="[--duration:40s]">
        {firstRow.map((review) => (
          <ReviewCard key={review.name} {...review} />
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover vertical className="[--duration:40s]">
        {secondRow.map((review) => (
          <ReviewCard key={review.name} {...review} />
        ))}
      </Marquee>
    </div>
  )
}
