"use client";

import { useMemo } from "react";
import { generateHTML } from "@tiptap/html";
import { type JSONContent } from "@tiptap/react";
import TextAlign from "@tiptap/extension-text-align";
import StarterKit from "@tiptap/starter-kit";
import parse from "html-react-parser";

export function RenderDescription({ json }: { json: JSONContent }) {
  const output = useMemo(() => {
    return generateHTML(json, [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ]);
  }, [json]);

  return (
    <div className="prose dark:prose-invert prose-li:marker:text-primary [&_ul]:space-y-1 [&_li]:my-0 [&_li_p]:my-0 [&_li_p]:leading-relaxed">
      {parse(output)}
    </div>
  );
}
