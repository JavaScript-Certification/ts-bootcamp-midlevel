# Exercise 6 - Karaoke Night

---

**⏰ 10 min**

---

<aside>
💡 **Tip:** If you haven’t already set up the boilerplate code, do so now with these instructions.
</aside>

1. Open the following file: `/6-begin.html`

## Goal

It's karaoke night: song requests arrive as JSON text from the phones, and one mic goes from singer to singer. Broken requests drop into the bin, the mic always returns to its dock, and a form signs up a singer. You practise checking `unknown` data, `using`, and proving DOM types.

Edit `src/6-begin.ts`. Each step matches a `// Step k` comment.

## Step 1 - Check the minutes (3 min)

`singer` and `song` are already checked. Check `minutes` the same way, then replace `return null` with a new object:

```typescript
if (!('minutes' in value) || typeof value.minutes !== 'number' || value.minutes <= 0) return null
return { singer: value.singer, song: value.song, minutes: value.minutes }
```

✅ **Check:** press **Start the night**: Sam, Lena and Ana drop into the bin.

## Step 2 - Give the mic back with using (4 min)

Priya keeps the mic, so nobody else can sing. Make the mic `Disposable`:

```typescript
export type Mic = Disposable & { singer: string }
```

Add this to the object `borrowMic` returns, after `singer,`:

```typescript
[Symbol.dispose]() { dock.giveBack() },
```

Then, in `perform`, replace `const` with `using`:

```typescript
using mic = borrowMic(dock, request.singer)
```

✅ **Check:** Kofi's song fails, the mic still goes back to its dock, and Mo sings.

## Step 3 - Prove the input (3 min)

`querySelector` gives an `Element | null`. Wrap the `throw` in an `instanceof` check, then return the element:

```typescript
if (!(element instanceof HTMLInputElement)) throw new Error(`Missing field ${selector}`)
return element
```

✅ **Check:** sign up Ana for Mr Brightside, 4 minutes. The page says “All steps done”, and `npm test` passes.

## Expected result

![The finished exercise 6 page](images/exercise-6-result.png)

Three requests in the bin, "That's the night!" on the screen, the mic back on its dock. The solution is in `src/6-end.ts`.

## Helpful Resources

1. [TypeScript 5.2 Release Notes - using Declarations and Explicit Resource Management](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html#using-declarations-and-explicit-resource-management)
2. [TypeScript Handbook - The in operator narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#the-in-operator-narrowing)
3. [TypeScript Handbook - instanceof narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#instanceof-narrowing)
4. [MDN - using](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/using)
