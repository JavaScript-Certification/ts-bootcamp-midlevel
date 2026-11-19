# Exercise 2 - Food Truck Rally

---

**⏰ 10 min**

---

<aside>
💡 **Tip:** If you haven’t already set up the boilerplate code, do so now with these instructions.
</aside>

1. Open the following file: `/2-begin.html`

## Goal

The board of a weekend food truck rally. You write three small generic helpers: one with a constraint, one with a default, one with a `const` type parameter. Each step lights up part of the rally street.

Edit `src/2-begin.ts`. Each step matches a `// Step k` comment. Hover `fastDish` and `tour` at the bottom of the file to see your types.

## Step 1 - A generic with a constraint (4 min)

`quickest` should return the item with the shortest `minutes`, and keep the caller's type: a `Truck` in, a `Truck` out. Give it a type parameter, then constrain it to what the body reads:

```typescript
export function quickest<T extends { minutes: number }>(items: readonly T[]): T | undefined {
  let best: T | undefined
  for (const item of items) {
    if (!best || item.minutes < best.minutes) best = item
  }
  return best
}
```

<aside>
💡 **Hint:** Try `<T>` alone first. The compiler says `Property 'minutes' does not exist on type 'T'`: that's what the constraint is for.
</aside>

✅ **Check:** `fastDish` is a `Dish | undefined`, and Bao Down gets its “Quickest” badge.

## Step 2 - A default type parameter (3 min)

Add a second type parameter `E` for the error, with `string` as its default:

```typescript
export type Lookup<T, E = string> =
  | { found: true; value: T }
  | { found: false; error: E }
```

✅ **Check:** `findById` still compiles without naming `E`, and “No match for T9” shows over the empty spot.

## Step 3 - A const type parameter (3 min)

`route` should keep the exact stops, in order:

```typescript
export function route<const T extends readonly string[]>(stops: T): T {
  return stops
}
```

✅ **Check:** `tour` is `readonly ["T2", "T4", "T1"]`, the page says “All steps done”, and `npm test` passes.

## Expected result

![The finished exercise 2 page](images/exercise-2-result.png)

The whole street lights up: the "Quickest" badge on Bao Down, "No match for T9" over the empty spot, and the tasting stops numbered 1 to 3. The solution is in `src/2-end.ts`.

## Helpful Resources

1. [TypeScript Handbook - Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
2. [TypeScript Handbook - Generic Constraints](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints)
3. [TypeScript Handbook - Generic Parameter Defaults](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-parameter-defaults)
4. [TypeScript 5.0 Release Notes - const Type Parameters](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#const-type-parameters)
