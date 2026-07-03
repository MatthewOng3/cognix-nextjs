"use client";

import { type Block, BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import React from "react";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import "@/app/lib/styles/blocknote.css";

type EditorProps = {
  initialContent?: Block[];
  //onChange?: (blocks: Block[]) => void;
  className?: string;
};

/**
 *
 * @param param0
 * @returns
 */
export default function Editor({
  initialContent = [],
  className,
}: EditorProps) {
  const editor = React.useMemo(() => {
    //If initial content arg is undefined , don't create editor instance until it is undefined
    if (initialContent === undefined) return undefined;

    //Else create editor with initial content
    return BlockNoteEditor.create({ initialContent });
  }, [initialContent]);

  return (
    <div className={className}>
      {editor && <BlockNoteView editor={editor} className="w-full h-full" />}
    </div>
  );
}
