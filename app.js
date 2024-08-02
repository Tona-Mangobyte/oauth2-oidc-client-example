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

// Generate Code Verifier and Challenge for PKCE
const codeVerifier = "ZNLNUFZNHOKx8VYDG5cTyob0VqB6a8YFqnbNmFqq5Cw";
const codeChallenge = "ahY8rbMTtgmDoqjTmSq1T1sUjTIEpDL7acbfoZXkVcI";

// Build the Authorization URL
app.get(`/request/login`, async (req, res) => {

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

    // Redirect the user to the authorization URL
    res.redirect(authorizationUrl);
})

// listen the callback from SSO
app.get(`/callback`, async (req, res) => {
    if (req.query.error) {
        res.render('callback', { userinfo: req.query.error});
        return;
    }
    try {
        // Encode the concatenated string to Base64
        const base64EncodedCredentials = Buffer.from(`${process.env.clientId}:${process.env.clientSecret}`).toString('base64');
        // Define the token endpoint and request parameters
        const params = new URLSearchParams({
            code: req.query.code,
            redirect_uri: process.env.redirectUri,
            grant_type: 'authorization_code',
            code_verifier: codeVerifier,
        });
        // Make the token request using axios
        const response = await axios.post(`${process.env.SSO_URL}/token`, params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${base64EncodedCredentials}`,
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