import { DropCard } from "./DropCard.tsx";
import { eyebrow } from "./styles.ts";

interface WelcomeProps {
  onFile: (file: File) => void;
}

export function Welcome({ onFile }: WelcomeProps) {
  return (
    <section
      className="mx-auto grid w-[min(1280px,100%)] min-h-[calc(100vh-122px)] items-center
        grid-cols-[minmax(0,0.95fr)_minmax(420px,0.8fr)] gap-[clamp(52px,8vw,120px)]
        px-[clamp(22px,5vw,68px)] py-[clamp(48px,8vw,112px)]
        max-lg:max-w-[720px] max-lg:grid-cols-1 max-lg:gap-[52px]
        max-sm:gap-[42px] max-sm:pt-[54px]"
    >
      <div>
        <span className={eyebrow}>Screenshot studio</span>
        <h1
          className="mt-[18px] mb-6 max-w-[700px] text-[clamp(46px,6vw,82px)] max-sm:text-[clamp(43px,14vw,64px)]
            leading-[0.98] font-[670] tracking-[-0.064em]"
        >
          Make every screenshot
          <br />
          <em className="font-serif font-normal text-muted-strong">feel intentional.</em>
        </h1>
        <p className="max-w-[560px] text-base max-sm:text-sm leading-[1.7] text-muted">
          Tintshot pulls color from your image and turns it into a polished, presentation-ready
          visual. No uploads. No templates to wrestle with.
        </p>
        <div className="mt-[30px] flex flex-wrap gap-[9px]" aria-label="Highlights">
          {["Auto-matched color", "Presentation frames", "Pixel-perfect export"].map((feature) => (
            <span
              key={feature}
              className="rounded-full border border-line bg-surface-tint px-[11px] py-2 text-[11px]
                text-muted-strong before:mr-1.5 before:text-accent-ink before:content-['✓']"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
      <DropCard onFile={onFile} />
    </section>
  );
}
