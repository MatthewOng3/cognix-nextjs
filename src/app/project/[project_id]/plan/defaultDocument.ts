// src/app/project/[project_id]/plan/defaultDocument.ts
import { type Block } from "@blocknote/core";

export const defaultDocument = [
	{
	  id: "initial",
	  type: "paragraph",
	  props: {
		backgroundColor: "default",
		textColor: "default",
		textAlignment: "left",
	  },
	  content: [
		{
		  type: "text",
		  text: "",
		  styles: {
			bold: true
		  },
		},
	  ],
	},
  ] as unknown as Block[]; // ✅ bypass TypeScript strict typing
