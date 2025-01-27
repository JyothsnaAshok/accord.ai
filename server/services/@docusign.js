import eSignSdk from "docusign-esign";
import axios from "axios";

const ESignBasePath = eSignSdk.ApiClient.RestApi.BasePath.DEMO;
const TEMPLATE_ID = process.env.DOCUSIGN_TEMPLATE_ID;
const ACCOUNT_ID = process.env.DOCUSIGN_ACCOUNT_ID;

class ESignService {
  constructor() {
    this.eSignApi = new eSignSdk.ApiClient();
    this.eSignApi.setBasePath(ESignBasePath);
  }

  setAuthHeader(accessToken) {
    this.eSignApi.addDefaultHeader("Authorization", "Bearer " + accessToken);
  }

  async createEnvelopeDraft(recipients, accessToken) {
    this.setAuthHeader(accessToken);
    const envelopesApi = new eSignSdk.EnvelopesApi(this.eSignApi);

    let envelopeDefinition = new eSignSdk.EnvelopeDefinition();
    envelopeDefinition.templateId = TEMPLATE_ID;
    envelopeDefinition.templateRoles = recipients.map((reviewer, index) => ({
      email: reviewer.email,
      name: reviewer.name,
      roleName: `Reviewer ${index + 1}`,
      clientUserId: `${index + 1}`,
      tabs: {
        signHereTabs: [
          {
            anchorString: `{{Reviewer${index + 1}_Signature}}`,
            anchorYOffset: "0",
            anchorXOffset: "0",
            anchorUnits: "pixels",
          },
        ],
        textTabs: [
          {
            anchorString: `{{Reviewer${index + 1}_Comment}}`,
            anchorYOffset: "0",
            anchorXOffset: "0",
            anchorUnits: "pixels",
            width: "300",
            height: "50",
            value: "",
            locked: false,
          },
        ],
      },
    }));

    envelopeDefinition.status = "created";

    const { envelopeId } = await envelopesApi.createEnvelope(ACCOUNT_ID, {
      envelopeDefinition,
    });

    console.log(`Envelope created with ID: ${envelopeId}`);
    return envelopeId;
  }

  async fetchDocumentFromUrl(url) {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(response.data).toString("base64");
  }

  async addDocumentToEnvelope(
    envelopeId,
    documentName,
    fileContent,
    accessToken,
  ) {
    console.log("Adding document to envelope");
    console.log(envelopeId, documentName, accessToken);
    this.setAuthHeader(accessToken);
    const envelopesApi = new eSignSdk.EnvelopesApi(this.eSignApi);

    let document = new eSignSdk.Document();
    document.documentBase64 = fileContent;
    document.name = "Verification Document";
    document.fileExtension = "pdf";
    document.documentId = Math.floor(Math.random() * 1000).toString();

    console.log(document);

    const updateResult = await envelopesApi.updateDocuments(
      ACCOUNT_ID,
      envelopeId,
      {
        envelopeDefinition: { documents: [document] },
      },
    );

    console.log(`Document added to envelope: ${updateResult}`);
    return updateResult;
  }

  async sendEnvelope(envelopeId, accessToken) {
    this.setAuthHeader(accessToken);
    const envelopesApi = new eSignSdk.EnvelopesApi(this.eSignApi);
    const results = await envelopesApi.listRecipients(ACCOUNT_ID, envelopeId);

    console.log("tabs", results);

    const sentResult = await envelopesApi.update(ACCOUNT_ID, envelopeId, {
      envelope: { status: "sent" },
    });

    console.log(`Envelope sent: ${sentResult}`);
    return sentResult;
  }

  async getEmbeddedSigningUrl(
    envelopeId,
    recipient,
    index,
    accessToken,
    redirectUrl,
  ) {
    this.setAuthHeader(accessToken);
    const envelopesApi = new eSignSdk.EnvelopesApi(this.eSignApi);

    let viewRequest = new eSignSdk.RecipientViewRequest();
    viewRequest.authenticationMethod = "none";
    viewRequest.clientUserId = `${index + 1}`; // Same as clientUserId in `createEnvelopeDraft`
    viewRequest.recipientId = `${index + 1}`;
    viewRequest.returnUrl = redirectUrl;
    viewRequest.userName = recipient.name;
    viewRequest.email = recipient.email;

    const { url } = await envelopesApi.createRecipientView(
      ACCOUNT_ID,
      envelopeId,
      { recipientViewRequest: viewRequest },
    );
    console.log(`Embedded signing URL created for ${recipient.name}: ${url}`);
    return url;
  }

  async processEnvelope(url, recipients, accessToken, redirectUrl) {
    try {
      const envelopeId = await this.createEnvelopeDraft(
        recipients,
        accessToken,
      );
      const fileContent = await this.fetchDocumentFromUrl(url);
      console.log("File content fetched successfully");
      await this.addDocumentToEnvelope(
        envelopeId,
        "Agreement Document",
        fileContent,
        accessToken,
      );
      console.log("Document added to envelope");
      await this.sendEnvelope(envelopeId, accessToken);
      console.log("Envelope sent");

      // Generate embedded signing URLs for each recipient
      const signingUrls = await Promise.all(
        recipients.map((recipient, index) =>
          this.getEmbeddedSigningUrl(
            envelopeId,
            recipient,
            index,
            accessToken,
            redirectUrl,
          ),
        ),
      );

      return { envelopeId, signingUrls };
    } catch (error) {
      console.error("Error processing envelope:", error);
      throw error;
    }
  }
}

export default new ESignService();
