/** @jest-environment jsdom */

import { decodeJwtTid } from "@/lib/bank-queue/jwt";
import { makeJwt, TEST_TID } from "./test-utils";

describe("decodeJwtTid", () => {
  it("reads tid claim", () => {
    expect(decodeJwtTid(makeJwt(TEST_TID))).toBe(TEST_TID);
  });

  it("returns null on malformed token", () => {
    expect(decodeJwtTid("not-a-jwt")).toBeNull();
  });
});
