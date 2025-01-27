import path from "path";
import { fileURLToPath } from "url";
import esign from "docusign-esign";
import { readFileSync } from "fs";
import dayjs from "dayjs";
import jwtConfig from "../config/jwtConfig.json" with { type: "json" };
import { response } from "express";

const { ApiClient } = esign;
const oAuth = ApiClient.OAuth;

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

// Constants
const rsaKey = readFileSync(path.resolve(__dirname, "../private.key"));
const jwtLifeSec = 60 * 60; // Request lifetime of JWT token is 60 minutes
const scopes = "signature";

const oAuthBasePath = oAuth.DEMO_OAUTH_BASE_PATH;

/**
 * Creates and sends a JWT token using the integration key, user ID, scopes and RSA key.
 * Then stores the returned access token and expiration date.
 */
const getToken = async (req) => {
  // Get API client and set the base paths
  console.log("Getting token");
  const eSignApi = new ApiClient();
  console.log(oAuthBasePath);
  eSignApi.setOAuthBasePath(jwtConfig.dsOauthServer.replace("https://", ""));

  // Request a JWT token
  let results;

  results = await eSignApi.requestJWTUserToken(
    jwtConfig.dsJWTClientId,
    jwtConfig.impersonatedUserGuid,
    scopes,
    rsaKey,
    jwtLifeSec,
  );

  // Save the access token and the expiration timestamp
  const expiresAt = dayjs().add(results.body.expires_in, "s");
  req.session.docuSignAccessToken = results.body.access_token;
  req.session.tokenExpirationTimestamp = expiresAt;
};

/**
 * Checks to see that the current access token is still valid, and if not,
 * updates the token.
 * Must be called before every DocuSign API call.
 */
export const checkToken = async (req) => {
  try {
    const noToken =
        !req.session.docuSignAccessToken ||
        !req.session.tokenExpirationTimestamp,
      currentTime = dayjs(),
      bufferTime = 1; // One minute buffer time

    // Check to see if we have a token or if the token is expired
    let needToken =
      noToken ||
      dayjs(req.session.tokenExpirationTimestamp)
        .subtract(bufferTime, "m")
        .isBefore(currentTime);

    // Update the token if needed
    if (needToken) {
      await getToken(req);
    }
  } catch (error) {
    console.log(error);
    if (
      error.response.body.error &&
      error.response.body.error === "consent_required"
    ) {
      throw new Error("Consent required");
    } else {
      throw error;
    }
  }
};
