import { fileToBase64 } from "@/lib/customer/upload/fileToBase64";

describe("fileToBase64", () => {
  test("encodes file to base64", async () => {
    const f = new File(["hola"], "x.txt", { type: "text/plain" });
    const b64 = await fileToBase64(f);
    expect(b64).toBe(Buffer.from("hola", "utf8").toString("base64"));
  });
});
