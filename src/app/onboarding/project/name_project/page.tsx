/* eslint-disable */
"use client";
import DOMPurify from 'dompurify';
import axios from "axios";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LoadingOverlay } from "@/app/components/loading-overlay";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

import { Input } from "@/app/components/ui/input";
import { useOnboarding } from "@/app/hooks/use-onboarding";

import { useUser } from "@/app/hooks/use-user";

import type {
  ApiResponse,
  CreateProjectResponse,
} from "@/app/lib/util/types/api";

/**
 * @description Component mainly used in onboaring flow to name their first project
 * @param
 * @returns Name first project component
 */
export default function NameProject() {
  const pathName = usePathname();
  const [projectName, setProjectName] = useState<string>("");
  const { userId } = useUser();
  const { saveOnboardingState } = useOnboarding();
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * @description Creates a new project on the backend and use returned data in flow state
   *
   */
  async function handleContinue() {
    setLoading(true);
    if (!userId) return;
    //Need to insert new project id to the flow state for other steps to use
    const response = await axios.post(
      "/api/projects",
      {
        userId: userId,
        projectName,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true, // equivalent to fetch's `credentials: "include"`
      },
    );

    const responseData: ApiResponse<CreateProjectResponse> =
      await response.data;

    //Set onboarding state
    saveOnboardingState(pathName, {
      plannerSessionId: responseData.data?.plannerSession.chat_session_id,
      projectId: responseData.data?.project.project_id,
    });
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-center h-screen px-3 bg-gradient-to-br from-[#7e5bef] via-gray-200 to-gray-100">
      <div className="h-10/12  flex w-6/12">
        <div className="flex flex-1 justify-center items-center">
          <Card className="max-w-md shadow-xl w-[400px] h-[250px]">
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                Let's create your first project!
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <Input
                maxLength={100}
                placeholder="e.g. My AI Startup"
                value={projectName}
                onChange={(e) => setProjectName(DOMPurify.sanitize(e.target.value))}
                className="text-base"
              />

              <Button
                className="w-full cursor-pointer"
                onClick={handleContinue}
                disabled={!projectName.trim()}
              >
                Continue
              </Button>
            </CardContent>
          </Card>
          {loading && <LoadingOverlay text="Creating new project.." />}
        </div>
      </div>
    </div>
  );
}
