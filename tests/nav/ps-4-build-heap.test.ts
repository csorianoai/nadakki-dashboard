import pkg from "../../package.json";

// El `next build` de CI murió con "JavaScript heap out of memory" (~1,5 GB, límite por defecto de V8).
describe("PS-4: build con heap suficiente", () => {
  it.each(["build", "build:webpack"])("%s fija --max-old-space-size >= 4096", (name) => {
    const cmd = (pkg.scripts as Record<string, string>)[name];
    const m = /--max-old-space-size=(\d+)/.exec(cmd);
    expect(m).not.toBeNull();
    expect(Number(m![1])).toBeGreaterThanOrEqual(4096);
  });
});
