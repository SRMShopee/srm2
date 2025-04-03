import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm text-center">
        <h1 className="text-3xl font-semibold tracking-tight mb-4">
          404 - Página não encontrada
        </h1>
        <p className="text-muted-foreground mb-6">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 text-white bg-shopee-orange rounded-lg hover:bg-orange-600 transition-colors"
        >
          Voltar para a página inicial
        </Link>
      </div>
    </div>
  );
}
