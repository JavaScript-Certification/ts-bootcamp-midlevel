// Raw records sent by the charging stations. You do not need to modify this file.
export const feed: readonly unknown[] = [
  { id: 'C1', status: 'available' },
  { id: 'C2', status: 'charging', vehicle: 'EV-204', kWh: 18.5 },
  { id: 'C3', status: 'faulted', code: 'E42' },
  { id: 'C4', status: 'charging', vehicle: 'EV-311' },
  { id: 'C5', status: 'reserved', until: '18:30' },
  null,
]

export const latest: unknown = { id: 'C2', status: 'charging', vehicle: 'EV-204', kWh: 21 }
