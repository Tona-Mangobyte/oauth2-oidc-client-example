import express from 'express';
import * as path from "node:path";
import { fileURLToPath } from 'url';
import { Issuer, generators } from 'openid-client';
import 'dotenv/config';

const app = express()
const PORT = process.env.PORT || 3000;

// Convert URL to path for __dirname equivalent
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('login')
})
// Discover the OIDC Provider's Configuration
const issuer = await Issuer.discover(process.env.SSO_URL);
console.info(`Discovered issuer ${process.env.SSO_URL}`);
// Create a Client Instance
const client = new issuer.Client({
    client_id: process.env.clientId,
    client_secret: process.env.clientSecret,
    redirect_uris: [process.env.redirectUri],
    response_types: ['code'],
    token_endpoint_auth_method: 'client_secret_basic',
});
// Generate Code Verifier and Challenge for PKCE (Optional)
const codeVerifier = generators.codeVerifier();
app.get('/request/login', async (req, res) => {
    const codeChallenge = generators.codeChallenge(codeVerifier);

    // Build the Authorization URL
    const authorizationUrl = client.authorizationUrl({
        scope: process.env.scopes,
        response_mode: 'query',
        // nonce: generators.nonce(),
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
    });
    console.info(authorizationUrl);
    // Redirect the user to the authorization URL
    res.redirect(authorizationUrl);
})

app.get('/callback', async (req, res) => {
    const params = client.callbackParams(req);
    const tokenSet = await client.callback(process.env.redirectUri, params, { code_verifier: codeVerifier });
    const userinfo = await client.userinfo(tokenSet);
    res.render('callback', { userinfo: JSON.stringify(userinfo) })
})

// Start the server
app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
})