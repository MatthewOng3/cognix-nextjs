import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AlertProvider } from "./components/AlertNotif";
import Script from "next/script";
import StoreProvider from "./StoreProvider";
import { ConditionalSupportButton } from "./components/ConditionalSupportButton";
import { envConfig } from "./lib/util/env-config";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
	display: "swap", // Add display swap for better loading
	fallback: ["system-ui", "Arial", "sans-serif"], // Add fallback fonts
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
	display: "swap", // Add display swap for better loading
	fallback: ["ui-monospace", "SFMono-Regular", "Consolas", "monospace"], // Add fallback fonts
});

export const metadata: Metadata = {
	title: "Cognix - AI-Powered Application Builder",
	description: "Build applications with AI assistance",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				{/* Preload fallback fonts */}
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link
					rel="preconnect"
					href="https://fonts.gstatic.com"
					crossOrigin="anonymous"
				/>
				<Script
					id="hotjar"
					strategy="afterInteractive"
					src="https://t.contentsquare.net/uxa/85dec2136988c.js"
				/>
				{
					process.env.NODE_ENV === "production" &&
					<Script
						id="microsoft-clarity"
						strategy="afterInteractive"
					>
						{`(function(c,l,a,r,i,t,y){
						c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
						t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
						y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
						})(window, document, "clarity", "script", "vbikfnb2od");`}
					</Script>
				}
				
			</head>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
				style={{
					fontFamily: "var(--font-geist-sans), system-ui, Arial, sans-serif",
				}}
			>
				<AlertProvider>
					<StoreProvider>
						{children}
						<ConditionalSupportButton />
					</StoreProvider>
				</AlertProvider>
			</body>
		</html>
	);
}
