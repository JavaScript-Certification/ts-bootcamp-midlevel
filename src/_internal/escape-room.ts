// The game master's contract. You do not need to modify this file.

// Everything the game master can reset between two games
export interface Resettable {
  reset(): void
}
