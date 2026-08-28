import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";
import mammoth from "mammoth";

// Fallback plain stream decoder for raw PDF text objects if standard decoder is blocked
function extractTextFromRawPdfBuffer(buffer: Buffer): string {
  const text = buffer.toString("latin1");
  const extractedChunks: string[] = [];

  // Match text in parentheses within text blocks e.g. (John Doe) Tj or [(Hello) -10 (World)] TJ
  const tjRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
  let match: RegExpExecArray | null;
  while ((match = tjRegex.exec(text)) !== null) {
    if (match[1] && match[1].length > 1) {
      extractedChunks.push(match[1]);
    }
  }

  // Also match array text blocks e.g. [(Experience) 10 (Senior)] TJ
  const arrayTjRegex = /\[([^\]]+)\]\s*TJ/g;
  while ((match = arrayTjRegex.exec(text)) !== null) {
    const inner = match[1];
    const subMatch = inner.match(/\(([^)]+)\)/g);
    if (subMatch) {
      subMatch.forEach((s) => extractedChunks.push(s.slice(1, -1)));
    }
  }

  return extractedChunks.join(" ").replace(/\\([()\\])/g, "$1").trim();
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
        // Primary modern extractor using unpdf (pure web-standard PDF.js ESM)
        const pdfData = await extractText(new Uint8Array(arrayBuffer));
        if (pdfData && pdfData.text) {
          extractedText = Array.isArray(pdfData.text)
            ? pdfData.text.join("\n")
            : String(pdfData.text);
        }
      } catch (unpdfErr) {
        console.warn("unpdf parser failed, attempting raw stream fallback:", unpdfErr);
      }

      // Secondary fallback if primary extracted text is empty
      if (!extractedText.trim()) {
        try {
          extractedText = extractTextFromRawPdfBuffer(buffer);
        } catch (fallbackErr) {
          console.error("PDF fallback stream extraction failed:", fallbackErr);
        }
      }

      if (!extractedText.trim()) {
        return NextResponse.json(
          {
            error:
              "Could not extract readable text from this PDF. It may be a scanned image or protected. You can paste your resume text below directly.",
          },
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
          { error: "Failed to extract text from Word document. Please paste the text below." },
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
        { error: "The uploaded file contains no text. Please paste your resume text below." },
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
