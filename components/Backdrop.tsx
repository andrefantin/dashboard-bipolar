import type { MoodId } from "@/lib/mood";

/** A luz de fundo da página — muda de tom com o humor do dólar. */
export default function Backdrop({ mood }: { mood?: MoodId }) {
  return <div className="backdrop-glow" data-mood={mood} aria-hidden="true" />;
}
