import * as geminiService from "../services/gemini.js";

export const uploadFileToGemini = async (req, res) => {
  const { url, name } = req.body;

  if (!url || !name) {
    return res.status(400).json({ error: "File URL and name are required" });
  }
  try {
    const result = await geminiService.uploadToGemini(url, name);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error uploading file:", error);
    res
      .status(500)
      .json({ error: "File upload failed", details: error.message });
  }
};

export const getDraftAgreementInsights = async (req, res) => {
  const { fileUri } = req.body;

  if (!fileUri) {
    return res.status(400).json({ error: "File URI is required" });
  }

  try {
    const result = await geminiService.generateDraftInReviewInsights(fileUri);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error generating insights:", error);
    res
      .status(500)
      .json({ error: "Insights generation failed", details: error.message });
  }
};

export const getOnGoingAgreementInsights = async (req, res) => {
  const { fileUri } = req.body;

  if (!fileUri) {
    return res.status(400).json({ error: "File URI is required" });
  }

  try {
    const result = await geminiService.generateSignedAgreementInsights(fileUri);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error generating insights:", error);
    res
      .status(500)
      .json({ error: "Insights generation failed", details: error.message });
  }
};

export const getExpiredAgreementInsights = async (req, res) => {
  const { fileUri } = req.body;

  if (!fileUri) {
    return res.status(400).json({ error: "File URI is required" });
  }

  try {
    const result = await geminiService.generateExpiredCancelledInsights(
      fileUri,
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Error generating insights:", error);
    res
      .status(500)
      .json({ error: "Insights generation failed", details: error.message });
  }
};
