import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";

// Robust dynamic loader for pdf-parse to support both Node CJS and ESM Next.js bundlers
async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  // @ts-ignore
  const pdfParse = require("pdf-parse");
  const data = await pdfParse(buffer);
  return data?.text || "";
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = file.name.toLowerCase();
    let extractedText = "";

    if (fileName.endsWith(".pdf")) {
      try {
        extractedText = await parsePdfBuffer(buffer);
      } catch (pdfErr: any) {
        console.error("PDF parse error:", pdfErr);
        return NextResponse.json(
          { error: "Failed to extract text from PDF. Ensure the file is not password protected." },
          { status: 422 }
        );
      }
    } else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value || "";
      } catch (docxErr: any) {
        console.error("DOCX parse error:", docxErr);
        return NextResponse.json(
          { error: "Failed to extract text from Word document." },
          { status: 422 }
        );
      }
    } else {
      // Plain text, markdown, etc.
      extractedText = buffer.toString("utf-8");
    }

    extractedText = extractedText.trim();

    if (!extractedText) {
      return NextResponse.json(
        { error: "The uploaded file is empty or could not be read as text." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      text: extractedText,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error: any) {
    console.error("Server resume parse error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error parsing resume document." },
      { status: 500 }
    );
  }
}
