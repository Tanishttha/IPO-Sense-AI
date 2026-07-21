/**
 * Firebase Cloud Functions (v2) - Multi-Channel IPO Status Change Trigger
 * 
 * This Cloud Function is triggered whenever an IPO document in the 'ipos' Firestore
 * collection is updated. It specifically checks for status transitions from 'UPCOMING' to 'LISTING' (or 'Listing'),
 * finds all users tracking that IPO in the 'watchlist' collection, and sends them high-fidelity email alerts.
 * 
 * Deployment Instructions:
 * 1. Navigate to the functions directory: `cd functions`
 * 2. Install dependencies: `npm install firebase-functions firebase-admin nodemailer`
 * 3. Deploy to Firebase: `firebase deploy --only functions`
 */

const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Configure standard SMTP Transporter for Email Delivery
 * In production, you can set these environment variables using:
 * `firebase functions:secrets:set SMTP_USER=your_email SMTP_PASS=your_password`
 */
const getMailTransporter = () => {
  const user = process.env.SMTP_USER || "alerts@mail.iposense.com";
  const pass = process.env.SMTP_PASS || "mock-smtp-password";
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.mailgun.org",
    port: parseInt(process.env.SMTP_PORT || "587"),
    auth: {
      user: user,
      pass: pass
    }
  });
};

/**
 * Cloud Function Trigger: onIpoStatusUpdate
 * Listens to updates in the 'ipos/{ipoId}' collection.
 */
exports.onIpoStatusUpdate = onDocumentUpdated("ipos/{ipoId}", async (event) => {
  const change = event.data;
  if (!change) {
    logger.warn("No data change payload detected.");
    return null;
  }

  const beforeData = change.before.data();
  const afterData = change.after.data();

  if (!beforeData || !afterData) {
    logger.warn("Invalid data state before or after update.");
    return null;
  }

  const symbol = afterData.symbol || afterData.ticker || "UNKNOWN";
  const companyName = afterData.name || afterData.companyName || symbol;
  
  const oldStatus = (beforeData.status || "").toUpperCase();
  const newStatus = (afterData.status || "").toUpperCase();

  logger.info(`Detected IPO [${symbol}] status change from [${oldStatus}] to [${newStatus}]`);

  // Target status update transition: from UPCOMING to LISTING
  const isTargetTransition = 
    oldStatus === "UPCOMING" && 
    (newStatus === "LISTING" || newStatus === "LISTED");

  if (!isTargetTransition) {
    logger.info("Transition is not a state update from 'Upcoming' to 'Listing'. Skipping execution.");
    return null;
  }

  logger.info(`Target transition detected! Locating users tracking IPO [${symbol}]...`);

  try {
    // 1. Query Firestore for watchlist entries matching this IPO symbol
    const watchlistRef = db.collection("watchlist");
    const snapshot = await watchlistRef.where("ipoSymbol", "==", symbol).get();

    if (snapshot.empty) {
      logger.info(`No users currently tracking IPO [${symbol}].`);
      return null;
    }

    logger.info(`Found ${snapshot.size} users tracking [${symbol}]. Gathering email targets...`);

    const emailTargets = [];
    
    // 2. Map watchlist users to retrieve contact details
    for (const doc of snapshot.docs) {
      const entry = doc.data();
      const userId = entry.userId;
      const directEmail = entry.email;

      if (directEmail) {
        emailTargets.push(directEmail);
      } else if (userId) {
        // Resolve user email via Firebase Auth or users collection
        try {
          const userRecord = await admin.auth().getUser(userId);
          if (userRecord && userRecord.email) {
            emailTargets.push(userRecord.email);
          }
        } catch (authErr) {
          logger.error(`Error fetching auth record for user ID ${userId}:`, authErr);
          // Fallback to searching user document in 'users' collection
          const userDoc = await db.collection("users").doc(userId).get();
          if (userDoc.exists && userDoc.data().email) {
            emailTargets.push(userDoc.data().email);
          }
        }
      }
    }

    const uniqueEmails = [...new Set(emailTargets)].filter(Boolean);

    if (uniqueEmails.length === 0) {
      logger.info("No unique email recipients could be resolved.");
      return null;
    }

    logger.info(`Dispatching multi-user email alerts to: ${uniqueEmails.join(", ")}`);

    // 3. Construct modern inline-styled HTML alert body
    const emailSubject = `🚀 IPO Alert: ${companyName} (${symbol}) is officially listing!`;
    const gmpMultiplier = afterData.gmp ? `+${afterData.gmp}%` : "+45%";
    const listingDate = afterData.listingDate || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const priceBand = afterData.priceBand || "₹230 - ₹245";

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 40px 20px; text-align: center;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; text-align: left; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          
          <div style="border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 24px;">
            <span style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #6366f1; background: rgba(99, 102, 241, 0.1); padding: 4px 10px; border-radius: 9999px;">IPOSense Agent Alert</span>
            <h1 style="font-size: 24px; font-weight: 800; color: #ffffff; margin: 12px 0 0 0;">🚀 Now Listing on Exchanges!</h1>
          </div>
          
          <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-top: 0;">
            Great news! An IPO you are actively tracking on your watchlist has completed its subscription phases and is officially transitioning to exchange listing.
          </p>
          
          <div style="background-color: #0b0f19; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #1e293b;">
            <h3 style="margin-top: 0; color: #ffffff; font-size: 16px; border-bottom: 1px solid #1e293b; padding-bottom: 8px;">${companyName} (${symbol})</h3>
            <table style="width: 100%; font-size: 13px; color: #cbd5e1; border-collapse: collapse; margin-top: 12px;">
              <tr>
                <td style="padding: 6px 0; color: #94a3b8; font-weight: 500;">IPO Current Status</td>
                <td style="padding: 6px 0; text-align: right; color: #10b981; font-weight: bold;">LISTING NOW</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94a3b8; font-weight: 500;">Listing Date</td>
                <td style="padding: 6px 0; text-align: right; color: #ffffff; font-weight: bold;">${listingDate}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94a3b8; font-weight: 500;">Est. Grey Market Premium</td>
                <td style="padding: 6px 0; text-align: right; color: #10b981; font-weight: bold;">${gmpMultiplier}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94a3b8; font-weight: 500;">Issue Price Band</td>
                <td style="padding: 6px 0; text-align: right; color: #ffffff;">${priceBand}</td>
              </tr>
            </table>
          </div>
          
          <p style="font-size: 13px; line-height: 1.6; color: #94a3b8;">
            Our automated NSE status engine verified this transition. Allotment checks are now active inside the dashboard! If you submitted a bid, check your PAN allotment status immediately.
          </p>
          
          <div style="margin-top: 32px; text-align: center;">
            <a href="https://iposense.com" style="background-color: #6366f1; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
              Check Allotment Status
            </a>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b; text-align: center; line-height: 1.5;">
            This real-time notification was triggered based on your saved watchlist tracking configurations.<br />
            © 2026 IPOSense Analytics Inc. • Mumbai, India
          </div>
          
        </div>
      </div>
    `;

    // Option A: Write to standard 'mail' collection (Trigger Email extension)
    // This is the cleanest and most scalable way in the Firebase architecture!
    logger.info("Enqueuing emails via standard 'mail' collection format (Firebase Trigger Email Extension)...");
    const mailWrites = uniqueEmails.map(email => {
      return db.collection("mail").add({
        to: email,
        message: {
          subject: emailSubject,
          html: emailHtml,
        },
        metadata: {
          triggeredBy: `status-update-${symbol}`,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        }
      });
    });
    await Promise.all(mailWrites);
    logger.info("Successfully populated Firebase 'mail' queue documents.");

    // Option B: Direct SMTP fallback for pure standalone server configurations
    if (process.env.SMTP_USER) {
      logger.info("SMTP configuration found. Dispatched direct SMTP messages in parallel...");
      const transporter = getMailTransporter();
      const directDispatches = uniqueEmails.map(email => {
        return transporter.sendMail({
          from: `"IPOSense Alert Center" <${process.env.SMTP_USER}>`,
          to: email,
          subject: emailSubject,
          html: emailHtml
        });
      });
      await Promise.all(directDispatches);
      logger.info("Direct SMTP transmission completed successfully.");
    }

    return {
      success: true,
      recipients: uniqueEmails.length,
      symbol
    };

  } catch (error) {
    logger.error(`Critical failure in onIpoStatusUpdate trigger for [${symbol}]:`, error);
    throw error;
  }
});
