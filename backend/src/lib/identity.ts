/**
 * Identity verification abstraction.
 * For hackathon: mock implementation (any valid OTP in the DB passes).
 * For production: replace with authorized Aadhaar/DigiLocker provider.
 */
export interface IIdentityVerifier {
  sendOtp(phone: string, otp: string): Promise<void>;
}

class MockIdentityVerifier implements IIdentityVerifier {
  async sendOtp(phone: string, otp: string): Promise<void> {
    // Mock: log to console. OTP is already stored in DB by auth service.
    console.log(`[MockIdentityVerifier] Would send OTP ${otp} to ${phone}`);
  }
}

// Export the active verifier — swap implementation here when integrating real provider
export const identityVerifier: IIdentityVerifier = new MockIdentityVerifier();
