import fs from "fs";
import path from "path";

const source = fs.readFileSync(
  path.resolve(__dirname, "..", "..", "components", "activation", "CredentialVaultView.tsx"),
  "utf8"
);

describe("CredentialVault API contract", () => {
  test("consumes the array returned by the credentials endpoint", () => {
    expect(source).toContain("Promise<Credential[]>");
    expect(source).not.toContain("data.credentials");
    expect(source).toContain("data.length");
    expect(source).toContain("data.map((cred)");
  });
});
