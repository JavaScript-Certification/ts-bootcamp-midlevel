# Exercise 1 - Charging Station Board

---

**⏰ 10 min**

---

<aside>
💡 **Tip:** If you haven’t already set up the boilerplate code, do so now with these instructions.
</aside>

1. Open the following file: `/1-begin.html`

## Goal

Charging stations send raw records, and some are broken. Every valid charger gets a bay in the car park, the rest drop into the bin. You practise discriminated unions, the `never` check, a type predicate and an assertion function.

Edit `src/1-begin.ts`. Each step matches a `// Step k` comment.

## Step 1 - Model the states (4 min)

Replace `Charger` with one object type per state, so an `available` charger can never have a `vehicle`:

```typescript
export type Charger =
  | { id: string; status: 'available' }
  | { id: string; status: 'charging'; vehicle: string; kWh: number }
  | { id: string; status: 'faulted'; code: string }
```

In `describe`, switch on `charger.status` and end with a `never` check:

```typescript
switch (charger.status) {
  case 'available':
    return `${charger.id}: available`
  case 'charging':
    return `${charger.id}: charging ${charger.vehicle}, ${charger.kWh} kWh`
  case 'faulted':
    return `${charger.id}: out of order (${charger.code})`
  default: {
    const unhandled: never = charger
    return unhandled
  }
}
```

✅ **Check:** the page shows `Latest: C2: charging EV-204, 21 kWh`.

## Step 2 - Check the raw records (3 min)

The records are `unknown`, so you prove their shape before you trust them. `isRecord` is given:

```typescript
export function isCharger(value: unknown): value is Charger {
  if (!isRecord(value) || typeof value.id !== 'string') return false
  switch (value.status) {
    case 'available':
      return true
    case 'charging':
      return typeof value.vehicle === 'string' && typeof value.kWh === 'number'
    case 'faulted':
      return typeof value.code === 'string'
    default:
      return false
  }
}
```

Then make `assertIsCharger` throw when `isCharger` says no:

```typescript
if (!isCharger(value)) throw new Error('Invalid charger record')
```

✅ **Check:** C1, C2 and C3 get a bay. C4 (no `kWh`), C5 and `null` drop into the bin.

## Step 3 - Follow the compiler (3 min)

Add `| { id: string; status: 'reserved'; until: string }` to `Charger`. The `never` check now points at `describe`:

```
error TS2322: Type '{ id: string; status: "reserved"; until: string; }' is not assignable to type 'never'.
```

Add the case (`C5: reserved until 18:30`), then add it to `isCharger` too.

<aside>
💡 **Hint:** The compiler trusts your predicate, so it cannot warn you about `isCharger`.
</aside>

✅ **Check:** the page says “All steps done”, and `npm test` passes.

## Expected result

![The finished exercise 1 page](images/exercise-1-result.png)

Four bays (C1, C2, C3, C5), two crates in the bin, a yellow ring on C2. The solution is in `src/1-end.ts`.

## Helpful Resources

1. [TypeScript Handbook - Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
2. [TypeScript Handbook - Exhaustiveness Checking](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking)
3. [TypeScript Handbook - Using Type Predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
4. [TypeScript 3.7 Release Notes - Assertion Functions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#assertion-functions)
