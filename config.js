const msal = require("@azure/msal-node"); // Use MSAL library for authentication

function setupAuth(app, config) {
    console.log('entered setup auth')
  var msalApp;

  const { scopes } = config.azureAd;
  const oauthRedirectUri = process.env.OPENID_CALLBACK;
  const oauthScopes = scopes.split(/\s+/);

  let msalAppConfig = (function(config) {
    let done = false;
    return function(config) {
      if (!done) {
        done = true;
        const { clientId, clientSecret, tenant } = config.azureAd;
        msalApp = new msal.ConfidentialClientApplication({
          auth: {
            authority: process.env.OPENID_ISSUER,
            clientId,
            clientSecret
          }
        });
      }
    };
  })();
  msalAppConfig(config);

  app.get('/login', async (_req, res) => {
    console.log('entered login')
    try {
      const authUrl = await msalApp.getAuthCodeUrl({
        scopes: oauthScopes,
        redirectUri: oauthRedirectUri
      });

      res.header('Access-Control-Allow-Origin', 'http://localhost:3030'); 
      res.redirect(authUrl);
    } catch (err) {
      console.log(err);
    }
  });
  app.get('/auth/callback', async (req, res, next) => {
    try {
      const authRes = await msalApp.acquireTokenByCode({
        code: req.query.code,
        redirectUri: oauthRedirectUri,
        scopes: oauthScopes
      });

      if (!authRes) {
        res.status(500);
      }
      req.session.accessToken = authRes.accessToken;
      req.session.user = authRes.account.idTokenClaims;
      console.log('before redirect')
      res.header('Access-Control-Allow-Origin', 'http://localhost:3030'); 
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      res.header('Authorization', `Bearer ${req.session.accessToken}`);
      res.redirect('/');
    } catch (err) {
      next(err);
    }
  });
}

module.exports = setupAuth;