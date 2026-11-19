# Exercise 3 - Moonline Night Train

---

**⏰ 10 min**

---

<aside>
💡 **Tip:** If you haven’t already set up the boilerplate code, do so now with these instructions.
</aside>

1. Open the following file: `/3-begin.html`

## Goal

You run the booking desk of the Moonline night train. The data and the logic are written: you derive the types from them with `as const`, `satisfies`, `typeof`, `keyof` and utility types, so they can never drift. Edit `src/3-begin.ts`.

## Step 1 - Freeze the classes, check the fares (3 min)

Hover `CabinClass`: it is just `string`. Make `cabinClasses` keep its exact values. Then make sure `fares` has a price for every class, without losing its own type. The sleeper costs 129.

<aside>
💡 **Hint:** `as const` for the first, `satisfies` for the second. The compiler will tell you which fare is missing.
</aside>

✅ **Check:** the page moves on to “Waiting for step 3”.

## Step 2 - Derive the booking types (3 min)

`BookingRequest` and `Ticket` are hand-written copies that will drift. Derive them instead: a request is a `Booking` without its `id`, and a ticket is what `issue` returns, read-only.

<aside>
💡 **Hint:** `Omit`, `Readonly` and `ReturnType`. `ReturnType` takes a type, so use `typeof issue`.
</aside>

✅ **Check:** `npm run typecheck` is clean.

## Step 3 - Price the ticket (4 min)

`fare` uses `0` as the price per night. Use the fare of the booked cabin's class instead. The compiler will push back: the `Record<string, Cabin>` annotation forgot which cabins exist. Keep the check, keep the exact ids, and derive `CabinId` from them.

<aside>
💡 **Hint:** `satisfies` again, then `keyof typeof`.
</aside>

✅ **Check:** every cabin window prints its ticket, the page says “All steps done”, and `npm test` passes.

## Expected result

![The finished exercise 3 page](images/exercise-3-result.png)

Each cabin window slides out a one-line ticket, and the total is 330 EUR. The solution is in `src/3-end.ts`.

## Helpful Resources

1. [TypeScript Handbook - Keyof Type Operator](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)
2. [TypeScript Handbook - Typeof Type Operator](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html)
3. [TypeScript Handbook - Indexed Access Types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)
4. [TypeScript Handbook - Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
5. [TypeScript 4.9 Release Notes - The satisfies Operator](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator)
