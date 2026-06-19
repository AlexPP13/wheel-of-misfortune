import type { WorldCupMatch } from '../types/app'

export type FifaApiLocalizedText = {
  Description: string
  Locale: string
}

export type FifaApiTeam = {
  Name?: FifaApiLocalizedText[]
  TeamName?: FifaApiLocalizedText[]
}

export type FifaApiMatch = {
  Away?: FifaApiTeam | null
  AwayTeam?: FifaApiTeam | null
  AwayTeamScore: number | null
  Date: string
  GroupName?: FifaApiLocalizedText[]
  Home?: FifaApiTeam | null
  HomeTeam?: FifaApiTeam | null
  HomeTeamScore: number | null
  MatchNumber: number
  MatchStatus: number
  MatchTime: string | null
  PlaceHolderA?: string | null
  PlaceHolderB?: string | null
  Stadium?: {
    CityName?: FifaApiLocalizedText[]
    Name?: FifaApiLocalizedText[]
  }
  StageName?: FifaApiLocalizedText[]
}

export const FIFA_WORLD_CUP_2026_MATCHES_URL =
  'https://api.fifa.com/api/v3/calendar/matches?language=en&count=200&idCompetition=17&idSeason=285023'

function localizedName(values: FifaApiLocalizedText[] | undefined) {
  return values?.[0]?.Description ?? ''
}

function teamName(team: FifaApiTeam | null | undefined) {
  return localizedName(team?.TeamName) || localizedName(team?.Name)
}

function placeholderLabel(value: string | null | undefined) {
  if (!value) return ''
  if (/^W\d+$/.test(value)) return `Winner Match ${value.slice(1)}`
  if (/^RU\d+$/.test(value)) return `Runner-up Match ${value.slice(2)}`
  if (/^1[A-L]$/.test(value)) return `Winner Group ${value[1]}`
  if (/^2[A-L]$/.test(value)) return `Runner-up Group ${value[1]}`

  const thirdPlace = value.match(/^3([A-L]+)$/)
  if (thirdPlace) return `Third place Group ${thirdPlace[1].split('').join('/')}`

  return value
}

function stageName(match: FifaApiMatch): WorldCupMatch['stage'] {
  const stage = localizedName(match.StageName)

  if (stage === 'First Stage') return 'Group stage'
  if (stage === 'Play-off for third place') return 'Third-place match'
  if (
    stage === 'Round of 32' ||
    stage === 'Round of 16' ||
    stage === 'Quarter-final' ||
    stage === 'Semi-final' ||
    stage === 'Final'
  ) {
    return stage
  }

  return 'Group stage'
}

export function toWorldCupMatch(match: FifaApiMatch): WorldCupMatch | null {
  if (!match.MatchNumber || !match.Date) {
    return null
  }

  const stadium = localizedName(match.Stadium?.Name)
  const city = localizedName(match.Stadium?.CityName)
  const groupName = localizedName(match.GroupName).replace('Group ', '')

  return {
    id: `wc2026-${match.MatchNumber}`,
    matchNumber: match.MatchNumber,
    stage: stageName(match),
    group: groupName || undefined,
    homeTeam: teamName(match.Home) || teamName(match.HomeTeam) || placeholderLabel(match.PlaceHolderA),
    awayTeam: teamName(match.Away) || teamName(match.AwayTeam) || placeholderLabel(match.PlaceHolderB),
    kickoff: match.Date.replace('Z', '.000Z'),
    venue: [stadium, city].filter(Boolean).join(', '),
  }
}

export async function fetchWorldCup2026Matches(signal?: AbortSignal) {
  const response = await fetch(FIFA_WORLD_CUP_2026_MATCHES_URL, { signal })

  if (!response.ok) {
    throw new Error(`FIFA matches request failed: ${response.status}`)
  }

  const data = (await response.json()) as { Results?: FifaApiMatch[] }
  const fifaMatches = Array.isArray(data.Results) ? data.Results : []
  const matches = fifaMatches
    .map(toWorldCupMatch)
    .filter((match): match is WorldCupMatch => Boolean(match))
    .sort((a, b) => a.matchNumber - b.matchNumber)

  return { fifaMatches, matches }
}
