import Link from "next/link";

type Props = {
  focus: "current" | "next";
};

export function WeekSwitcher({ focus }: Props) {
  return (
    <div className="week-switcher">
      <span data-testid="week-focus">
        {focus === "next" ? "Próxima semana" : "Semana atual"}
      </span>
      {focus === "current" ? (
        <Link href="/?week=next">Configurar próxima semana</Link>
      ) : (
        <Link href="/">Voltar à semana atual</Link>
      )}
    </div>
  );
}
