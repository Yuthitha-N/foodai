import { type NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { CohereClient } from "cohere-ai";

const COHERE_API_KEY = process.env.COHERE_API_KEY || "817qsQT7HU2ctsHHA4xzR2EnVJDRN31UbXO6mEEw";

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ message: "Valid authorization token required" }, { status: 401 });
    }

    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ message: "Message is required" }, { status: 400 });
    }

    // Check if Cohere API key is present
    if (!COHERE_API_KEY) {
      return NextResponse.json({
        response: "I am Chefora's cooking assistant! To enable live AI responses, please configure your COHERE_API_KEY in the environment variables.",
      });
    }

    // Initialize Cohere client
    const cohere = new CohereClient({
      token: COHERE_API_KEY,
    });

    try {
      // Use Cohere to generate text
      const response = await cohere.generate({
        model: 'command',
        prompt: `You are Chefora, an expert chef and friendly smart cooking assistant. Provide delicious cooking advice, recipe suggestions, ingredient substitutions, and practical tips.\n\nUser: ${message}\nAssistant:`,
        maxTokens: 200,
        temperature: 0.7,
      });

      const text = response?.generations?.[0]?.text?.trim();

      return NextResponse.json({ response: text || "Happy cooking! Let me know if you need recipe ideas or tips." });
    } catch (aiError: any) {
      console.error("Cohere API error:", aiError?.message || aiError);
      return NextResponse.json({
        response: "Chef Chefora recommendation: Try pairing fresh herbs, olive oil, and garlic for a classic flavorful dish! (AI service temporarily busy).",
      });
    }
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json({ message: error?.message || "Failed to get AI response" }, { status: 500 });
  }
}
