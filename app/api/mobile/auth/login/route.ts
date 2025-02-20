// src/app/api/mobile/auth/login/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import * as jose from "jose";
import clientPromise from "@/lib/mongodb";
import { DB_NAME } from "@/lib/config";
import { logAction } from "@/lib/logAction";

if (!process.env.JWT_SECRET) {
  throw new Error("Please add your JWT_SECRET to .env.local");
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // Find user in both professors and students collections
    const user = await db.collection("professors").findOne({ email }) || 
                 await db.collection("students").findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined in the environment variables");
    }

    const secretKey = new TextEncoder().encode(jwtSecret);

    // Create JWT token
    const token = await new jose.SignJWT({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h") // Longer expiration for mobile app
      .sign(secretKey);

    // Log the login action
    await logAction(user.role, user._id.toString(), "login", `${user.role} logged in: ${user.email}`);

    // Create the response
    const response = NextResponse.json(
      {
        success: true,
        token, // Include the token in the response body for mobile app
        user: {
          id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "An error occurred while logging in" }, { status: 500 });
  }
}