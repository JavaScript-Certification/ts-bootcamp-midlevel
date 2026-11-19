# Exercise 3 - Moonline Night Train

---

**⏰ 10 min**

---

<aside>
💡 **Tip:** If you haven’t already set up the boilerplate code, do so now with these instructions.
</aside>

1. Open the following file: `/3-begin.html`

## Goal

You run the booking desk of the Moonline night train. The types in the file were copied by hand, and they have started to drift. You derive them instead, with `as const`, `satisfies`, `typeof`, `keyof` and utility types, so every cabin window can print its ticket.

Edit `src/3-begin.ts`. Each step matches a `// Step k` comment.

## Step 1 - Freeze the classes, check the fares (3 min)

Hover `CabinClass`: it is just `string`. Add `as const` to the list, then check the fares with `satisfies`:

```typescript
export const cabinClasses = ['seat', 'couchette', 'sleeper'] as const

export const fares = {
  seat: 39,
  couchette: 69,
} satisfies Record<CabinClass, number>
```

The compiler names the fare you forgot:

```
error TS2741: Property 'sleeper' is missing in type '{ seat: number; couchette: number; }' but required in type 'Record<"couchette" | "seat" | "sleeper", number>'.
```

Add `sleeper: 129`.

✅ **Check:** `CabinClass` is `'seat' | 'couchette' | 'sleeper'`, and the sleeper car shows 129 EUR.

## Step 2 - Derive the booking types (3 min)

Replace the two hand-written copies with one line each:

```typescript
export type BookingRequest = Omit<Booking, 'id'>
export type Ticket = Readonly<ReturnType<typeof issue>>
```

✅ **Check:** hover `Ticket`: every field is `readonly`, and `cabin` follows `Booking`.

## Step 3 - Derive the cabin ids, price the ticket (4 min)

Swap the `Record<string, Cabin>` annotation for `satisfies`, derive `CabinId` from the keys, then price the booking in `fare` (`total` is given):

```typescript
export const cabins = {
  // ...the three cabins
} satisfies Record<string, Cabin>

export type CabinId = keyof typeof cabins

export function fare(booking: Booking): number {
  return total(fares[cabins[booking.cabin].class], booking)
}
```

<aside>
💡 **Hint:** With the old annotation, `cabins[booking.cabin]` fails with `Object is possibly 'undefined'.` With `CabinId`, every cabin exists.
</aside>

✅ **Check:** `CabinId` is `'11A' | '12C' | '14D'`, every cabin window prints its ticket, and `npm test` passes.

## Expected result

![The finished exercise 3 page](images/exercise-3-result.png)

Each cabin window slides out a one-line ticket, and the total is 330 EUR. The solution is in `src/3-end.ts`.

## Helpful Resources

1. [TypeScript Handbook - Keyof Type Operator](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)
2. [TypeScript Handbook - Typeof Type Operator](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html)
3. [TypeScript Handbook - Indexed Access Types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)
4. [TypeScript Handbook - Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
5. [TypeScript 4.9 Release Notes - The satisfies Operator](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator)
