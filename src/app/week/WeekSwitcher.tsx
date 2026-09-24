import Link from "next/link";
import { weekdayIndexOf } from "../../domain/week";

type Props = {
  focus: "current" | "next";
  today: string;
};

const SUNDAY = 6;

export function WeekSwitcher({ focus, today }: Props) {
  const canConfigure = weekdayIndexOf(today) === SUNDAY;

  return (
    <div className="week-switcher">
      <span data-testid="week-focus">
        {focus === "next" ? "Próxima semana" : "Semana atual"}
      </span>

      {focus === "next" ? (
        <Link href="/">Voltar à semana atual</Link>
      ) : canConfigure ? (
        <Link href="/?week=next">Configurar próxima semana</Link>
      ) : (
        <>
          <button type="button" data-testid="configure-next" disabled>
            Configurar próxima semana
          </button>
          <small data-testid="configure-hint">
            A próxima semana é configurada no domingo.
          </small>
        </>
      )}
    </div>
  );
}
