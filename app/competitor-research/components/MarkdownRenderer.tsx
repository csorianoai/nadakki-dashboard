"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="max-w-none text-sm leading-relaxed text-slate-200 [&_a]:text-cyan-400 [&_a]:underline [&_code]:rounded [&_code]:bg-slate-800 [&_code]:px-1 [&_h1]:my-2 [&_h2]:my-2 [&_li]:my-0.5 [&_p]:my-2 [&_ul]:my-2 [&_ul]:pl-4">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
