import ESignService from "../services/@docusign.js";
import { checkToken } from "./docusignJWTAuth.js";

class ESignController {
  async createAndSendEnvelope(req, res) {
    await checkToken(req);
    const { url, recipients, redirectUrl } = req.body;
    console.log(req.session);
    const accessToken = req.session.docuSignAccessToken; // Access token from session

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Access token missing",
      });
    }

    if (!redirectUrl) {
      return res
        .status(400)
        .json({ success: false, message: "Redirect URL is required" });
    }

    try {
      const { envelopeId, signingUrls } = await ESignService.processEnvelope(
        url,
        recipients,
        accessToken,
        redirectUrl,
      );

      res.status(200).json({
        success: true,
        envelopeId,
        signingUrls, // Array of embedded signing URLs for each recipient
      });
    } catch (error) {
      console.error("Error in createAndSendEnvelope:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new ESignController();
