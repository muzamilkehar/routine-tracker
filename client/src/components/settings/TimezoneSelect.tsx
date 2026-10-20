import { useMemo, type ComponentProps } from 'react'

// Every timezone the browser knows about (about 400), grouped by region
const SUPPORTED: string[] = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : []

const pretty = (zone: string) => (zone.includes('/') ? zone.split('/').slice(1).join(' / ').replaceAll('_', ' ') : zone)

function buildGroups(extra: string) {
  // The saved timezone and UTC must always be selectable, even if the browser's list omits them
  const zones = [...new Set([...SUPPORTED, 'UTC', extra])].sort()
  const groups = new Map<string, string[]>()
  for (const zone of zones) {
    const region = zone.includes('/') ? zone.split('/')[0] : 'Other'
    groups.set(region, [...(groups.get(region) ?? []), zone])
  }
  return [...groups.entries()]
}

export function TimezoneSelect({ current, ...props }: ComponentProps<'select'> & { current: string }) {
  const groups = useMemo(() => buildGroups(current), [current])

  return (
    <select {...props} className="input">
      {groups.map(([region, zones]) => (
        <optgroup key={region} label={region}>
          {zones.map((zone) => (
            <option key={zone} value={zone}>
              {pretty(zone)}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}