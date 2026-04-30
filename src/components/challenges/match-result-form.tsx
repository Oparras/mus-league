import type { MatchFormat } from "@/generated/prisma/client";

import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { submitMatchResultAction } from "@/lib/challenges/actions";
import { getMatchFormatLabel, getMatchFormatScoreGuide } from "@/lib/challenges/constants";

export function MatchResultForm({
  challengeId,
  format,
}: {
  challengeId: string;
  format: MatchFormat;
}) {
  const scoreGuide = getMatchFormatScoreGuide(format);

  return (
    <form action={submitMatchResultAction} className="space-y-5">
      <input type="hidden" name="challengeId" value={challengeId} />

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Formato de cierre</p>
        <p className="text-sm leading-6 text-muted-foreground">
          {getMatchFormatLabel(format)}. {scoreGuide.helperText}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="winnerTeamSlot" className="text-sm font-medium text-foreground">
            Equipo ganador
          </label>
          <Select id="winnerTeamSlot" name="winnerTeamSlot" defaultValue="TEAM_A" required>
            <option value="TEAM_A">Equipo A</option>
            <option value="TEAM_B">Equipo B</option>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="teamAScore" className="text-sm font-medium text-foreground">
            Marcador Equipo A
          </label>
          <Input
            id="teamAScore"
            name="teamAScore"
            type="number"
            min={0}
            max={scoreGuide.maxWinnerScore}
            className="h-11 rounded-2xl px-3"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="teamBScore" className="text-sm font-medium text-foreground">
            Marcador Equipo B
          </label>
          <Input
            id="teamBScore"
            name="teamBScore"
            type="number"
            min={0}
            max={scoreGuide.maxWinnerScore}
            className="h-11 rounded-2xl px-3"
            required
          />
        </div>
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        Este marcador se guardara como resultado propuesto. Necesita la confirmacion
        del otro equipo antes de entrar en historial y mover el ELO.
      </p>

      <SubmitButton pendingLabel="Registrando resultado..." className="h-11 rounded-2xl px-5">
        Registrar resultado
      </SubmitButton>
    </form>
  );
}
