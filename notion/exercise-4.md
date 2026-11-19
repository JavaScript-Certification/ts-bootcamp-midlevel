# Exercise 4 - Escape Room Control Desk

---

**⏰ 10 min**

---

<aside>
💡 **Tip:** If you haven’t already set up the boilerplate code, do so now with these instructions.
</aside>

1. Open the following file: `/4-begin.html`

## Goal

You run the control desk of an escape room. The lobby screen must not show the secret code, every room must write its own hint, and a CCTV log lists every code a team tries. You practise real private fields, abstract classes and a typed decorator.

Edit `src/4-begin.ts`. Each step matches a `// Step k` comment.

## Step 1 - Hide the code (3 min)

`private` only exists for the compiler: `JSON.stringify` still sends the code to the lobby screen. Make `code` private at runtime too.

<aside>
💡 **Hint:** JavaScript has its own private fields.
</aside>

✅ **Check:** the page moves on to “Waiting for step 2”.

## Step 2 - Make Room abstract (3 min)

Nobody should create a plain `Room`, every room must write its own hint, and every room must be `Resettable`.

<aside>
💡 **Hint:** An abstract class can have abstract methods, with no body.
</aside>

✅ **Check:** the page moves on to “Waiting for step 3”.

## Step 3 - Log every attempt (4 min)

The wrapper in `logged` is written, but it logs nothing. Make it push one line per call into `audit`, like `Attic: tryCode(1234) returned false`, then decorate `tryCode`.

<aside>
💡 **Hint:** `context.name` is the name of the decorated method.
</aside>

✅ **Check:** the CCTV log shows the two attempts, and `npm test` passes.

## Expected result

![The finished exercise 4 page](images/exercise-4-result.png)

The plaque shows The Lantern Club inside, the lobby sees no code, and the CCTV lists both attempts. Type `1888` and press Enter: the door opens. The solution is in `src/4-end.ts`.

## Helpful Resources

1. [TypeScript Handbook - Classes: Parameter Properties](https://www.typescriptlang.org/docs/handbook/2/classes.html#parameter-properties)
2. [TypeScript Handbook - Classes: Caveats (private and #private)](https://www.typescriptlang.org/docs/handbook/2/classes.html#caveats)
3. [TypeScript Handbook - Classes: abstract Classes and Members](https://www.typescriptlang.org/docs/handbook/2/classes.html#abstract-classes-and-members)
4. [TypeScript Handbook - Classes: this-based type guards](https://www.typescriptlang.org/docs/handbook/2/classes.html#this-based-type-guards)
5. [TypeScript 5.0 Release Notes - Decorators](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#decorators)
