// Âncora visual de cada moeda: círculo na cor de identidade + símbolo.
// É o que permite varrer a lista sem ler nome por nome.
interface CurrencyIconProps {
  symbol: string;
  color: string;
  size?: number;
}

export default function CurrencyIcon({ symbol, color, size = 36 }: CurrencyIconProps) {
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full font-medium"
      style={{
        width: size,
        height: size,
        backgroundColor: `${color}24`,
        color,
        // símbolos compostos ("C$", "AR$") precisam de corpo menor para caber
        fontSize: size * (symbol.length > 2 ? 0.28 : symbol.length > 1 ? 0.34 : 0.44),
      }}
    >
      {symbol}
    </span>
  );
}
