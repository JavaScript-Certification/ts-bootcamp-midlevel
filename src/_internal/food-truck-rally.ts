// Trucks, dishes and volunteers of the Food Truck Rally. You do not need to modify this file.
export type Truck = { id: string; name: string; minutes: number }
export type Dish = { id: string; name: string; minutes: number }
export type Volunteer = { id: string; name: string }

// minutes: how long the queue is right now
export const trucks: readonly Truck[] = [
  { id: 'T1', name: 'Taco Loco', minutes: 12 },
  { id: 'T2', name: 'Bao Down', minutes: 4 },
  { id: 'T3', name: 'The Rolling Scone', minutes: 7 },
  { id: 'T4', name: 'Curry Up', minutes: 9 },
]

// minutes: how long the dish takes to prepare
export const dishes: readonly Dish[] = [
  { id: 'D1', name: 'Fish tacos', minutes: 6 },
  { id: 'D2', name: 'Pork bao', minutes: 3 },
  { id: 'D3', name: 'Cream tea', minutes: 2 },
]

// volunteers have no minutes
export const volunteers: readonly Volunteer[] = [
  { id: 'V1', name: 'Priya' },
  { id: 'V2', name: 'Tom' },
]
