# Observables

The `@devicescript/observables` module provides a lightweight reactive observable framework, a limited subset of [RxJS](https://rxjs.dev).
We highly recommend reviewing the RxJS documentation for deeper discussions about observables.

## Setup

Add the `@devicescript/observables` package to your project,

```bash npm2yarn
npm install @devicescript/test
```

and import it to enable the APIs.

```ts skip
import "@devicescript/observables"
```

## Motivation

Imagine a temperature sensor, it routinely senses the temperature and updates the `temperature` register.
**The temperature register is an observable of sensor reading.**

If you write code in DeviceScript to listen for this data, it will look like this:

```ts skip
import { Temperature } from "@devicescript/clients"

const thermometer = new Temperature()
// highlight-next-line
thermometer.subscribe(temp => console.log(temp))
```

In particular, the handler passed to `subscribe` will be called whenever a new temperature reading is received (even if it did not change).
The program would print something like this:

```console
20
21
21
20
```

A better way to visualize streams of data and how observable handle them is to use a marble diagram.
The input stream (on top) arrives unchanged to the subscribe handler and is printed to the console.

```rx
-a-b-c-d-
a:= 20
b:= 21
c:= 21
d:= 20

> subscribe(...)

-a-b-c-d-
a:= 20
b:= 21
c:= 21
d:= 20
```

As you can see, there are 2 data readings with the same temperature and we would like to filter them out. Using the `threshold` operator,
which filters out small data changes, we get

```ts skip
import { Temperature } from "@devicescript/clients"
// highlight-next-line
import { threshold } from "@devicescript/observables"

const thermometer = new Temperature()
thermometer
    // highlight-next-line
    .pipe(threshold(1))
    .subscribe(temp => console.log(temp))
```

```rx
-a-b-c-d-
a:= 20
b:= 21
c:= 21
d:= 20

> threshold(1)

-a-b---d-
a:= 20
b:= 21
d:= 20
```

Operators can be chained and combined to create complex data processing pipelines. Custom operators can also be defining by combining existing ones
or writing them from bare code.

## Package

The observables framework is implemented in the [@devicescript/observables](https://www.npmjs.com/package/@devicescript/observables) package.