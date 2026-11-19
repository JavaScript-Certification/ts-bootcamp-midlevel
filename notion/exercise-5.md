# Exercise 5 - Mars Rover Uplink

---

**⏰ 10 min**

---

<aside>
💡 **Tip:** If you haven’t already set up the boilerplate code, do so now with these instructions.
</aside>

1. Open the following file: `/5-begin.html`

## Goal

Mission control pings four rovers on Mars, and some of them fail: a lost signal (try again), an offline rover (do not retry), or old firmware that throws plain strings. Once you are done, each rover shows a report line and nothing crashes. You practise Result types, `unknown` errors and `async` code.

Edit `src/5-begin.ts`. Each step matches a `// Step k` comment. `retryDelays` (a generator that yields `5`, `10`, `20`) and `sleep` are given.

## Step 1 - Make Result a union (3 min)

A success must carry a value and a failure an error, never both:

```typescript
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E }
```

Then narrow it in `reportLine`:

```typescript
if (!outcome.ok) return `${rover}: ${outcome.error}`
return `${rover}: ${outcome.value.battery}% battery at ${outcome.value.site}`
```

<aside>
💡 **Hint:** With the old type, `outcome.value.battery` fails with `'outcome.value' is possibly 'undefined'.` With the union, checking `outcome.ok` is enough.
</aside>

✅ **Check:** the page says “Waiting for step 2”.

## Step 2 - Describe each failure (3 min)

A caught error is `unknown`, so you narrow it before you read it. The most specific classes come first:

```typescript
export function describeFailure(err: unknown): string {
  if (err instanceof SignalLostError) return 'signal lost'
  if (err instanceof RoverOfflineError) return `offline since ${err.since}`
  if (err instanceof Error) return err.message
  return `unknown failure: ${String(err)}`
}
```

✅ **Check:** the page says “Waiting for step 3”.

## Step 3 - Retry, never reject (4 min)

Ping the rover. A lost signal is retried after each delay, every other failure becomes a `Result` straight away:

```typescript
for (const delay of retryDelays(5, 3)) {
  try {
    return { ok: true, value: await network.ping(rover) }
  } catch (err) {
    if (!(err instanceof SignalLostError)) return { ok: false, error: describeFailure(err) }
    await sleep(delay)
  }
}
return { ok: false, error: 'signal lost' }
```

<aside>
💡 **Hint:** Keep the `await` inside the `try`. Without it, a rejection escapes the `catch`, and the compiler says `Type 'Promise<Telemetry>' is missing the following properties from type 'Telemetry': rover, battery, site`.
</aside>

✅ **Check:** perseverance shows `retry in 5 ms`, then turns green. The page says “All steps done”, and `npm test` passes.

## Expected result

![The finished exercise 5 page](images/exercise-5-result.png)

Each rover card ends with one word: green `ok`, red `offline` or orange `failed`. The solution is in `src/5-end.ts`.

## Helpful Resources

1. [TypeScript Handbook - Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
2. [TypeScript Handbook - instanceof narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#instanceof-narrowing)
3. [TSConfig Reference - useUnknownInCatchVariables](https://www.typescriptlang.org/tsconfig/#useUnknownInCatchVariables)
4. [MDN - async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
5. [MDN - function*](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*)
