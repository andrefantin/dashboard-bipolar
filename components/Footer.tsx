import { PROFILE_URL } from "./Header";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-8">
      <div className="mx-auto max-w-6xl space-y-2 px-4 text-sm text-ink-3 sm:px-6">
        <p>
          <a
            href={PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-ink-2 underline-offset-2 hover:underline"
          >
            Dólar Bipolar
          </a>{" "}
          é um perfil satírico de economia que divulga a cotação do dólar no Bluesky.
        </p>
        <p>
          Cotações fornecidas pela{" "}
          <a
            href="https://docs.awesomeapi.com.br/api-de-moedas"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:underline"
          >
            AwesomeAPI
          </a>
          . Cotações informativas — não é recomendação de investimento.
        </p>
        <p>Manchetes via Google Notícias, com crédito e link para os veículos originais.</p>
      </div>
    </footer>
  );
}
