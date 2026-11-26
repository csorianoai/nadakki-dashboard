import { readFileSync } from "fs";
import { join } from "path";

test("la barra del portal no muestra un avatar fijo de un usuario inventado", () => {
  const src = readFileSync(join(process.cwd(), "components/nav/TopNav.tsx"), "utf8");
  expect(src).not.toMatch(/Usuario JR|>\s*JR\s*</);
});
