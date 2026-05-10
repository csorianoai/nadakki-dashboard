import {
  __resetWarnOnceForCallerForTests,
  warnOnceForCaller,
} from "@/lib/credit-hub/utils/warnOnceForCaller";

describe("warnOnceForCaller", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let warnSpy: jest.SpyInstance<void, Parameters<typeof console.warn>>;

  beforeEach(() => {
    __resetWarnOnceForCallerForTests();
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
    // Direct assignment is the only reliable way to update process.env in
    // jest. Object.defineProperty does not consistently update the value
    // that subsequent reads of process.env.NODE_ENV observe.
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("warns once per call site in dev", () => {
    process.env.NODE_ENV = "development";

    // The fingerprint includes file:LINE:COL of the frame that invokes
    // warnOnceForCaller. To force "same call site" we wrap the invocation
    // in a single arrow function and call THAT wrapper three times — the
    // wrapper's `warnOnceForCaller(...)` line is the immediate caller, so
    // all three invocations resolve to the same fingerprint.
    const callFromSameLine = () => warnOnceForCaller("dep-msg");
    callFromSameLine();
    callFromSameLine();
    callFromSameLine();

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith("dep-msg");
  });

  it("warns multiple times when called from different sites", () => {
    process.env.NODE_ENV = "development";

    // Two distinct caller wrappers → two distinct stack frames → two warns.
    const fromSiteA = () => warnOnceForCaller("dep-msg");
    const fromSiteB = () => warnOnceForCaller("dep-msg");

    fromSiteA();
    fromSiteA(); // dedup
    fromSiteB();
    fromSiteB(); // dedup

    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it("does not warn in production", () => {
    process.env.NODE_ENV = "production";

    warnOnceForCaller("dep-msg");
    warnOnceForCaller("dep-msg");

    expect(warnSpy).not.toHaveBeenCalled();
  });
});
