// src/app/api/mobile/professor/[id]/cycles/route.ts

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

    const cycles = await db.collection("cycles").find({
      _id: { $in: professor.modules.map((m: number) => new ObjectId(m)) }
    }).toArray();

    return NextResponse.json({
      success: true,
      cycles: cycles.map(cycle => ({
        _id: cycle._id,
        title: cycle.title,
        description: cycle.description,
      }))
    });

  } catch (error) {
    console.error('Error fetching professor cycles:', error);
    return NextResponse.json(
      { error: "An error occurred while fetching professor cycles" },
      { status: 500 }
    );
  }
}