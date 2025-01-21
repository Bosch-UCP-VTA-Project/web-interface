import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const uri: string = process.env.MONGODB_URI!;
const dbName = "BoschVTA";

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get("Authorization")?.split(" ")[1];
    if (!sessionId) {
      return NextResponse.json(
        { message: "No session ID provided" },
        { status: 401 }
      );
    }

    const { query, response } = await request.json();

    const client = new MongoClient(uri);
    await client.connect();

    const db = client.db(dbName);
    const chats = db.collection("chats");

    const result = await chats.insertOne({
      sessionId,
      query,
      response,
      timestamp: new Date(),
    });

    await client.close();

    return NextResponse.json(
      {
        success: true,
        chatId: result.insertedId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Chat storage error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
