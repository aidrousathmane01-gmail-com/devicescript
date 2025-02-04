import { AssertionError } from "./core"

export function expect<T>(value: T) {
    return new Expect(value, false)
}
export class Expect<T> {
    constructor(readonly value: T, private readonly _not: boolean) {}

    private check(condition: boolean) {
        return this._not ? !condition : condition
    }

    not() {
        return new Expect<T>(this.value, !this._not)
    }

    toThrow() {
        try {
            ;(this.value as any)()
            throw new AssertionError("toThrow", "Expected to throw")
        } catch (e) {}
    }

    toBe(other: T): void {
        if (this.check(other !== this.value))
            throw new AssertionError(
                "toBe",
                `Expected ${other}, got ${this.value}`
            )
    }
}
