import { getEnv } from "./env";

export async function sendSMS(to: string, message: string): Promise<void> {
  const env = getEnv();

  if (env.SMS_MOCK === "true") {
    console.log(`[SMS MOCK] To: ${to} | Message: ${message}`);
    return;
  }

  // Real Twilio integration
  const twilio = await import("twilio");
  const client = twilio.default(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });
}
