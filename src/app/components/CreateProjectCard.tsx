"use client";

import { Plus } from "lucide-react";
import * as React from "react";
import { Card, CardContent } from "./ui/card";

type Props = {
  setModalState: () => void;
};

export function CreateProjectCard({ setModalState }: Props) {
  return (
    <Card
      className="border-2 border-dashed border-accent/30 hover:border-accent/60 cursor-pointer group transition-all duration-300 hover:bg-accent/5"
      onClick={setModalState}
    >
      <CardContent className="flex flex-col items-center justify-center p-8 min-h-[200px]">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-accent/40 group-hover:border-accent/70 flex items-center justify-center mb-4 transition-colors">
          <Plus className="w-8 h-8 text-accent" />
        </div>

        <h3 className="font-semibold bg-gradient-to-r from-orange-400 to-yellow-300 text-transparent bg-clip-text transition-colors mb-2">
          Create New Project
        </h3>


        <p className="text-sm text-muted-foreground text-center">
          Start building your next application with AI assistance
        </p>
      </CardContent>
    </Card>
  );
}
