import { expect, test, describe } from "bun:test";
import { iterup, None } from "./main";
import { isIterup } from "./utils";

describe("filterMap", () => {
  test("should filter values", async () => {
    const collection = iterup([10, 2, 30]);
    const result = await collection
      .filterMap((value) => (value >= 10 ? value : None))
      .collect();
    expect(result).toHaveLength(2);
    expect(result).toEqual([10, 30]);
  });

  test("should map non filtered values", async () => {
    const collection = iterup([10, 2, 30]);
    const result = await collection
      .filterMap((value) => (value === 10 ? "Its a 10" : None))
      .collect();
    expect(result).toEqual(["Its a 10"]);
  });

  test("should support async transformation functions", async () => {
    const collection = iterup([1, 2, 3, 4]);
    const result = await collection
      .filterMap(async (value) => {
        await new Promise((resolve) => setTimeout(resolve, 1)); // Simulate async work
        return value % 2 === 0 ? `Even: ${value}` : None;
      })
      .collect();
    expect(result).toEqual(["Even: 2", "Even: 4"]);
  });
});

describe("findMap", () => {
  test("should return undefined if no value found", async () => {
    const collection = iterup([10, 2, 30]);
    const result = await collection.findMap((value) =>
      value < 0 ? value : None
    );
    expect(result).toBeUndefined();
  });

  test("should return mapped value", async () => {
    const collection = iterup([10, 2, 30]);
    const result = await collection.findMap((value) =>
      value === 10 ? "Its a 10" : None
    );
    expect(result).toBe("Its a 10");
  });

  test("should support async transformation functions", async () => {
    const collection = iterup([1, 3, 5, 2, 4]);
    const result = await collection.findMap(async (value) => {
      await new Promise((resolve) => setTimeout(resolve, 1)); // Simulate async work
      return value % 2 === 0 ? `First even: ${value}` : None;
    });
    expect(result).toBe("First even: 2");
  });

  test("should stop at first match", async () => {
    let callCount = 0;
    const collection = iterup([1, 2, 3, 4, 5]);
    await collection.findMap((value) => {
      callCount++;
      return value === 2 ? "found" : None;
    });
    expect(callCount).toBe(2); // Should only call function twice
  });
});

describe("enumerate", () => {
  test("should return array with index starting at 0", async () => {
    const result = await iterup([1, 2, 3])
      .enumerate()
      .map(([, index]) => index)
      .collect();
    expect(result).toEqual([0, 1, 2]);
  });

  test("should preserve values with indices", async () => {
    const result = await iterup(["a", "b", "c"]).enumerate().collect();
    expect(result).toEqual([
      ["a", 0],
      ["b", 1],
      ["c", 2],
    ]);
  });
});

describe("map", () => {
  test("should transform all values", async () => {
    const result = await iterup([1, 2, 3])
      .map((x) => x * 2)
      .collect();
    expect(result).toEqual([2, 4, 6]);
  });

  test("should support async transformation functions", async () => {
    const result = await iterup([1, 2, 3])
      .map(async (x) => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return x * 2;
      })
      .collect();
    expect(result).toEqual([2, 4, 6]);
  });
});

describe("flatMap", () => {
  test("should flatten mapped results", async () => {
    const result = await iterup([1, 2, 3])
      .flatMap((x) => [x, x * 10])
      .collect();
    expect(result).toEqual([1, 10, 2, 20, 3, 30]);
  });

  test("should work with strings", async () => {
    const result = await iterup(["hello", "world"])
      .flatMap((word) => word.split(""))
      .collect();
    expect(result).toEqual(["h", "e", "l", "l", "o", "w", "o", "r", "l", "d"]);
  });

  test("should support async transformation functions", async () => {
    const result = await iterup([1, 2])
      .flatMap(async (x) => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return [x, x + 10];
      })
      .collect();
    expect(result).toEqual([1, 11, 2, 12]);
  });
});

describe("take", () => {
  test("should take specified number of elements", async () => {
    const result = await iterup([1, 2, 3, 4, 5]).take(3).collect();
    expect(result).toEqual([1, 2, 3]);
  });

  test("should handle taking more than available", async () => {
    const result = await iterup([1, 2]).take(5).collect();
    expect(result).toEqual([1, 2]);
  });

  test("should handle taking zero elements", async () => {
    const result = await iterup([1, 2, 3]).take(0).collect();
    expect(result).toEqual([]);
  });
});

describe("drop", () => {
  test("should drop specified number of elements", async () => {
    const result = await iterup([1, 2, 3, 4, 5]).drop(2).collect();
    expect(result).toEqual([3, 4, 5]);
  });

  test("should handle dropping more than available", async () => {
    const result = await iterup([1, 2]).drop(5).collect();
    expect(result).toEqual([]);
  });

  test("should handle dropping zero elements", async () => {
    const result = await iterup([1, 2, 3]).drop(0).collect();
    expect(result).toEqual([1, 2, 3]);
  });
});

describe("collect", () => {
  test("should materialize all values", async () => {
    const result = await iterup([1, 2, 3, 4, 5])
      .map((x) => x * 2)
      .collect();
    expect(result).toEqual([2, 4, 6, 8, 10]);
  });

  test("should work with empty iterators", async () => {
    const result = await iterup([] as number[])
      .map((x) => x)
      .collect();
    expect(result).toEqual([]);
  });
});

describe("chaining operations", () => {
  test("should support complex operation chains", async () => {
    const result = await iterup([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      .filterMap((n) => (n % 2 === 0 ? n : None)) // Keep even numbers: [2, 4, 6, 8, 10]
      .map((n) => n * 2) // Double them: [4, 8, 12, 16, 20]
      .drop(1) // Drop first: [8, 12, 16, 20]
      .take(2) // Take first 2: [8, 12]
      .collect();
    expect(result).toEqual([8, 12]);
  });

  test("should maintain lazy evaluation", async () => {
    let mapCallCount = 0;
    const result = await iterup([1, 2, 3, 4, 5])
      .map((x) => {
        mapCallCount++;
        return x * 2;
      })
      .take(2) // Should only process first 2 elements
      .collect();

    expect(result).toEqual([2, 4]);
    expect(mapCallCount).toBe(2); // Should only call map twice due to take(2)
  });
});

describe("async iterator support", () => {
  test("should work with async generators", async () => {
    const asyncGen = async function* () {
      for (let i = 1; i <= 3; i++) {
        yield await Promise.resolve(i);
      }
      return undefined;
    };

    const result = await iterup(asyncGen())
      .map((x) => x * 2)
      .collect();
    expect(result).toEqual([2, 4, 6]);
  });

  test("should work with mixed async/sync operations", async () => {
    const asyncGen = async function* () {
      yield 1;
      yield 2;
      yield 3;
      return undefined;
    };

    const result = await iterup(asyncGen())
      .filterMap(async (x) => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return x % 2 === 1 ? x * 10 : None;
      })
      .collect();
    expect(result).toEqual([10, 30]);
  });
});

describe("type guards", () => {
  test("map should return iterup instance", () => {
    const collection = iterup([10, 2, 30]);
    expect(isIterup(collection.map((value) => value))).toBeTrue();
  });

  test("flatMap should return iterup instance", () => {
    const collection = iterup([10, undefined, 30]);
    expect(
      isIterup(collection.flatMap((value) => ["Value" + value]))
    ).toBeTrue();
  });

  test("filterMap should return iterup instance", () => {
    const collection = iterup([1, 2, 3]);
    expect(isIterup(collection.filterMap((value) => value))).toBeTrue();
  });

  test("enumerate should return iterup instance", () => {
    const collection = iterup([1, 2, 3]);
    expect(isIterup(collection.enumerate())).toBeTrue();
  });
});

describe("range", () => {
  test("should return an instance of given range value", async () => {
    const collection = await iterup({ from: 10 }).take(5).collect();

    expect(collection).toEqual([10, 11, 12, 13, 14]);
  });
});

describe("cycle", () => {
  test("should repeat the iterator", async () => {
    const collection = await iterup({ from: 1, to: 2 })
      .map((value) => `value: ${value}`)
      .cycle()
      .take(6)
      .collect();

    expect(collection).toEqual([
      `value: 1`,
      `value: 2`,
      `value: 1`,
      `value: 2`,
      `value: 1`,
      `value: 2`,
    ]);
  });

  test("should repeat the iterator x amount", async () => {
    const collection = await iterup({ from: 1, to: 2 })
      .map((value) => `value: ${value}`)
      .cycle(2)
      .collect();

    expect(collection).toEqual([
      `value: 1`,
      `value: 2`,
      `value: 1`,
      `value: 2`,
    ]);
  });

  test("should maintain lazy evaluation", async () => {
    let mapCallCount = 0;
    const collection = await iterup({ from: 1, to: 3 })
      .map((value) => {
        mapCallCount += 1;
        return `value: ${value}`;
      })
      .cycle()
      .take(2)
      .collect();

    expect(collection).toEqual([`value: 1`, `value: 2`]);
    expect(mapCallCount).toEqual(2);
  });

  test("should cache the cycle", async () => {
    let mapCallCount = 0;
    await iterup({ from: 1, to: 3 })
      .map((value) => {
        mapCallCount += 1;
        return `value: ${value}`;
      })
      .cycle(2)
      .collect();

    expect(mapCallCount).toEqual(3);
  });

  test("should handle zero cycles", async () => {
    const collection = await iterup({ from: 1, to: 2 })
      .map((value) => `value: ${value}`)
      .cycle(0)
      .collect();

    expect(collection).toEqual([]);
  });

  test("should handle negative cycles", async () => {
    const collection = await iterup({ from: 1, to: 2 })
      .map((value) => `value: ${value}`)
      .cycle(-1)
      .collect();

    expect(collection).toEqual([]);
  });
});

describe("zip", () => {
  test("should combine two iterators", async () => {
    const combined = await iterup([1, 2, 3]).zip([3, 2, 1]).collect();
    expect(combined).toEqual([
      [1, 3],
      [2, 2],
      [3, 1],
    ]);
  });

  test("should return early if source iterator is shorter", async () => {
    const combined = await iterup([1, 2]).zip([3, 2, 1]).collect();
    expect(combined).toEqual([
      [1, 3],
      [2, 2],
    ]);
  });

  test("should return early if given iterator is shorter", async () => {
    const combined = await iterup([1, 2, 3]).zip([2, 1]).collect();
    expect(combined).toEqual([
      [1, 2],
      [2, 1],
    ]);
  });
});

describe("numeric instance", () => {
  describe("sum", () => {
    test("should sum a numeric iterator", async () => {
      const actual = await iterup({ from: 1 })
        .take(3)
        .map(() => 10)
        .sum();
      expect(actual).toEqual(30);
    });

    test("should throw error for non numeric iterator", async () => {
      const actual = (
        iterup({ from: 1 })
          .take(3)
          .map(() => "Ten") as any
      ).sum();
      expect(actual).rejects.toThrowError(TypeError);
    });
  });

  describe("min", () => {
    test("should return the minimum value from an iterator", async () => {
      const actual = await iterup([5, 4, 2, 0, -10, 890]).min();
      expect(actual).toEqual(-10);
    });

    test("should throw error for non numeric iterator", async () => {
      const actual = (
        iterup({ from: 1 })
          .take(3)
          .map(() => "Ten") as any
      ).min();
      expect(actual).rejects.toThrowError(TypeError);
    });
  });

  describe("max", () => {
    test("should return the maximum value from an iterator", async () => {
      const actual = await iterup([5, 4, 2, 890, 0, -10]).max();
      expect(actual).toEqual(890);
    });

    test("should throw error for non numeric iterator", async () => {
      const actual = (
        iterup({ from: 1 })
          .take(3)
          .map(() => "Ten") as any
      ).max();
      expect(actual).rejects.toThrowError(TypeError);
    });
  });
});
