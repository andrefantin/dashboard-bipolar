// Cor da variação pelo ponto de vista do leitor brasileiro, não pela
// convenção de bolsa: moeda estrangeira cotada em reais ficando mais barata é
// notícia boa (verde); mais cara, ruim (vermelho). O Índice de Humor segue a
// mesma régua — dólar caindo deixa o mascote feliz.
// A Bovespa é a exceção: índice de ações subindo é que é bom (`goodWhen: "up"`).
// A seta continua mostrando a direção real (↗ subiu, ↘ caiu); só a cor muda.

export type GoodWhen = "down" | "up";

/** A variação é boa para o leitor? Zero conta como boa (nada piorou). */
export function isGoodChange(change: number, goodWhen: GoodWhen = "down"): boolean {
  return goodWhen === "down" ? change <= 0 : change >= 0;
}
