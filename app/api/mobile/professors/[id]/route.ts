// src/app/api/mobile/professor/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyAuth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);

    const professor = await db.collection("professors").findOne({
      _id: new ObjectId(params.id)
    });

    if (!professor) {
      return NextResponse.json({ error: "Professor not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: professor._id,
        firstName: professor.firstName,
        lastName: professor.lastName,
        email: professor.email,
        department: professor.department,
        profilePicture: professor.profilePicture,
        status: professor.status,
      }
    });

  } catch (error) {
    console.error('Error fetching professor data:', error);
    return NextResponse.json(
      { error: "An error occurred while fetching professor data" },
      { status: 500 }
    );
  }
}