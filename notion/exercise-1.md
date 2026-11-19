# Exercise 1 - Charging Station Board

---

**⏰ 10 min**

---

<aside>
💡 **Tip:** If you haven’t already set up the boilerplate code, do so now with these instructions.
</aside>

1. Open the following file: `/1-begin.html`

## Goal

Charging stations send raw records, and some are broken. Every valid charger gets a bay, the rest drop into the bin. The runtime code is written: you only write the types that make it safe. Edit `src/1-begin.ts`.

## Step 1 - Add a state (3 min)

C2 is charging, a state your `Charger` union does not know yet. Add a `charging` member that carries its own data: a `vehicle` and its `kWh`. Then let the `never` check in `describe` tell you what is missing.

✅ **Check:** bay C2 shows `C2: charging EV-204, 18.5 kWh`.

## Step 2 - Predicate and assertion (3 min)

Hover `valid` at the bottom of the file: TypeScript only knows `unknown[]`. Change the return type of `isCharger` so that `true` tells TypeScript the value is a `Charger`. Then turn `assertIsCharger` into an assertion function that throws `Invalid charger record` when the record is not a charger.

<aside>
💡 **Hint:** Look up `value is ...` and `asserts value is ...`.
</aside>

✅ **Check:** `valid` is a `Charger[]`, and the page says “Waiting for step 3”.

## Step 3 - Follow the compiler (4 min)

The stations now send a `reserved` state, with an `until` time. Add it to `Charger`, then follow the compiler.

<aside>
💡 **Hint:** The compiler trusts your predicate, so it cannot tell you about `isCharger`.
</aside>

✅ **Check:** C5 gets a bay, the page says “All steps done”, and `npm test` passes.

## Expected result

![The finished exercise 1 page](images/exercise-1-result.png)

Four bays (C1, C2, C3, C5), two crates in the bin, a yellow ring on C2. The solution is in `src/1-end.ts`.

## Helpful Resources

1. [TypeScript Handbook - Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
2. [TypeScript Handbook - Exhaustiveness Checking](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking)
3. [TypeScript Handbook - Using Type Predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
4. [TypeScript 3.7 Release Notes - Assertion Functions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#assertion-functions)
