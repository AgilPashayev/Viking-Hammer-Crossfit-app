/**
 * Email Verification Service
 * Handles sending verification emails using Supabase Edge Functions or external email service
 */

import { supabase } from './supabaseService';

export interface VerificationEmailData {
  email: string;
  firstName: string;
  token: string;
  expiresAt: string;
}

export interface EmailVerificationResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Send verification email to user
 * In production, this would use a real email service (SendGrid, AWS SES, etc.)
 * For now, we'll simulate the email and log it to console
 */
export const sendVerificationEmail = async (
  data: VerificationEmailData,
): Promise<EmailVerificationResult> => {
  try {
    console.log('📧 Sending verification email...');
    console.log('To:', data.email);
    console.log('Name:', data.firstName);
    console.log('Token:', data.token);

    // Generate verification link
    const verificationLink = `${window.location.origin}/verify-email?token=${data.token}`;

    // In demo mode, just log the email
    const emailContent = `
╔════════════════════════════════════════════════════════════╗
║          Viking Hammer CrossFit - Email Verification       ║
╚════════════════════════════════════════════════════════════╝

Hello ${data.firstName}!

Welcome to Viking Hammer CrossFit! 🏋️‍♂️

To complete your registration, please verify your email address by clicking the link below:

🔗 ${verificationLink}

This link will expire in 24 hours.

If you didn't create an account with Viking Hammer CrossFit, please ignore this email.

---
Stay strong! 💪
Viking Hammer CrossFit Team

╔════════════════════════════════════════════════════════════╗
    `;

    console.log(emailContent);

    // For production, integrate with real email service:
    /*
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: data.email,
        subject: 'Verify Your Email - Viking Hammer CrossFit',
        html: generateEmailHTML(data),
        text: generateEmailText(data)
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to send email');
    }
    */

    // Simulate successful email send
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      message: 'Verification email sent successfully! Check your email inbox.',
    };
  } catch (error: any) {
    console.error('Email send error:', error);
    return {
      success: false,
      message: 'Failed to send verification email',
      error: error.message,
    };
  }
};

/**
 * Create verification token for user
 */
export const createVerificationToken = async (
  userId: string,
  email: string,
): Promise<{ token: string | null; expiresAt: string | null; error: string | null }> => {
  try {
    console.log('🔐 Creating verification token for user:', userId);

    // Call Supabase function to create token
    const { data, error } = await supabase.rpc('create_verification_token', {
      p_user_id: userId,
      p_email: email,
    });

    if (error) {
      console.error('Token creation error:', error);
      return { token: null, expiresAt: null, error: error.message };
    }

    if (!data || data.length === 0) {
      return { token: null, expiresAt: null, error: 'Failed to create token' };
    }

    return {
      token: data[0].token,
      expiresAt: data[0].expires_at,
      error: null,
    };
  } catch (error: any) {
    console.error('Unexpected error creating token:', error);
    return { token: null, expiresAt: null, error: error.message };
  }
};

/**
 * Verify email with token
 */
export const verifyEmailWithToken = async (
  token: string,
): Promise<{ success: boolean; message: string; userId: string | null }> => {
  try {
    console.log('✅ Verifying email with token...');

    // Call Supabase function to verify token
    const { data, error } = await supabase.rpc('verify_email_with_token', {
      p_token: token,
    });

    if (error) {
      console.error('Verification error:', error);
      return { success: false, message: error.message, userId: null };
    }

    if (!data || data.length === 0) {
      return { success: false, message: 'Invalid verification token', userId: null };
    }

    const result = data[0];
    return {
      success: result.success,
      message: result.message,
      userId: result.user_id,
    };
  } catch (error: any) {
    console.error('Unexpected verification error:', error);
    return { success: false, message: error.message, userId: null };
  }
};

/**
 * Resend verification email
 */
export const resendVerificationEmail = async (
  userId: string,
  email: string,
  firstName: string,
): Promise<EmailVerificationResult> => {
  try {
    console.log('🔄 Resending verification email...');

    // Create new token
    const { token, expiresAt, error: tokenError } = await createVerificationToken(userId, email);

    if (tokenError || !token || !expiresAt) {
      return {
        success: false,
        message: 'Failed to generate verification token',
        error: tokenError || 'Unknown error',
      };
    }

    // Send email
    return await sendVerificationEmail({
      email,
      firstName,
      token,
      expiresAt,
    });
  } catch (error: any) {
    console.error('Resend email error:', error);
    return {
      success: false,
      message: 'Failed to resend verification email',
      error: error.message,
    };
  }
};

/**
 * Check if user's email is verified
 */
export const isEmailVerified = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('email_verified')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking email verification:', error);
      return false;
    }

    return data?.email_verified || false;
  } catch (error) {
    console.error('Unexpected error checking email verification:', error);
    return false;
  }
};

/**
 * Generate HTML email template
 */
const generateEmailHTML = (data: VerificationEmailData): string => {
  const verificationLink = `${window.location.origin}/verify-email?token=${data.token}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - Viking Hammer CrossFit</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏋️‍♂️ Viking Hammer CrossFit</h1>
      <p>Email Verification</p>
    </div>
    <div class="content">
      <h2>Hello ${data.firstName}!</h2>
      <p>Welcome to Viking Hammer CrossFit! We're excited to have you join our community.</p>
      <p>To complete your registration, please verify your email address by clicking the button below:</p>
      <a href="${verificationLink}" class="button">Verify Email Address</a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #667eea;">${verificationLink}</p>
      <p><strong>This link will expire in 24 hours.</strong></p>
      <p>If you didn't create an account with Viking Hammer CrossFit, please ignore this email.</p>
      <p style="margin-top: 30px;">Stay strong! 💪<br>Viking Hammer CrossFit Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Viking Hammer CrossFit. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Generate plain text email template
 */
const generateEmailText = (data: VerificationEmailData): string => {
  const verificationLink = `${window.location.origin}/verify-email?token=${data.token}`;

  return `
Viking Hammer CrossFit - Email Verification

Hello ${data.firstName}!

Welcome to Viking Hammer CrossFit! We're excited to have you join our community.

To complete your registration, please verify your email address by visiting this link:

${verificationLink}

This link will expire in 24 hours.

If you didn't create an account with Viking Hammer CrossFit, please ignore this email.

Stay strong! 💪
Viking Hammer CrossFit Team

---
© 2025 Viking Hammer CrossFit. All rights reserved.
  `;
};
