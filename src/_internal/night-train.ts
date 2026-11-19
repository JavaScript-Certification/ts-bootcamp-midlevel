// Timetable and formatting for the Moonline night train. You do not need to modify this file.
export const departure = 'Moonline 1407, Paris Est 19:42 to Wien Hbf 09:58'

// breakfast is served in the cabin, every morning of the trip
export const breakfastPerNight = 12

export function euros(amount: number): string {
  return `${amount} EUR`
}

/** Gives a booking request its id: ML-1, ML-2... */
export function book<R extends object>(request: R, index: number): R & { id: string } {
  return { ...request, id: `ML-${index + 1}` }
}

/** The total of a booking: the price per night, plus breakfast when booked, for every night */
export function total(perNight: number, booking: { nights: number; breakfast: boolean }): number {
  return (perNight + (booking.breakfast ? breakfastPerNight : 0)) * booking.nights
}

/** One line per ticket, as printed in the console */
export function ticketLine(ticket: { id: string; passenger: string; cabin: string; total: number }): string {
  return `${ticket.id} ${ticket.passenger}, cabin ${ticket.cabin}: ${euros(ticket.total)}`
}
