const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

// Initialize the SES client with region and credentials from .env
const sesClient = new SESClient({
  region: process.env.AWS_SES_REGION || process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Sends an email using AWS SES.
 * @param {string} toEmail - The recipient's email address
 * @param {string} subject - The subject of the email
 * @param {string} bodyHtml - The HTML body of the email
 */
const sendEmail = async (toEmail, subject, bodyHtml) => {
  const senderEmail = process.env.AWS_SES_SENDER_EMAIL;

  if (!senderEmail) {
    console.warn("AWS_SES_SENDER_EMAIL is not set. Skipping email send.");
    return;
  }

  const params = {
    Destination: {
      ToAddresses: [toEmail],
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: bodyHtml,
        },
        Text: {
          Charset: "UTF-8",
          Data: bodyHtml.replace(/<[^>]*>?/gm, ''), // Very basic HTML to Text fallback
        }
      },
      Subject: {
        Charset: "UTF-8",
        Data: subject,
      },
    },
    Source: senderEmail,
  };

  try {
    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);
    console.log(`Email successfully sent to ${toEmail}. Message ID: ${result.MessageId}`);
    return result;
  } catch (error) {
    console.error(`Failed to send email to ${toEmail}. Error:`, error);
    // Don't throw the error, we don't want to crash the login/signup flow if email fails
    return null;
  }
};

/**
 * Sends a welcome email upon successful signup.
 */
const sendWelcomeEmail = async (toEmail, name) => {
  const subject = "Welcome to Impromptu-AI! 🎉";
  const bodyHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2E8B57;">Welcome to Impromptu-AI, ${name}!</h2>
      <p>We are thrilled to have you on board.</p>
      <p>With Impromptu-AI, you can generate unique speech topics, record your audio, and get instant, detailed feedback from our advanced AI evaluator.</p>
      <br/>
      <p>Get started today by creating your first session!</p>
      <br/>
      <p>Happy Speaking,<br/>The Impromptu-AI Team</p>
    </div>
  `;
  return await sendEmail(toEmail, subject, bodyHtml);
};

/**
 * Sends an OTP email for signup/login verification.
 */
const sendOtpEmail = async (toEmail, otp) => {
  const subject = "Your Impromptu-AI Verification Code";
  const bodyHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; text-align: center;">
      <h2 style="color: #333;">Verification Code</h2>
      <p>Use the following code to verify your email address. It will expire in 5 minutes.</p>
      <div style="background-color: #f4f4f4; padding: 20px; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px;">
        ${otp}
      </div>
      <p>If you did not request this code, please ignore this email.</p>
    </div>
  `;
  return await sendEmail(toEmail, subject, bodyHtml);
};

module.exports = {
  sendWelcomeEmail,
  sendLoginNotificationEmail,
  sendOtpEmail
};
