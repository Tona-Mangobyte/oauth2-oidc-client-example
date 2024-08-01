## ❯ Getting Started

### Step 1: Build the Authorization URL
    
```
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
```

### Step 2: Listen callback from SSO

``` 
app.get(`/callback`, async (req, res) => {
    const { code } = req.query;
    // Authorization Code is received
    console.log('code', code);
});
```

### Step 2.1: Exchange Authorization Code for Access Token

```
    // Define the Token Endpoint and Query Parameters
    const params = {
        client_id: process.env.clientId,
        client_secret: process.env.clientSecret,
        redirect_uri: process.env.redirectUri,
        grant_type: 'authorization_code',
        code,
        code_verifier: codeVerifier,
    };
    // Exchange Authorization Code for Access Token
    const response = await axios.post(`${process.env.SSO_URL}/token`, new URLSearchParams(params), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    // Access Token is received
    console.log('access_token', response.data.access_token);
```

### Step 2.2: Retrieve User Information

```
    // Define the User Info Endpoint and Query Parameters
    const response = await axios.get(`${process.env.SSO_URL}/me`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    // User Information is received
    console.log('user', response.data);
```