import {
  IconChartCandle,
  IconCurrencyBitcoin,
  IconCurrencyDollar,
  IconCurrencyDollarAustralian,
  IconCurrencyDollarCanadian,
  IconCurrencyEuro,
  IconCurrencyPound,
  IconCurrencyWon,
  IconCurrencyYen,
  type Icon,
} from "@tabler/icons-react";

// Âncora visual de cada moeda: círculo na cor de identidade + ícone Tabler.
// É o que permite varrer a lista sem ler nome por nome.
// ARS usa o cifrão: é o símbolo real do peso argentino ($). O
// IconCurrencyPeso do Tabler desenha ₱ (peso filipino), que estaria errado.
const ICONS: Record<string, Icon> = {
  USD: IconCurrencyDollar,
  EUR: IconCurrencyEuro,
  GBP: IconCurrencyPound,
  BTC: IconCurrencyBitcoin,
  CAD: IconCurrencyDollarCanadian,
  ARS: IconCurrencyDollar,
  JPY: IconCurrencyYen,
  KRW: IconCurrencyWon,
  AUD: IconCurrencyDollarAustralian,
  IBOV: IconChartCandle,
};

interface CurrencyIconProps {
  /** código da moeda (USD, EUR…) ou "IBOV" */
  code: string;
  color: string;
  size?: number;
}

export default function CurrencyIcon({ code, color, size = 36 }: CurrencyIconProps) {
  const CurrencyGlyph = ICONS[code] ?? IconCurrencyDollar;
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, backgroundColor: `${color}24`, color }}
    >
      <CurrencyGlyph size={Math.round(size * 0.55)} stroke={1.8} />
    </span>
  );
}
