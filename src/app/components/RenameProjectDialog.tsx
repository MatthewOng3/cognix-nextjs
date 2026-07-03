"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { useProject } from "../hooks/use-project";
import { useAlert } from "./AlertNotif";
import { Loader2 } from "lucide-react";

interface RenameProjectDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    currentName: string;
}

export function RenameProjectDialog({
    isOpen,
    onOpenChange,
    projectId,
    currentName,
}: RenameProjectDialogProps) {
    const [name, setName] = useState(currentName);
    const [isLoading, setIsLoading] = useState(false);
    const { setCurrentProject, projectList, fetchProjectInfo } = useProject();
    const { showAlert } = useAlert();

    useEffect(() => {
        if (isOpen) {
            setName(currentName);
        }
    }, [isOpen, currentName]);

    const handleSave = async () => {
        if (!name.trim()) {
            showAlert("Project name cannot be empty", "error");
            return;
        }

        if (name === currentName) {
            onOpenChange(false);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch("/api/projects/update_name", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    projectId,
                    newProjectName: name.trim(),
                }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || "Failed to update project name");
            }

            showAlert("Project renamed successfully!", "success");

            // Refresh project data to update state
            await fetchProjectInfo(projectId);

            onOpenChange(false);
        } catch (error) {
            console.error("Error renaming project:", error);
            showAlert(error instanceof Error ? error.message : "Failed to rename project", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Rename Project</DialogTitle>
                    <DialogDescription>
                        Enter a new name for your project. This will also update your repository name and preview URL.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                            disabled={isLoading}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
