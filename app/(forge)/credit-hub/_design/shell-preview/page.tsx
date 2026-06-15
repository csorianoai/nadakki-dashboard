import { notFound } from "next/navigation";
import { ShellPreviewClient } from "./ShellPreviewClient";

export default function ShellPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <ShellPreviewClient />;
}
