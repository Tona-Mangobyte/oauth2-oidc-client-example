import express from 'express';
import * as path from "node:path";
import { fileURLToPath } from 'url';
import { Issuer, generators } from 'openid-client';

const app = express()
const PORT = 3000

// Convert URL to path for __dirname equivalent
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    console.info('Init request')
    res.render('hello', { name: 'Tona' })
})

app.get('/login', (req, res) => {
    res.render('login')
})

// Discover the OIDC Provider's Configuration
const issuer = await Issuer.discover('http://localhost:9000/oidc');
// Create a Client Instance
const client = new issuer.Client({
    client_id: 'roomth3',
    client_secret: 'foobar',
    redirect_uris: ['http://localhost:3000/callback'],
    response_types: ['code'],
});
// Generate Code Verifier and Challenge for PKCE (Optional)
const codeVerifier = generators.codeVerifier();
app.get('/request/login', async (req, res) => {
    const codeChallenge = generators.codeChallenge(codeVerifier);

    // Build the Authorization URL
    const authorizationUrl = client.authorizationUrl({
        scope: 'openid email profile',
        response_mode: 'query',
        // nonce: generators.nonce(),
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
    });

    // Redirect the user to the authorization URL
    res.redirect(authorizationUrl);
})

app.get('/callback', async (req, res) => {
    const code = req.query.code;
    console.info(req.query);
    const params = client.callbackParams(req);
    const tokenSet = await client.callback('http://localhost:3000/callback', params, { code_verifier: codeVerifier });
    const userinfo = await client.userinfo(tokenSet);
    console.info(userinfo);
    res.render('callback', { code, userinfo: JSON.stringify(userinfo) })
})

// Start the server
app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
})