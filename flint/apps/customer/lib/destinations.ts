const DESTINATION_ALIASES: Record<string, string> = {
  UK: 'United Kingdom',
  GB: 'United Kingdom',
  USA: 'United States',
  US: 'United States',
  AE: 'United Arab Emirates',
  UAE: 'United Arab Emirates',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  SG: 'Singapore',
}

export function resolveDestination(destination: string): string {
  const normalized = (destination ?? '').trim()
  if (!normalized) return normalized
  const key = normalized.toUpperCase()
  return DESTINATION_ALIASES[key] ?? normalized
}