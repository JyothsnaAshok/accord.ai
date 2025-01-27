import fs from "fs";
import path from "path";

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

const genAI = new GoogleGenerativeAI(
  "AIzaSyAHoh - a2CRZZIzKpdefz - Jrw1x9mJ6pz9A",
);
const fileManager = new GoogleAIFileManager(
  "AIzaSyAHoh - a2CRZZIzKpdefz - Jrw1x9mJ6pz9A",
);

// Shared Schema Properties
const complianceStandards = {
  ISO: {
    type: SchemaType.OBJECT,
    properties: {
      compliant: { type: SchemaType.BOOLEAN },
      issues: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    },
  },
  SOC: {
    type: SchemaType.OBJECT,
    properties: {
      compliant: { type: SchemaType.BOOLEAN },
      issues: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    },
  },
  HIPAA: {
    type: SchemaType.OBJECT,
    properties: {
      compliant: { type: SchemaType.BOOLEAN },
      issues: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    },
  },
  GDPR: {
    type: SchemaType.OBJECT,
    properties: {
      compliant: { type: SchemaType.BOOLEAN },
      issues: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    },
  },
  CCPA: {
    type: SchemaType.OBJECT,
    properties: {
      compliant: { type: SchemaType.BOOLEAN },
      issues: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    },
  },
};

// Schema for Draft and In-Review Agreements
const draftInReviewSchema = {
  description: "Insights for draft and in-review agreements",
  type: SchemaType.OBJECT,
  properties: {
    executiveSummary: {
      type: SchemaType.OBJECT,
      description: "High-level summary of the agreement",
      properties: {
        partiesInvolved: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          nullable: false,
        },
        agreementPurpose: { type: SchemaType.STRING, nullable: false },
        effectiveDate: {
          type: SchemaType.STRING,
          nullable: true,
        },
        expiryDate: { type: SchemaType.STRING, nullable: true },
      },
      required: ["partiesInvolved", "agreementPurpose"],
    },
    keyClauses: {
      type: SchemaType.ARRAY,
      description: "Important clauses and their priority",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          clauseName: { type: SchemaType.STRING, nullable: false },
          description: { type: SchemaType.STRING, nullable: false },
          priority: {
            type: SchemaType.STRING,
            enum: ["High", "Medium", "Low"],
            nullable: false,
          },
        },
      },
    },
    complianceInsights: {
      type: SchemaType.OBJECT,
      description: "Compliance evaluation based on standards",
      properties: complianceStandards,
    },
    riskAnalysis: {
      type: SchemaType.ARRAY,
      description: "Risks identified in the agreement",
      items: { type: SchemaType.STRING },
    },
    improvementAreas: {
      type: SchemaType.ARRAY,
      description: "Suggestions to improve the agreement",
      items: { type: SchemaType.STRING },
    },
    remediationSteps: {
      type: SchemaType.ARRAY,
      description: "Steps to resolve risks and compliance gaps",
      items: { type: SchemaType.STRING },
    },
    jurisdiction: {
      type: SchemaType.OBJECT,
      description: "Applicable jurisdiction information",
      properties: {
        governingLaw: { type: SchemaType.STRING },
        disputeResolution: { type: SchemaType.STRING },
      },
    },
    negotiationPoints: {
      type: SchemaType.ARRAY,
      description: "Areas of negotiation or dispute",
      items: { type: SchemaType.STRING },
    },
  },
};

// Schema for Signed Agreements
const signedAgreementSchema = {
  description: "Insights for signed agreements",
  type: SchemaType.OBJECT,
  properties: {
    executiveSummary: { $ref: "#/properties/executiveSummary" },
    keyClauses: { $ref: "#/properties/keyClauses" },
    complianceInsights: { $ref: "#/properties/complianceInsights" },
    obligations: {
      type: SchemaType.ARRAY,
      description: "Obligations and responsibilities of each party",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          party: { type: SchemaType.STRING },
          obligations: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
      },
    },
    riskAnalysis: { $ref: "#/properties/riskAnalysis" },
    remediationSteps: { $ref: "#/properties/remediationSteps" },
    jurisdiction: { $ref: "#/properties/jurisdiction" },
  },
};

// Schema for Expired/Cancelled Agreements
const expiredCancelledSchema = {
  description: "Insights for expired or canceled agreements",
  type: SchemaType.OBJECT,
  properties: {
    negotiationPoints: {
      type: SchemaType.ARRAY,
      description: "Areas of negotiation or dispute",
      items: { type: SchemaType.STRING },
    },
    lessonsLearned: {
      type: SchemaType.ARRAY,
      description: "Key takeaways for future agreements",
      items: { type: SchemaType.STRING },
    },
    terminationDetails: {
      type: SchemaType.OBJECT,
      description: "Details about termination or expiration",
      properties: {
        reason: { type: SchemaType.STRING },
        impact: { type: SchemaType.STRING },
      },
    },
    jurisdiction: { $ref: "#/properties/jurisdiction" },
    riskAnalysis: { $ref: "#/properties/riskAnalysis" },
  },
};

export const uploadToGemini = async (fileUrl, fileName) => {
  try {
    console.log(fileUrl, fileName);
    const fileResponse = await fetch(fileUrl).then((res) => res.arrayBuffer());

    const pdfPath = fileName;
    const binaryPdf = Buffer.from(fileResponse);
    fs.writeFileSync(pdfPath, binaryPdf, "binary");

    const uploadResult = await fileManager.uploadFile(pdfPath, {
      mimeType: "application/pdf",
      displayName: fileName,
    });

    console.log("File uploaded successfully:", uploadResult);
    return uploadResult;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

// Function to Generate Insights for Draft and In-Review Agreements
export const generateDraftInReviewInsights = async (fileUri) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: draftInReviewSchema,
    },
  });

  const result = await model.generateContent([
    {
      fileData: {
        fileUri: fileUri,
        mimeType: "application/pdf",
      },
    },
    "Analyze the draft agreement and provide insights.",
  ]);

  return JSON.parse(result.response.text());
};

// Function to Generate Insights for Signed Agreements
export const generateSignedAgreementInsights = async (fileUri) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: signedAgreementSchema,
    },
  });

  const result = await model.generateContent([
    {
      fileData: {
        fileUri: fileUri,
        mimeType: "application/pdf",
      },
    },
    "Analyze the following signed agreement and provide insights",
  ]);

  return JSON.parse(result.response.text());
};

// Function to Generate Insights for Expired/Cancelled Agreements
export const generateExpiredCancelledInsights = async (fileName) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: expiredCancelledSchema,
    },
  });

  const result = await model.generateContent([
    {
      fileData: {
        fileUri: fileUri,
        mimeType: "application/pdf",
      },
    },
    "Analyze the following expired or cancelled agreement and provide insights",
  ]);

  return JSON.parse(result.response.text());
};
