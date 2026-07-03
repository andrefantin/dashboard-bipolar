import Link from "next/link";
import Backdrop from "@/components/Backdrop";
import GlassPanel from "@/components/GlassPanel";

export default function NotFound() {
  return (
    <>
      <Backdrop mood="depressivo" />
      <div className="flex justify-center py-24">
        <GlassPanel raised className="max-w-md p-8 text-center">
          <p className="tabular font-display text-5xl font-semibold">404</p>
          <p className="mt-3 text-ink-2">
            Essa página não existe. Assim como o dólar, ela teve um dia difícil.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-pos/15 px-4 py-2 font-medium text-pos hover:bg-pos/25"
          >
            Voltar ao dashboard
          </Link>
        </GlassPanel>
      </div>
    </>
  );
}
