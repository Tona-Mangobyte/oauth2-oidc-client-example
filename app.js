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
    // res.redirect('http://34.146.165.124:286/oidc/auth?client_id=roomth&scope=openid%20profile%20email%20name&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A9091%2Fcallback&response_mode=query&code_challenge=UFXxsANC_ZyghTr8CBZBPYRBR-Rsr0qqwdrU1h4j07Q&code_challenge_method=S256');
})

app.get('/callback', async (req, res) => {
    if (req.query.error) {
        res.render('callback', { userinfo: req.query.error});
        return;
    }
    try {
        // Extract the authorization code and other params from the query
        const params = client.callbackParams(req);
        console.info(params);
        // Exchange the authorization code for a token set
        console.info(`Generated code verifier ${codeVerifier}`);
        const tokenSet = await client.callback(process.env.redirectUri, params, { code_verifier: codeVerifier });
        // Request userinfo with the obtained access token
        const userinfo = await client.userinfo(tokenSet);
        console.info(tokenSet);
        // Render or process the userinfo
        res.render('callback', { userinfo: JSON.stringify(userinfo) });
    } catch (error) {
        // Handle exceptions, such as network errors or invalid responses
        console.error('Error handling callback:', error);
        res.render('callback', { userinfo: 'An error occurred while fetching userinfo.' });
    }
})

// Start the server
app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
})