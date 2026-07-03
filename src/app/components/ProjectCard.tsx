"use client";

import { Activity, Calendar, MoreVertical, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";

interface ProjectCardProps {
  id: string;
  name: string;
  description: string;
  lastModified: string;
  status: "Active" | "Draft";
  collaborators: number;
}

/**
 * @description Project card component in projects page, represents a project
 * @param id - The project id
 * @param name - The project name
 * @param description - The project description
 * @param lastModified - The last modified date
 * @param status - The project status
 * @param collaborators - The number of collaborators
 * @returns The project card component
 */
export default function ProjectCard({
  id,
  name,
  description,
  lastModified,
  status,
  collaborators,
}: ProjectCardProps) {
  const statusColors = {
    Active: "bg-green-500/20 text-green-400 border-green-500/30",
    Draft: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    Deployed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  return (
    <Link href={`/project/${id}/build`} className="block">
      <Card className="hover-scale cursor-pointer group border-border hover:border-accent/50 transition-aall duration-300 hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                {name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {description}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{lastModified}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{collaborators}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent" />
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[status]}`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
