# @jhel/iterup

Iterator util library

Utilising the iterator API, means that it does not consume the values or create any new arrays as long as you do not call a consuming method such as `toArray` or `collect`.

This makes it more performant than to chain multiple `.map`, `.filter` etc on an array directly.

## API

To use `iterup` either extend a given array or call the util method directly.

**Via the constructor method**

Create an `iterup` instance from any iterable, this will extend the array or iterator with the iterup api.

```ts
import { iterup } from '@jhel/iterup'

const collection = iterup([1, 2, 3])
```

**Via extension method directly**
```ts
import { filterMap, None } from '@jhel/iterup'

const collection = filterMap([1, 2, 3], (value) => {
    if(value === 2) return None
    return "Foo " + value
}) // Iterup<string>
```

### The Option type

The `interup` extended methods sometimes expects a returned `Option<T>` type, this type is a union of any value or a `None` flag. 

Returning a `None`, flags that this value should be filtered out (think of it as the equivalent as returning `false` in a regular filter function).

### filterMap
`filterMap` allows the user to filter values and map the resulting values at the same time.

You can think of it as using a `.filter` with a chained `.map` call directly after.

**arguments**
- `f`, predicate function which takes a `value` and an `index` and expects a returned `Option<T>` value.

**example**
```ts
import { iterup, None } from '@jhel/iterup'

const collection = iterup([1, 2, 3, 4])

collection.filterMap((value) => {
    if(value % 2 === 0) {
        return None
    }
    return `${value} is odd`
}).toArray() // ["1 is odd", "3 is odd"]
```

### enumerate
`enumerate` attaches an index to the value creating a tuple of `[Value, index]` pairs.

**example**
```ts
import { iterup, None } from '@jhel/iterup'

const collection = iterup([1, 2, 3, 4])

collection.enumerate().toArray() // [[1, 0], [2, 1], [3, 2], [4, 3]]
```

### findMap
`findMap` allows the user to find a specific value and map the resulting value at the same time.

You can think of it as using a `.find` with a transformation on the value directly after.

This method consumes the iterator.

**arguments**
- `f`, predicate function which takes a `value` and an `index` and expects a returned `Option<T>` value.

**example**
```ts
import { iterup, None } from '@jhel/iterup'

const collection = iterup([1, 2, 3, 4])

collection.findMap((value) => {
    if(value % 2 === 0) {
        return None
    }
    return `${value} is odd`
}) // "1 is odd"
```

## Development

To install dependencies:

```bash
bun install
```

Run test:
```bash
bun test
```
