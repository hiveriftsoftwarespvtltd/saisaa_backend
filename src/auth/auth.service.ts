import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
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

  private generateToken(user: UserDocument): string {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }
}
