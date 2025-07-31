import { expect, test, describe } from "bun:test";
import { isIterup, iterup, None } from "./main";

describe("filterMap", () => {
  test("should filter values", () => {
    const collection = iterup([10, 2, 30]);
    expect(
      collection.filterMap((value) => (value >= 10 ? value : None)).collect()
        .length
    ).toBe(2);
  });

  test("should map non filtered values", () => {
    const collection = iterup([10, 2, 30]);

    expect(
      collection
        .filterMap((value) => (value === 10 ? "Its a 10" : None))
        .collect()
    ).toEqual(["Its a 10"]);
  });
});

describe("findMap", () => {
  test("should return undefined if no value found", () => {
    const collection = iterup([10, 2, 30]);
    expect(
      collection.findMap((value) => (value < 0 ? value : None))
    ).toBeUndefined();
  });

  test("should returned mapped value", () => {
    const collection = iterup([10, 2, 30]);

    expect(
      collection.findMap((value) => (value === 10 ? "Its a 10" : None))
    ).toBe("Its a 10");
  });
});

describe("enumerate", () => {
  test("should return array with index starting at 0", () => {
    const collection = iterup([1, 2, 3])
      .enumerate()
      .map(([, index]) => index)
      .collect();
    expect(collection).toEqual([0, 1, 2]);
  });
});

describe("overriden", () => {
  test("map should return iterup instance", () => {
    const collection = iterup([10, 2, 30]);
    expect(isIterup(collection.map((value) => value))).toBeTrue();
  });

  test("filter should return iterup instance", () => {
    const collection = iterup([10, undefined, 30]);
    expect(
      isIterup(collection.filter((value) => value !== undefined))
    ).toBeTrue();
  });

  test("flatMap should return iterup instance", () => {
    const collection = iterup([10, undefined, 30]);
    expect(
      isIterup(collection.flatMap((value) => ["Value" + value]))
    ).toBeTrue();
  });
});
