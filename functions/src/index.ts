import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import {MailService} from "@sendgrid/mail";

// Initialize Firebase Admin
admin.initializeApp();

// Initialize SendGrid
const sgMail = new MailService();

export const onUserRoleUpdate = functions.firestore
  .onDocumentUpdated("users/{userId}", async (event) => {
    try {
      // Get SendGrid API key from Firebase config
      const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
      if (!SENDGRID_API_KEY) {
        throw new Error("SendGrid API key is not configured");
      }
      sgMail.setApiKey(SENDGRID_API_KEY);

      if (!event.data) {
        console.log("No event data");
        return;
      }

      const beforeData = event.data.before.data();
      const afterData = event.data.after.data();

      if (!beforeData || !afterData) {
        console.log("No data change detected");
        return;
      }

      // Check if role was changed from Pending to something else
      if (beforeData.role === "Pending" && afterData.role !== "Pending") {
        const userEmail = afterData.email;
        if (!userEmail) {
          console.error("User email not found in data");
          return;
        }

        const msg = {
          to: userEmail,
          from: "ifaieq12@gmail.com",
          subject: "CNB Carpets - Account Activated",
          html: `
            <h1>Welcome to CNB Carpets!</h1>
            <p>Your account has been approved and activated.</p>
            <p>You can now log in to the CNB Carpets app with your email and 
               password.</p>
            <br>
            <p>Best regards,</p>
            <p>The CNB Carpets Team</p>
          `,
        };

        await sgMail.send(msg);
        console.log("Activation email sent to:", userEmail);
      } else {
        console.log("No relevant role change detected");
      }
    } catch (error) {
      console.error("Error in onUserRoleUpdate function:", error);
      throw error; // Re-throw to ensure Firebase knows the function failed
    }
  });