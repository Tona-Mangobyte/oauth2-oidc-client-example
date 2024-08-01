import express from 'express';
import * as path from "node:path";
import axios from 'axios';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const app = express()
const PORT = process.env.PORT || 3000;
const PREFIX = process.env.PREFIX || '';

// Convert URL to path for __dirname equivalent
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('login', { prefix: PREFIX})
})

// Generate Code Verifier and Challenge for PKCE (Optional)
const codeVerifier = "ZNLNUFZNHOKx8VYDG5cTyob0VqB6a8YFqnbNmFqq5Cw";
const codeChallenge = "ahY8rbMTtgmDoqjTmSq1T1sUjTIEpDL7acbfoZXkVcI";
app.get(`/request/login`, async (req, res) => {

    // Build the Authorization URL
    // Define the Authorization Endpoint and Query Parameters
    const authorizationEndpoint = `${process.env.SSO_URL}/auth`;
    const params = {
        client_id: process.env.clientId,
        redirect_uri: process.env.redirectUri,
        response_type: 'code',
        scope: process.env.scopes,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
    };
    // Generate the Authorization URL
    const authorizationUrl = `${authorizationEndpoint}?${new URLSearchParams(params).toString()}`;
    // Log the Authorization URL
    console.log(`Authorization URL: ${authorizationUrl}`);

    // Redirect the user to the authorization URL
    res.redirect(authorizationUrl);
})

app.get(`/callback`, async (req, res) => {
    if (req.query.error) {
        res.render('callback', { userinfo: req.query.error});
        return;
    }
    try {
        // Define the token endpoint and request parameters
        const tokenEndpoint = `${process.env.SSO_URL}/token`;
        const params = new URLSearchParams({
            client_id: process.env.clientId,
            client_secret: process.env.clientSecret,
            code: req.query.code,
            redirect_uri: process.env.redirectUri,
            grant_type: 'authorization_code',
            code_verifier: codeVerifier,
        });
        // Make the token request using axios
        const response = await axios.post(tokenEndpoint, params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        // Optionally, request userinfo with the obtained access token
        const userinfo = await axios.get(`${process.env.SSO_URL}/me`, {
            headers: {
                Authorization: `Bearer ${response.data.access_token}`,
            },
        });
        // Render or process the userinfo
        res.render('callback', { userinfo: JSON.stringify(userinfo.data) });
    } catch (error) {
        // Handle exceptions, such as network errors or invalid responses
        console.error('Error handling callback:', error);
        res.render('callback', { userinfo: 'An error occurred while fetching userinfo.' });
    }
})

// it's use for doc https://github.com/mango-byte/roomth-sso?tab=readme-ov-file#-single-sign-on-sso
app.get(`/callback-code`, async (req, res) => {
    if (req.query.error) {
        res.render('code', { code: req.query.error});
        return;
    }
    res.render('code', { code: req.query.code});
})

// Start the server
app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
})