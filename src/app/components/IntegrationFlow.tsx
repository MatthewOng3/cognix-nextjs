"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { CheckCircle, ExternalLink, ArrowLeft, ArrowRight } from "lucide-react";
import type { IntegrationComponentProps, IntegrationStep } from "../lib/util/types/integration";

export default function IntegrationFlow({
  flow,
  currentStep,
  stepIndex,
  totalSteps,
  onNext,
  onBack,
  onComplete,
  onCancel,
}: IntegrationComponentProps) {
  // const [stepData, setStepData] = useState<Record<string, unknown>>({});
  // const [isLoading, setIsLoading] = useState(false);

  // const progress = ((stepIndex + 1) / totalSteps) * 100;

  // const handleNext = async () => {
  //   setIsLoading(true);
  //   try {
  //     await onNext(stepData);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const handleComplete = async () => {
  //   setIsLoading(true);
  //   try {
  //     await onComplete(stepData);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const renderStepContent = (step: IntegrationStep) => {
  //   switch (step.type) {
  //     case "auth":
  //       return (
  //         <div className="space-y-4">
  //           <p className="text-sm text-muted-foreground">{step.description}</p>
  //           {/* {step.data?.url && (
  //             <Button
  //               onClick={() => window.open(step.data.url as string, "_blank")}
  //               className="w-full"
  //               variant="default"
  //             >
  //               <ExternalLink className="w-4 h-4 mr-2" />
  //               {step.data.action === "signup" ? "Sign Up" : "Sign In"}
  //             </Button>
  //           )} */}
  //           {step.data?.action === "oauth" && (
  //             <Button
  //               onClick={() => {
  //                 // Handle OAuth flow
  //                 setStepData({ ...stepData, oauthInitiated: true });
  //               }}
  //               className="w-full"
  //               variant="default"
  //             >
  //               Connect {step.data.provider}
  //             </Button>
  //           )}
  //           {step.data?.action === "get_key" && (
  //             <Button
  //               onClick={() => window.open(step.data.url as string, "_blank")}
  //               className="w-full"
  //               variant="default"
  //             >
  //               Get API Key
  //             </Button>
  //           )}
  //         </div>
  //       );

  //     case "config":
  //       return (
  //         <div className="space-y-4">
  //           <p className="text-sm text-muted-foreground">{step.description}</p>
  //           {step.data?.instructions && (
  //             <div className="space-y-2">
  //               <h4 className="font-medium">Instructions:</h4>
  //               <ol className="list-decimal list-inside space-y-1 text-sm">
  //                 {(step.data.instructions as string[]).map((instruction, idx) => (
  //                   <li key={idx} className="text-muted-foreground">
  //                     {instruction}
  //                   </li>
  //                 ))}
  //               </ol>
  //             </div>
  //           )}
  //           <div className="space-y-2">
  //             <label className="text-sm font-medium">Configuration Data:</label>
  //             <textarea
  //               className="w-full p-2 border rounded-md"
  //               placeholder="Paste your configuration data here..."
  //               value={(stepData[step.id] as string) || ""}
  //               onChange={(e) =>
  //                 setStepData({ ...stepData, [step.id]: e.target.value })
  //               }
  //               rows={4}
  //             />
  //           </div>
  //         </div>
  //       );

  //     case "test":
  //       return (
  //         <div className="space-y-4">
  //           <p className="text-sm text-muted-foreground">{step.description}</p>
  //           <Button
  //             onClick={() => {
  //               setStepData({ ...stepData, [step.id]: "tested" });
  //             }}
  //             className="w-full"
  //             variant="outline"
  //           >
  //             Run Test
  //           </Button>
  //         </div>
  //       );

  //     case "complete":
  //       return (
  //         <div className="space-y-4 text-center">
  //           <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
  //           <h3 className="text-lg font-semibold">Integration Complete!</h3>
  //           <p className="text-sm text-muted-foreground">{step.description}</p>
  //         </div>
  //       );

  //     default:
  //       return <p className="text-sm text-muted-foreground">{step.description}</p>;
  //   }
  // };

  // const canProceed = () => {
  //   if (currentStep.type === "complete") return true;
  //   if (currentStep.required && !stepData[currentStep.id]) return false;
  //   return true;
  // };

  // const isLastStep = stepIndex === totalSteps - 1;

  // return (
  //   <Card className="w-full max-w-2xl mx-auto">
  //     <CardHeader>
  //       <div className="flex items-center justify-between">
  //         <div className="flex items-center space-x-2">
  //           <span className="text-2xl">{flow.icon}</span>
  //           <div>
  //             <CardTitle className="text-lg">{flow.name}</CardTitle>
  //             <p className="text-sm text-muted-foreground">{flow.description}</p>
  //           </div>
  //         </div>
  //         <Badge variant="outline">{flow.category}</Badge>
  //       </div>
        
  //       <div className="space-y-2">
  //         <div className="flex justify-between text-sm">
  //           <span>Step {stepIndex + 1} of {totalSteps}</span>
  //           <span className="text-muted-foreground">{flow.estimatedTime}</span>
  //         </div>
  //         <Progress value={progress} className="h-2" />
  //       </div>
  //     </CardHeader>

  //     <CardContent className="space-y-6">
  //       <div>
  //         <h3 className="font-semibold mb-2">{currentStep.title}</h3>
  //         {renderStepContent(currentStep)}
  //       </div>

  //       <div className="flex justify-between">
  //         <Button
  //           variant="outline"
  //           onClick={stepIndex > 0 ? onBack : onCancel}
  //           disabled={isLoading}
  //         >
  //           <ArrowLeft className="w-4 h-4 mr-2" />
  //           {stepIndex > 0 ? "Back" : "Cancel"}
  //         </Button>

  //         {isLastStep ? (
  //           <Button
  //             onClick={handleComplete}
  //             disabled={!canProceed() || isLoading}
  //             className="bg-green-600 hover:bg-green-700"
  //           >
  //             {isLoading ? "Completing..." : "Complete Integration"}
  //           </Button>
  //         ) : (
  //           <Button
  //             onClick={handleNext}
  //             disabled={!canProceed() || isLoading}
  //           >
  //             {isLoading ? "Processing..." : "Next"}
  //             <ArrowRight className="w-4 h-4 ml-2" />
  //           </Button>
  //         )}
  //       </div>
  //     </CardContent>
  //   </Card>
  return(
    <div>
      
    </div>
  )
 
}
