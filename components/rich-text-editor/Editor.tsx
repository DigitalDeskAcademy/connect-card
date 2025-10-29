"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Menubar } from "./Menubar";
import TextAlign from "@tiptap/extension-text-align";

/**
 * Rich Text Editor Component
 *
 * Tiptap-based WYSIWYG editor for form fields (react-hook-form Controller).
 * Stores content as JSON string for structured data persistence.
 *
 * @param field - React Hook Form Controller field with string value
 */

interface RichTextEditorProps {
  field: {
    onChange: (value: string) => void;
    value?: string;
  };
}

export function RichTextEditor({ field }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],

    editorProps: {
      attributes: {
        class:
          "min-h-[300px] p-4 focus:outline-none prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert !w-full !max-w-none",
      },
    },

    immediatelyRender: false,

    onUpdate: ({ editor }) => {
      field.onChange(JSON.stringify(editor.getJSON()));
    },

    content: (() => {
      if (!field.value) return "<p></p>";
      try {
        return JSON.parse(field.value);
      } catch {
        return `<p>${field.value}</p>`;
      }
    })(),
  });

  return (
    <div className="w-full border border-input rounded-lg overflow-hidden dark:bg-input/30">
      <Menubar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
