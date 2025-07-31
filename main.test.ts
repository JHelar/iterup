import { expect, test, describe } from "bun:test";
import { iterup, None } from "./main";

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

describe("filterFind", () => {
  test("should return undefined if no value found", () => {
    const collection = iterup([10, 2, 30]);
    expect(
      collection.filterFind((value) => (value < 0 ? value : None))
    ).toBeUndefined();
  });

  test("should returned mapped value", () => {
    const collection = iterup([10, 2, 30]);

    expect(
      collection.filterFind((value) => (value === 10 ? "Its a 10" : None))
    ).toBe("Its a 10");
  });
});

describe("enumerate", () => {});

describe("overriden", () => {
  test("toArray maps to collect", () => {
    const collection = iterup([10, 2, 30]);
    expect(collection.toArray()).toEqual([10, 2, 30]);
  });

  // test("map should return iterup iterator", () => {
  //   const collection = iterup([10, 2, 30]);
  //   expect(collection.map((value) => value).filterMap).toBeDefined();
  // });
});
