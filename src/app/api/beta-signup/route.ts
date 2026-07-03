import { type NextRequest, NextResponse } from "next/server";
import { envConfig, getConfig } from "@/app/lib/util/env-config";
import { validateAndSanitizeEmail } from "@/app/lib/util/email-validation";
import { Resend } from 'resend';
const resend = new Resend(envConfig.resendKey);


/**
 * @description Handle beta signup email notification via SendGrid
 * @param request
 * @returns
 */
export async function POST(request: NextRequest) {
  try {
 
    const { email } = await request.json();

    // Validate that email exists and is a string
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 },
      );
    }

    // Validate SendGrid configuration
    if (!envConfig.sendgridKey) {
        console.error("SendGrid API key is not configured");
        return NextResponse.json(
            { error: "Email service is not configured" },
            { status: 500 },
        );
    }
    

    const resendResponse = resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'matthewong1998@gmail.com',
      subject: `Cognix Beta Signup - ${email}`,
      html: `<p>Sign up requested from Cognix Landing page for: ${email}</p>`
    });

    //Create contact in resend
    const { data, error } = await resend.contacts.create({
      email: email,
      unsubscribed: false,
    });

    if (error) {
      console.error("Resend API Error: ", error);
      return NextResponse.json(
        { error: "Failed to send email notification" },
        { status: 500 },
      );
    }
    
    return NextResponse.json({
      success: true,
      message: "Beta signup notification sent successfully",
    });
  } catch (error) {
    console.error("Error in beta signup API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

