import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/app/lib/util/supabase/server";
import { withAuth } from "@/app/lib/api/withAuth";
import { Resend } from 'resend';
import { envConfig } from "@/app/lib/util/env-config";
const resend = new Resend(envConfig.resendKey);

const supabase = createSupabaseAdminClient();

/**
 * @description Create a new support request
 * @param request
 * @returns
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    // Get the current user
    // const {
    //   data: { user },
    // } = await supabase.auth.getUser();

    // Parse the form data
    const formData = await request.formData();
	const email = formData.get("userEmail") as string;
    const type = formData.get("type") as string;
    const description = formData.get("description") as string;
    //const userEmail = formData.get("userEmail") as string;
    const userId = formData.get("userId") as string;

    // Validate required fields
    if (!type || !description) {
      return NextResponse.json(
        { error: "Type and description are required" },
        { status: 400 },
      );
    }

    // Handle image uploads
    // const images: string[] = [];
    // const imageFiles = [];

    // // Collect all image files
    // for (const [key, value] of formData.entries()) {
    // 	if (key.startsWith("image-") && value instanceof File) {
    // 		imageFiles.push(value);
    // 	}
    // }

    // // Upload images to Supabase Storage (if you have it configured)
    // if (imageFiles.length > 0) {
    // 	try {
    // 		for (const file of imageFiles) {
    // 		const fileName = `support/${Date.now()}-${file.name}`;

    // 		const { data, error } = await supabase.storage
    // 			.from("support-images") // You'll need to create this bucket
    // 			.upload(fileName, file);

    // 		if (error) {
    // 			console.error("Error uploading image:", error);
    // 		} else {
    // 			// Get the public URL
    // 			const { data: urlData } = supabase.storage
    // 			.from("support-images")
    // 			.getPublicUrl(fileName);

    // 			images.push(urlData.publicUrl);
    // 		}
    // 	}
    // } catch (error) {
    // 	console.error("Error handling image uploads:", error);
    // 	// Continue without images if upload fails
    // }
    // }

    // Store the support request in your database
    const { data, error } = await supabase
      .from("support")
      .insert({
        user_id: userId,
        request_type: type,
        content: description,
        status: "Pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting support request:", error);
      return NextResponse.json(
        { error: "Failed to save support request" },
        { status: 500 },
      );
    }

	//Send support email to me
	const resendResponse = resend.emails.send({
		from: 'onboarding@resend.dev',
		to: 'matthewong1998@gmail.com',
		subject: `Cognix Support - ${email}`,
		html: `
			<h2>New Support Request</h2>
			<p><strong>Type:</strong> ${type}</p>
			<p><strong>User Email:</strong> ${email}</p>
			<p><strong>Support ID:</strong> ${data.support_id}</p>
			<hr />
			<p><strong>Description:</strong></p>
			<p>${description.replace(/\n/g, "<br />")}</p>
			`
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
      message: "Support request submitted successfully",
      data: data,
    });
  } catch (error) {
    console.error("Error in support API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
})
