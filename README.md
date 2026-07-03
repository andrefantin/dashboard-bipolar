# Dólar Bipolar v2

Dashboard em pt-BR que acompanha o câmbio do real frente às principais moedas — companheiro do perfil satírico [@dolarbipolar](https://bsky.app/profile/dolarbipolar.com) no Bluesky.

**Custo de operação: zero.** Sem banco de dados, sem API paga, sem servidor próprio. Tudo roda em free tiers, indefinidamente.

## Funcionalidades

- **Painel de cotações** — USD, EUR, GBP, BTC, CAD, ARS (lote de 100), JPY (lote de 100), KRW (lote de 1000) e AUD, com variação do dia e sparkline de 7 dias.
- **Índice de Humor do Dólar** — cinco humores calculados da volatilidade dos últimos 30 dias ([lib/mood.ts](lib/mood.ts); limiares e legendas editáveis em constantes). O brilho de fundo da página muda de cor com o humor.
- **"Por que o dólar está assim?"** — manchetes do Google Notícias; dias com variação acima de ±0,7% ganham marcador no gráfico de 30 dias que filtra as manchetes daquele dia.
- **Comparação de moedas** — 2 a 4 moedas normalizadas em base 100, períodos de 7d a 1 ano.
- **Histórico por moeda** — `/moeda/usd`, `/moeda/eur` etc., com mínima/máxima/variação por período.

## Stack

Next.js 15 (App Router) + TypeScript + Tailwind CSS 4 + Recharts, na Vercel (Hobby).

Fontes de dados (via Route Handlers em `app/api/*`, com cache `revalidate`):

| Fonte | Dados | Cache |
|---|---|---|
| [AwesomeAPI](https://docs.awesomeapi.com.br/api-de-moedas) | cotações (chave opcional, recomendada) | 5 min |
| AwesomeAPI `/daily` | histórico diário | 6 h |
| Google News RSS | manchetes (título + fonte + link) | 30 min |
| [brapi.dev](https://brapi.dev) | Ibovespa (opcional) | 5 min |

## Rodando

```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # build de produção — funciona sem nenhuma env var
```

### Variáveis de ambiente (opcionais)

- `AWESOMEAPI_TOKEN` — token gratuito ([cadastro](https://awesomeapi.com.br/auth/signup), sem custo) que eleva a cota de 100 mil requisições/mês. **Fortemente recomendado em produção**: o tier anônimo (sem token) tem uma cota bem mais baixa e não documentada, e passa a responder `429 QuotaExceeded` sob uso real. Sem a variável, o site funciona mas fica exposto a esse limite.
- `BRAPI_TOKEN` — token gratuito do brapi.dev para o card do Ibovespa. Sem ele, o card simplesmente não aparece.

### Deploy

```bash
vercel deploy
```

Nada mais a configurar.

## Mascote por humor

Coloque variantes em `public/mascote/{mania,agitado,estavel,baixa,depressivo}.png` — enquanto não existirem, o avatar original (`default.webp`) é usado para os cinco humores.

---

Cotações informativas — não é recomendação de investimento.
