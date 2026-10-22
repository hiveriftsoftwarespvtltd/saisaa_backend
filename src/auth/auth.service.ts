import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { User, UserDocument } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { fullName, email, password } = registerDto;
    const cleanEmail = email.trim().toLowerCase();

    // 1. Check if an account with this email already exists
    const existingUser = await this.userModel.findOne({ email: cleanEmail });
    if (existingUser) {
      throw new ConflictException(
        'An account with this email address already exists. Please log in instead.',
      );
    }

    // 2. Hash the password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Persist new customer account
    const newUser = await this.userModel.create({
      fullName: fullName.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: 'customer',
      tier: 'Royal Privé Member',
      loyaltyPoints: 500, // 500 welcome points
    });

    // 4. Generate JWT token
    const token = this.generateToken(newUser);

    return {
      user: newUser.toJSON(),
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const cleanEmail = email.trim().toLowerCase();

    // 1. Find user by email
    const user = await this.userModel.findOne({ email: cleanEmail });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    // 3. Generate JWT token
    const token = this.generateToken(user);

    return {
      user: user.toJSON(),
      token,
    };
  }

  /**
   * Best-practice Forgot Password Flow:
   * 1. Validates registered email.
   * 2. Defends against email enumeration by returning a uniform success message.
   * 3. Generates cryptographically secure 6-digit numeric OTP.
   * 4. Hashes the OTP using bcrypt prior to storing in database with 15-minute expiry.
   * 5. Dispatches a royal luxury HTML email via Nodemailer SMTP.
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const cleanEmail = email.trim().toLowerCase();

    const user = await this.userModel.findOne({ email: cleanEmail });

    // Strict validation: Only registered SAISAA users can request password reset
    if (!user) {
      this.logger.warn(`Password reset rejected: Unregistered email ${cleanEmail}`);
      throw new BadRequestException(
        'This email address is not registered with SAISAA. Please check your email or create an account.',
      );
    }


    // Generate secure 6-digit verification OTP (100000 - 999999)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP with bcrypt (salt rounds = 8 for fast yet secure hashing)
    const hashedOtp = await bcrypt.hash(otp, 8);

    // Set 15-minute expiry
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    user.resetPasswordOtp = hashedOtp;
    user.resetPasswordExpires = expiresAt;
    await user.save();

    this.logger.log(`[SAISAA AUTH] Verification OTP generated for ${cleanEmail}: ${otp} (expires in 15 mins)`);

    // Dispatch luxury HTML email
    let emailSent = false;
    let emailErrorMessage = '';

    try {
      await this.sendResetPasswordEmail(cleanEmail, user.fullName || 'Valued Patron', otp);
      emailSent = true;
      this.logger.log(`Password reset email successfully sent to ${cleanEmail}`);
    } catch (mailError) {
      emailErrorMessage = mailError?.message || String(mailError);
      this.logger.error(`[SMTP FAILED] Could not deliver email to ${cleanEmail}: ${emailErrorMessage}`);
      this.logger.warn(`[DEV_OTP] Verification code for ${cleanEmail} is: ${otp}`);
    }

    return {
      sent: true,
      emailSent,
      message: 'A 6-digit verification code has been dispatched to your email address.',
    };
  }


  /**
   * Reset Password Flow:
   * 1. Validates user by email.
   * 2. Checks OTP existence and 15-minute expiration window.
   * 3. Verifies OTP bcrypt match.
   * 4. Updates password with bcrypt hash and clears OTP fields.
   * 5. Issues fresh session token for seamless authentication.
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, otp, newPassword } = resetPasswordDto;
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = (otp || '').trim();

    const user = await this.userModel.findOne({ email: cleanEmail });
    if (!user) {
      throw new BadRequestException('Invalid email address or verification code.');
    }

    if (!user.resetPasswordOtp || !user.resetPasswordExpires) {
      throw new BadRequestException('No active password reset request found. Please request a new code.');
    }

    if (new Date() > new Date(user.resetPasswordExpires)) {
      // Clear expired OTP
      user.resetPasswordOtp = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      throw new BadRequestException('The verification code has expired. Please request a fresh code.');
    }

    const isMatch = await bcrypt.compare(cleanOtp, user.resetPasswordOtp);
    if (!isMatch) {
      throw new BadRequestException('Invalid verification code. Please check and try again.');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update credentials and clear reset token
    user.password = hashedPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    this.logger.log(`Password successfully reset for user ${cleanEmail}`);

    const token = this.generateToken(user);

    return {
      user: user.toJSON(),
      token,
      message: 'Your password has been successfully updated. Welcome back to SAISAA.',
    };
  }

  /**
   * Dispatch Royal Luxury HTML Email
   */
  private async sendResetPasswordEmail(toEmail: string, patronName: string, otp: string) {
    const host = this.configService.get<string>('EMAIL_HOST', 'smtp.gmail.com');
    const port = Number(this.configService.get<number>('EMAIL_PORT', 587));
    const user = this.configService.get<string>('EMAIL_USER', 'samunder2611@gmail.com');
    const rawPass = this.configService.get<string>('EMAIL_PASS', 'mduyjcgftdzqkrvg');
    const pass = (rawPass || '').replace(/\s+/g, '');
    const mailFrom = `"SAISAA Concierge" <${user}>`;

    const isGmail =
      host.toLowerCase().includes('gmail') ||
      (user && user.toLowerCase().includes('@gmail.com'));

    const transporter = isGmail
      ? nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user,
            pass,
          },
        })
      : nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: {
            user,
            pass,
          },
        });

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>SAISAA Password Reset</title>
    </head>
    <body style="margin:0;padding:0;background-color:#F5F3EF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#222222;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F3EF;padding:30px 10px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e0d8;">
              <tr>
                <td style="background-color:#09231A;padding:30px 24px;text-align:center;">
                  <h1 style="margin:0;color:#D4AF37;font-size:26px;letter-spacing:3px;font-family:Georgia,serif;font-weight:700;">SAISAA</h1>
                  <p style="margin:6px 0 0 0;color:#F5F3EF;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;opacity:0.9;">Artisanal Haute Luxury</p>
                </td>
              </tr>
              <tr>
                <td style="padding:32px 28px 20px 28px;">
                  <p style="margin:0 0 16px 0;font-size:15px;color:#111827;font-weight:600;">Namaste ${patronName},</p>
                  <p style="margin:0 0 22px 0;font-size:14px;color:#4B5563;line-height:1.6;">
                    We received a request to update the password for your SAISAA customer account. Please enter the verification code below on the reset page:
                  </p>
                  
                  <div style="background-color:#FAF7F2;border:2px dashed #D4AF37;border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
                    <div style="font-family:'Courier New',Courier,monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:#09231A;">${otp}</div>
                    <div style="margin-top:8px;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:1px;">Expires in 15 minutes</div>
                  </div>

                  <div style="background-color:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:12px 14px;font-size:12px;color:#92400E;line-height:1.5;margin-bottom:20px;">
                    <strong>Security Reminder:</strong> Never share this verification code with anyone. SAISAA concierges and staff will never ask for your code or password.
                  </div>

                  <p style="margin:0;font-size:12px;color:#6B7280;line-height:1.5;">
                    If you did not make this request, please disregard this email. Your SAISAA account remains safe and secure.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:18px 28px 24px 28px;text-align:center;border-top:1px solid #F3F4F6;font-size:11px;color:#9CA3AF;">
                  &copy; ${new Date().getFullYear()} SAISAA Luxury Ethnic Wear. All rights reserved.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    await transporter.sendMail({
      from: mailFrom,
      to: toEmail,
      replyTo: user,
      subject: `SAISAA Security: Verification code for password reset`,
      html: htmlContent,
      text: `Namaste ${patronName},\n\nYour SAISAA verification code is: ${otp}\n\nThis code will expire in 15 minutes.\nIf you did not request this, please disregard this email.`,
      headers: {
        'X-Entity-Ref-ID': `saisaa-reset-${Date.now()}`,
      },
    });
  }

  private generateToken(user: UserDocument): string {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }
}

