require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const taskRoutes = require("./routes/taskRoutes");
const { findSemanticReferences } = require("./semanticSearch");

const app = express();
app.use(express.json());

function getKnowledgeBase() {
  const filePath = path.join(__dirname, "../data/knowledgeBase.json");
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function findRelevantReferences(question) {
  const words = question.toLowerCase().match(/[a-z0-9]{3,}/g) || [];

  return getKnowledgeBase()
    .map((reference) => {
      const searchableText = [
        reference.category,
        reference.question,
        reference.answer,
        reference.office,
        reference.source
      ].filter(Boolean).join(" ").toLowerCase();
      const score = words.reduce((total, word) => total + (searchableText.includes(word) ? 1 : 0), 0);
      return { reference, score };
    })
    .filter((item) => item.score > 0)
    .sort((first, second) => second.score - first.score)
    .slice(0, 2)
    .map((item) => item.reference);
}

function findBestInstantMatch(question) {
  const lower = question.toLowerCase();
  const kb = getKnowledgeBase();

  for (const item of kb) {
    const q = (item.question || "").toLowerCase();
    const cat = (item.category || "").toLowerCase();

    if (
      (lower.includes("registrar") && (q.includes("registrar") || cat.includes("registrar"))) ||
      (lower.includes("tor") && q.includes("registrar")) ||
      (lower.includes("transcript") && q.includes("registrar")) ||
      (lower.includes("scholarship") && (q.includes("scholarship") || cat.includes("scholarship"))) ||
      (lower.includes("hawak kamay") && q.includes("hawak kamay")) ||
      (lower.includes("tuition") && (q.includes("tuition") || cat.includes("tuition"))) ||
      (lower.includes("cashier") && q.includes("tuition")) ||
      (lower.includes("installment") && q.includes("tuition")) ||
      (lower.includes("enroll") && (q.includes("enroll") || cat.includes("enroll"))) ||
      (lower.includes("clinic") && (q.includes("clinic") || cat.includes("health"))) ||
      (lower.includes("guidance") && (q.includes("guidance") || cat.includes("health")))
    ) {
      return item;
    }
  }
  return null;
}

function findSpecificBuildingReference(question) {
  const lower = question.toLowerCase();
  const campusReference = getKnowledgeBase().find((reference) =>
    (reference.category || "").toLowerCase().includes("campus navigation")
  );

  if (!campusReference) return null;

  const buildingNames = [
    "main building",
    "cea building",
    "cite building",
    "university library",
    "university gymnasium"
  ];
  const requestedBuilding = buildingNames.find((building) => lower.includes(building));

  if (!requestedBuilding) return null;

  const buildingEntry = campusReference.answer
    .split("•")
    .map((entry) => entry.trim())
    .find((entry) => entry.toLowerCase().startsWith(`${requestedBuilding}:`));

  if (!buildingEntry) return null;

  return {
    ...campusReference,
    answer: `• ${buildingEntry}`
  };
}

function findUnverifiedBuildingName(question) {
  const match = question.match(/\b([a-z0-9-]{3,})\s+building\b/i);
  const buildingName = match?.[1]?.toLowerCase();
  if (!buildingName || ["the", "this", "that"].includes(buildingName)) return null;

  const verifiedText = getKnowledgeBase()
    .map((reference) => [reference.category, reference.question, reference.answer].filter(Boolean).join(" "))
    .join(" ")
    .toLowerCase();

  return verifiedText.includes(buildingName) ? null : match[1];
}

function formatReferences(references) {
  if (references.length === 0) {
    return "No matching verified UPang reference was found in the knowledge base.";
  }

  return references.map((reference, index) => [
    `Reference ${index + 1}`,
    `Category: ${reference.category || "Not specified"}`,
    `Question/topic: ${reference.question || "Not specified"}`,
    `Information: ${reference.answer || "Not specified"}`,
    `Source: ${reference.source || "Not specified"}`,
    `Page/section: ${reference.page || "Not specified"}`,
    `Related office: ${reference.office || "Not specified"}`
  ].join("\n")).join("\n\n");
}

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

async function streamAnswerWithOllama(question, referenceContext, res) {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.2:1b";

  const systemInstruction = `You are UPangAssist, a university information assistant for PHINMA University of Pangasinan (UPang).
Answer student questions factually, warmly, and concisely using the verified UPang references below.
Keep answers brief and straight to the point (under 3-4 sentences when possible).
If you lack enough information, clearly say that there is no verified reference for the specific question and recommend contacting the official UPang office.

Verified UPang references:
${referenceContext}`;

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: question }
      ],
      options: {
        num_predict: 160,
        temperature: 0.3
      },
      stream: true
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama request failed (${response.status}): ${errorText}`);
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        if (parsed.message?.content) {
          res.write(parsed.message.content);
        }
      } catch {
        // ignore incomplete JSON chunk
      }
    }
  }

  if (buffer.trim()) {
    try {
      const parsed = JSON.parse(buffer);
      if (parsed.message?.content) {
        res.write(parsed.message.content);
      }
    } catch {
      // ignore
    }
  }

  res.end();
}

async function generateAnswerWithOllama(question, referenceContext) {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.2:1b";

  const systemInstruction = `You are UPangAssist, a helpful and student-friendly university information assistant for PHINMA University of Pangasinan (UPang).
Answer strictly using the verified UPang references supplied below. Never invent or hallucinate policies, requirements, fees, dates, or contact details.
Keep your answers brief and straight to the point (under 3-4 sentences). Include source where available.

Verified UPang references:
${referenceContext}`;

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: question }
      ],
      options: {
        num_predict: 160,
        temperature: 0.3
      },
      stream: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.message?.content?.trim();
}

app.post("/api/chat", async (req, res) => {
  const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
  const wantStream = req.body?.stream === true || req.query?.stream === "true";

  if (!question) {
    return res.status(400).json({ error: "question is required" });
  }

  const unverifiedBuilding = findUnverifiedBuildingName(question);
  if (unverifiedBuilding) {
    const message = `I do not have a verified UPang reference for the ${unverifiedBuilding} Building location. Please contact Campus Administration or the relevant college office for the current location.`;
    if (wantStream) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.end(message);
    }
    return res.json({ text: message, provider: "verified_reference_check" });
  }

  const specificBuilding = findSpecificBuildingReference(question);
  if (specificBuilding) {
    const specificBuildingText = `${specificBuilding.answer}\n\n*Source: ${specificBuilding.source || "UPang Campus Directory"} (${specificBuilding.page || "Campus Map"})*`;
    if (wantStream) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.end(specificBuildingText);
    }
    return res.json({ text: specificBuildingText, provider: "instant_knowledge_base" });
  }

  // 1. Instant Fast-Path for exact verified FAQ matches (<10ms response time)
  const instantMatch = findBestInstantMatch(question);
  if (instantMatch) {
    const instantText = `${instantMatch.answer}\n\n*Office: ${instantMatch.office || "Official UPang Office"} | Source: ${instantMatch.source || "Official UPang Guide"}*`;
    if (wantStream) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.end(instantText);
    }
    return res.json({ text: instantText, provider: "instant_knowledge_base" });
  }

  // Semantic search understands paraphrases (for example, "register for classes"
  // can find the enrollment guide). Keyword search remains a safe fallback.
  let references = findRelevantReferences(question);
  try {
    const semanticReferences = await findSemanticReferences(question, getKnowledgeBase());
    if (semanticReferences.length > 0) references = semanticReferences;
  } catch (error) {
    console.warn("Semantic search unavailable; using keyword search:", error.message);
  }
  const referenceContext = formatReferences(references);
  const provider = (process.env.LLM_PROVIDER || "ollama").toLowerCase();

  try {
    // 2. Streamed generation with local LLM for real-time word-by-word display
    if (provider === "ollama" && wantStream) {
      return await streamAnswerWithOllama(question, referenceContext, res);
    }

    let text = "";
    if (provider === "ollama") {
      text = await generateAnswerWithOllama(question, referenceContext);
    } else {
      text = references.length > 0
        ? `${references[0].answer}\n\n*Source: ${references[0].source || "UPang Knowledge Base"} (${references[0].office || "Official Office"})*`
        : "I do not have enough verified information to answer this question. Please contact the appropriate UPang office for assistance.";
    }

    if (!text) {
      return res.status(502).json({ error: "Chatbot returned an empty answer" });
    }

    return res.json({ text, provider });
  } catch (error) {
    console.error(`Chat error (${provider}):`, error.message);

    // If local LLM is starting up or temporarily unavailable, use direct reference fallback
    if (references.length > 0) {
      const top = references[0];
      const fallbackText = `${top.answer}\n\n*Office: ${top.office || "Official Office"} | Source: ${top.source || "Official UPang Guidelines"}*`;
      if (wantStream) {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        return res.end(fallbackText);
      }
      return res.json({ text: fallbackText, fallback: true });
    }

    return res.status(503).json({
      error: `Could not connect to ${provider.toUpperCase()} (${error.message}). Please ensure Ollama is running ('ollama serve').`
    });
  }
});

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/upang-assist")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err.message));

app.use("/api/tasks", taskRoutes);

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
