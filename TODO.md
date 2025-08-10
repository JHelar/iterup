## How to signal a non value
- false
- null
- null | undefined
- Option<T> 

### false
example
```ts
[1, 2, 3].filterMap((value) => {
    if(value === 1) retrun false // filter signal
    return `Value: ${value}` 
})
```

**pros**
- in std

**cons**
- clunky

### null
example
```ts
[1, 2, 3].filterMap((value) => {
    if(value === 1) retrun null // filter signal
    return `Value: ${value}` 
})
```

**pros**
- in std
- null feels like an apropriate flag

**cons**
- cannot satisfy edge case if user wants array with null values

### null | undefined
example
```ts
[1, 2, 3].filterMap((value) => {
    if(value === 1) retrun // filter signal
    return `Value: ${value}` 
})
```

**pros**
- in std
- null feels like an apropriate flag
- undefined is part of the language
- no need to return a value of map value is early returned

**cons**
- cannot satisfy edge case if user wants array with null or undefined values
- not returning a value for the filter signal hides the function of the filter

### Option<T>
example
```ts
const None = Symbol("None")

type Option<T> = T | None

[1, 2, 3].filterMap((value) => {
    if(value === 1) retrun None // filter signal
    return `Value: ${value}`
})
```

**pros**
- explicit on what gets filtered or not
- can use any primitive as array value
- unique filter flag symbol

**cons**
- introduces a new paradigm to the language, learning curve
- overhead of Some implementation

## Iterators
- filterMap ✅
- filterFind ✅
- enumerate ✅
- map ✅
- mapWhile
- flatMap ✅
- drop ✅
- dropWhile
- take ✅
- takeWhile
- filter ✅
- collect ✅
- range ✅
- zip ✅
- cycle ✅
- maxBy
- minBy
- forEach ✅
- fold ✅
- reduce ✅

### Numeric Iterators
- sum ✅
- max ✅
- min ✅

### String Iterators
- join

## Enhancements
- Prevent rewrap of already iterup instances ✅
- Only wrap iterup instance methods ✅
- Make range api only inclusive ✅
- look at promiselike for split of sync/async https://github.com/supermacro/neverthrow