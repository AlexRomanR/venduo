/*
 * Lo que la pantalla de TikTok necesita saber, sin dependencias de servidor:
 * las opciones de privacidad que TikTok puede devolver y cómo se dicen.
 */

export const PRIVACIDADES = [
  "PUBLIC_TO_EVERYONE",
  "MUTUAL_FOLLOW_FRIENDS",
  "FOLLOWER_OF_CREATOR",
  "SELF_ONLY",
] as const
export type Privacidad = (typeof PRIVACIDADES)[number]

export const NOMBRES_DE_PRIVACIDAD: Record<Privacidad, string> = {
  PUBLIC_TO_EVERYONE: "Todos",
  MUTUAL_FOLLOW_FRIENDS: "Amigos",
  FOLLOWER_OF_CREATOR: "Seguidores",
  SELF_ONLY: "Solo yo",
}
