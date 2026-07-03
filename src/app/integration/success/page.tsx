"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef } from "react";


/**
 * @description Success page redirected to after oauth connection is completed, currently just 
 * for supabase but plan is to make this dynamic in the future. 
 * @returns 
 */
function OAuthSuccessPageContent() {
	const searchParams = useSearchParams();
	const name = searchParams.get("integrationName");
	const threadId = searchParams.get("threadId");
	const hasRun = useRef(false);
  
	const oauthCompletionHandler = useCallback(async () => {
	  try {
		const aiMessage = "Thanks for completing the integration! Continue writing code..";
		const channel = new BroadcastChannel("cognix-integration");
		channel.postMessage({
		  type: "integration_complete",
		  threadId,
		  message: aiMessage,
		});
		channel.close();
		hasRun.current = true;
	  } catch (err) {
		console.error(err);
	  }
	}, [threadId]);
  
	useEffect(() => {
	  if (!hasRun.current) {
		oauthCompletionHandler();
	  }
	}, [oauthCompletionHandler]);
  
	return (
	  <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/50">
		<h2 className="text-lg font-semibold">{name} Integrated!</h2>
		<p>You can now close this window and return back to Cognix.</p>
	  </div>
	);
  }
  
export default function OAuthSuccessPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
		<OAuthSuccessPageContent />
		</Suspense>
	);
}