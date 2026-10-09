import Link from "next/link";
import { useId } from "react";
import { weekdayIndexOf } from "../../domain/week";

type Props = {
  focus: "current" | "next";
  today: string;
};

const SUNDAY = 6;

export function WeekSwitcher({ focus, today }: Props) {
  const hintId = useId();
  const canConfigure = weekdayIndexOf(today) === SUNDAY;
  const isCurrent = focus === "current";

  return (
    <div className="week-switcher" role="group" aria-label="Semana em foco">
      <Link
        href="/"
        className="week-option"
        aria-current={isCurrent ? "true" : undefined}
        data-testid={isCurrent ? "week-focus" : undefined}
      >
        Atual
      </Link>

      {isCurrent && !canConfigure ? (
        <>
          <button
            type="button"
            className="week-option"
            data-testid="configure-next"
            aria-disabled="true"
            aria-describedby={hintId}
            onClick={(event) => event.preventDefault()}
          >
            Próxima
          </button>
          <small id={hintId} className="week-hint" role="tooltip" data-testid="configure-hint">
            A próxima semana é configurada no domingo.
          </small>
        </>
      ) : (
        <Link
          href="/?week=next"
          className="week-option"
          aria-current={isCurrent ? undefined : "true"}
          data-testid={isCurrent ? undefined : "week-focus"}
        >
          Próxima
        </Link>
      )}
    </div>
  );
}
