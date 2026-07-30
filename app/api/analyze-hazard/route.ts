import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString("base64");

    // Call the local plant server running Llama 3.2 Vision air-gapped
    const localRes = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2-vision",
        messages: [
          {
            role: "user",
            content: "Analyze this workplace hazard photo for an EHS plant audit. Return a structured response with: 1) Incident Summary, 2) Risk Level (High/Medium/Low), and 3) Immediate Recommended Actions.",
            images: [base64Image]
          }
        ],
        stream: false
      }),
    });

    if (!localRes.ok) throw new Error("Local plant AI server communication failed");

    const data = await localRes.json();
    const aiText = data.message?.content || "No analysis generated.";

    return NextResponse.json({ analysis: aiText });
  } catch (error: any) {
    console.error("Local Edge AI Error:", error);
    return NextResponse.json(
      { error: "Failed to process image through local plant gateway" },
      { status: 500 }
    );
  }
}