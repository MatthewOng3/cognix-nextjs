"use client";
import Image from "next/image";
import * as React from "react";
import { useEffect, useState } from "react";
import { LoadingOverlay } from "@/app/components/loading-overlay";
import { ApiResponse } from "@/app/lib/util/types/api";
import { useProject } from "@/app/hooks/use-project";

export type IntegrationResponse = {
    integrationId: string;
    serviceName: string;
    category: string;
    iconPath: string;
    description: string;
    serviceProjectId: string;
    serviceDashboardUrl: string;
}

// Dummy API call (simulated backend)
async function fetchProjectIntegrations(projectId: string): Promise<IntegrationResponse[]> {
    try {
        const response = await fetch(`/api/integrations?projectId=${projectId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
    
        if (!response.ok) {
          throw new Error(`Failed to fetch integrations: ${response.statusText}`);
        }
    
        const data: ApiResponse<IntegrationResponse[]> = await response.json();
        return data.data || [];
      } catch (error) {
        console.error("Error fetching integrations:", error);
        return []; // fallback: empty list
      }
}

/**
 * @description Integration Page where users can see their integrations and manage them. 
 * @route project/[project_id]/integration
 */
function IntegrationPage() {
    const [integrations, setIntegrations] = useState<IntegrationResponse[]>([]);
    const [loading, setLoading] = useState(false);
    // Get project state using custom hook
    const { activeProject } = useProject();
    
    useEffect(() => {
        async function loadData() {
 
            if (!activeProject?.projectId) return; // wait until loaded

            setLoading(true);
            const data = await fetchProjectIntegrations(activeProject.projectId);
            setIntegrations(data);  
            setLoading(false);
        }

        loadData();
    }, [activeProject?.projectId]);
    
    return (
        <div className="h-full flex">
            <div className="w-full flex flex-col h-full">
                <div className="p-6 border-border flex-shrink-0">
                    <h1 className="text-xl font-semibold text-foreground mb-2">
                        Integrations
                    </h1>
                </div>

                <div className="w-full p-6 flex-1 rounded-xl flex flex-col min-h-0">
                {loading ? (
                    <LoadingOverlay />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4  ">
                        {integrations.map((integration, index) => (
                        <div
                            key={index}
                            className="border border-gray-700 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition w-9/12"
                        >
                            {/* Left Icon */}
                            <Image
                            src={integration.iconPath}
                            alt={`${integration.serviceName} icon`}
                            width={20}
                            height={20}
                            className="flex-shrink-0"
                            />
                    
                            {/* Right Content */}
                            <div className="flex flex-col justify-between flex-1">
                                <div>
                                    <h2 className="text-lg font-semibold">{integration.serviceName.charAt(0).toUpperCase() + integration.serviceName.slice(1)}</h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                    {integration.description}
                                    </p>
                                </div>
                        
                               
                            </div>
                            <div>
                                {/* Dashboard Button */}
                                <button
                                onClick={() => window.open(integration.serviceDashboardUrl, "_blank")}
                                className="mt-4 px-3 py-1 w-30 bg-gray-800 text-white text-sm rounded transition cursor-pointer"
                                >
                                Dashboard
                                </button>
                            </div>
                        </div>
                        ))}
                    </div>
                
                    )}
                </div>
            </div>
        </div>
    );
}

export default IntegrationPage;
