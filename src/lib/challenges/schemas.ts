import { MatchFormat } from "@/generated/prisma/client";
import type { LobbyTeamSlot } from "@/generated/prisma/client";
import { z } from "zod";

const optionalDescriptionSchema = z
  .string()
  .trim()
  .max(240, "La descripcion no puede superar los 240 caracteres.")
  .optional()
  .or(z.literal(""))
  .transform((value) => value || undefined);

const optionalLocationSchema = z
  .string()
  .trim()
  .max(80, "La ubicacion no puede superar los 80 caracteres.")
  .optional()
  .or(z.literal(""))
  .transform((value) => value || undefined);

const optionalDateTimeSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((value) => {
    if (!value) {
      return undefined;
    }

    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  })
  .refine((value) => value !== null, "Elige una fecha y hora validas.");

export const createChallengeSchema = z.object({
  leagueId: z.string().trim().min(1, "Selecciona una zona para el reto."),
  matchFormat: z.nativeEnum(MatchFormat, {
    error: "Selecciona un formato de partida valido.",
  }),
  description: optionalDescriptionSchema,
  locationName: optionalLocationSchema,
  proposedAt: optionalDateTimeSchema,
});

export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;

const scoreValueSchema = z.coerce
  .number()
  .int("El marcador debe ser un numero entero.")
  .min(0, "El marcador no puede ser negativo.");

export const submitMatchResultSchema = z.object({
  challengeId: z.string().trim().min(1, "Falta el identificador del reto."),
  winnerTeamSlot: z.enum(["TEAM_A", "TEAM_B"]),
  teamAScore: scoreValueSchema,
  teamBScore: scoreValueSchema,
});

const optionalDisputeReasonSchema = z
  .string()
  .trim()
  .max(280, "El motivo de disputa no puede superar los 280 caracteres.")
  .optional()
  .or(z.literal(""))
  .transform((value) => value || undefined);

export const disputeMatchResultSchema = z.object({
  challengeId: z.string().trim().min(1, "Falta el identificador del reto."),
  disputeReason: optionalDisputeReasonSchema,
});

export function validateMatchResultByFormat(input: {
  format: MatchFormat;
  winnerTeamSlot: LobbyTeamSlot;
  teamAScore: number;
  teamBScore: number;
}) {
  const winnerScore =
    input.winnerTeamSlot === "TEAM_A" ? input.teamAScore : input.teamBScore;
  const loserScore =
    input.winnerTeamSlot === "TEAM_A" ? input.teamBScore : input.teamAScore;

  if (input.teamAScore === input.teamBScore) {
    return "El marcador no puede terminar en empate.";
  }

  if (winnerScore <= loserScore) {
    return "El equipo ganador seleccionado debe tener un marcador superior.";
  }

  switch (input.format) {
    case "POINTS_30":
      if (winnerScore !== 30 || loserScore > 29) {
        return "Una partida a 30 debe terminar con el ganador en 30 y el rival por debajo de 30.";
      }
      break;
    case "POINTS_40":
      if (winnerScore !== 40 || loserScore > 39) {
        return "Una partida a 40 debe terminar con el ganador en 40 y el rival por debajo de 40.";
      }
      break;
    case "VACA_FIRST_TO_3":
      if (winnerScore !== 3 || loserScore > 2) {
        return "Primera a 3 vacas debe terminar con el ganador en 3 y el rival por debajo de 3.";
      }
      break;
    case "BEST_OF_3_VACAS":
      if (winnerScore !== 2 || loserScore > 1) {
        return "Mejor de 3 vacas debe terminar con el ganador en 2 y el rival por debajo de 2.";
      }
      break;
  }

  return null;
}
