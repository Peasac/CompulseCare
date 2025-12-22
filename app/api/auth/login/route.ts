import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";
import { generateToken } from "@/lib/auth";

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 * 
 * Body: { email: string, password: string }
 * Returns: { token: string, user: { id, email, name } }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
    });

    // Return token and user info (exclude password)
    return NextResponse.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name || null,
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
