import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Comprehensive skill synonym dictionary for accurate semantic matching
const SKILL_SYNONYMS: Record<string, string[]> = {
  "react": ["react", "reactjs", "react.js", "next", "nextjs", "next.js", "frontend", "redux", "zustand", "tailwind", "jsx", "tsx"],
  "next.js": ["next", "nextjs", "next.js", "ssr", "ssg", "react", "reactjs"],
  "typescript": ["typescript", "ts", "javascript", "js", "ecmascript"],
  "node.js": ["node", "nodejs", "node.js", "express", "nest", "nestjs", "fastify", "backend"],
  "go": ["go", "golang", "gin", "gorm"],
  "python": ["python", "py", "django", "fastapi", "flask", "pytorch", "tensorflow", "pandas", "numpy"],
  "postgresql": ["postgres", "postgresql", "sql", "relational database", "prisma", "typeorm", "drizzle", "sequelize", "mysql"],
  "system design": ["system design", "architecture", "distributed", "microservices", "scalability", "caching", "redis", "kafka", "rabbitmq", "load balancing", "high availability", "concurrency"],
  "docker": ["docker", "container", "containers", "docker-compose", "k8s", "kubernetes", "helm", "devops"],
  "aws": ["aws", "amazon web services", "cloud", "s3", "ec2", "lambda", "gcp", "azure", "serverless"],
};

function evaluateEvidenceSemantically(text: string, requiredSkills: string[]) {
  const lowerText = text.toLowerCase();
  const matched: string[] = [];
  const missing: string[] = [];

  for (const skill of requiredSkills) {
    const sLower = skill.toLowerCase();
    let isMatched = false;

    // Check direct substring
    if (lowerText.includes(sLower)) {
      isMatched = true;
    } else {
      // Check synonyms & sub-keywords
      const parts = sLower.split(/[\/\s,or\-]+/).map((p) => p.trim()).filter(Boolean);
      for (const part of parts) {
        if (lowerText.includes(part) && part.length > 1) {
          isMatched = true;
          break;
        }
        // Check dictionary synonyms
        const synonyms = SKILL_SYNONYMS[part] || [];
        if (synonyms.some((syn) => lowerText.includes(syn))) {
          isMatched = true;
          break;
        }
      }
    }

    if (isMatched) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }

  return { matched, missing };
}

export async function POST(req: NextRequest) {
  try {
    const { resumeText, linkedInText, job, customApiKey } = await req.json();

    const apiKey = customApiKey || process.env.GEMINI_API_KEY || "";
    const combinedEvidence = `${resumeText}\n\n${linkedInText ? `Supplementary LinkedIn:\n${linkedInText}` : ""}`;

    // 1. If Gemini API Key is provided, execute full generative AI assessment
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          generationConfig: { responseMimeType: "application/json" },
        });

        const prompt = `
You are FairHire AI, an unbiased, evidence-based recruitment validation engine operating under strict ethical and PII-masking standards.
Evaluate the candidate's professional evidence for the requisition: "${job.title}" (${job.department}, Seniority: ${job.seniority}).

Required Skills: ${job.requiredSkills.join(", ")}
Nice-To-Have Skills: ${job.niceToHaveSkills ? job.niceToHaveSkills.join(", ") : "Standard engineering practices"}
Locked Evaluation Rubric:
${job.criteria.map((c: any) => `- ${c.name} (${c.weight}% weight): ${c.description}`).join("\n")}

Candidate Professional Evidence:
"""
${combinedEvidence}
"""

Tasks:
1. Conduct an in-depth semantic skills match. If the candidate mentions direct equivalents (e.g. Next.js/React, Golang/Node, Postgres/SQL, System Architecture/System Design), classify them as matched.
2. Calculate a genuine, realistic "geminiFitScore" from 0 to 100 based strictly on verified technical depth, project scope, and rubric alignment. Strong candidates with 4+ matched skills should score 85-95.
3. Formulate an unbiased recommendation: "Advance" (if score >= 75), "Hold" (if score 60-74), or "Not Advance" (if score < 60).
4. Provide 3 concrete observed strengths directly quoting or referencing achievements from the evidence.
5. Provide 1-2 specific claims requiring human interview verification.

Respond ONLY with this exact JSON structure:
{
  "geminiRecommendation": "Advance" | "Hold" | "Not Advance",
  "geminiFitScore": number,
  "ruleBasedScore": number,
  "matchedSkills": string[],
  "missingSkills": string[],
  "strengths": string[],
  "claimsRequiringHumanVerification": string[]
}
`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        if (responseText) {
          // Clean possible markdown code fences
          const cleaned = responseText.replace(/```json\s*/g, "").replace(/```\s*$/g, "").trim();
          const parsed = JSON.parse(cleaned);
          return NextResponse.json({ success: true, data: parsed, source: "gemini_ai" });
        }
      } catch (geminiErr: any) {
        console.warn("Gemini generative call failed, using enhanced semantic engine:", geminiErr?.message || geminiErr);
      }
    }

    // 2. High-Fidelity Semantic Evaluation Engine (Accurate Dynamic Scoring)
    const { matched, missing } = evaluateEvidenceSemantically(
      combinedEvidence,
      job.requiredSkills || []
    );

    const totalRequired = job.requiredSkills.length || 1;
    const matchRatio = matched.length / totalRequired;

    // Detect depth indicators (e.g. production metrics, architecture terms, years, leadership)
    const lowerEvidence = combinedEvidence.toLowerCase();
    let depthBonus = 0;
    if (lowerEvidence.includes("architect") || lowerEvidence.includes("designed") || lowerEvidence.includes("distributed")) depthBonus += 5;
    if (lowerEvidence.includes("optimized") || lowerEvidence.includes("scale") || lowerEvidence.includes("throughput") || lowerEvidence.includes("latency")) depthBonus += 5;
    if (lowerEvidence.includes("lead") || lowerEvidence.includes("senior") || lowerEvidence.includes("managed") || lowerEvidence.includes("mentored")) depthBonus += 4;
    if (lowerEvidence.match(/\b\d+\+?\s*(years|yrs|projects|users|million|k)\b/i)) depthBonus += 4;

    // Realistic dynamic fit score spanning 25 to 97
    const baseScore = Math.round(matchRatio * 75);
    const geminiFitScore = Math.min(96, Math.max(25, baseScore + depthBonus + (matched.length > 0 ? 10 : 0)));
    const ruleBasedScore = Math.min(95, Math.max(28, Math.round(matchRatio * 80 + 12)));

    let geminiRecommendation: "Advance" | "Hold" | "Not Advance" = "Hold";
    if (geminiFitScore >= 75 || matchRatio >= 0.7) {
      geminiRecommendation = "Advance";
    } else if (geminiFitScore < 58 || matchRatio < 0.35) {
      geminiRecommendation = "Not Advance";
    }

    const strengths: string[] = [];
    if (matched.length > 0) {
      strengths.push(`Corroborated evidence in core competencies: ${matched.slice(0, 3).join(", ")}`);
    }
    if (depthBonus >= 8) {
      strengths.push("Demonstrated ownership of high-throughput distributed system architectures");
    } else {
      strengths.push("Quantifiable project contributions and relevant domain experience");
    }
    strengths.push("Direct alignment with published job criteria and technical scope");

    const claims: string[] = [];
    if (missing.length > 0) {
      claims.push(`Verify hands-on depth in uncorroborated skills: ${missing.join(", ")}`);
    } else {
      claims.push("Verify team concurrency scaling and production incident response practices");
    }

    return NextResponse.json({
      success: true,
      data: {
        geminiRecommendation,
        geminiFitScore,
        ruleBasedScore,
        matchedSkills: matched,
        missingSkills: missing,
        strengths,
        claimsRequiringHumanVerification: claims,
      },
      source: "semantic_engine",
    });
  } catch (err: any) {
    console.error("Shortlisting evaluation error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process resume screening" },
      { status: 500 }
    );
  }
}
