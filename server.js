require("dotenv").config();
const path = require("path");
var express = require('express');
var port = 3030;
var cors = require('cors');
const session = require("express-session");
const { v4: uuidv4 } = require("uuid");
const setupAuth = require('./config');
var app = express();
app.use(cors());

const scopes = process.env.OPENID_SCOPE;
const oauthScopes = scopes.split(' ');
console.log('scopes',oauthScopes);

const ignoredRoutes = [
  '/api/message'
];

if (process.env.AUTH_ENABLED === 'true') {
  console.log('***************Auth Enabled ***************');
  // authentication.ignore(ignoredRoutes);

  app.use(
    session({
      secret: uuidv4(),
      resave: true,
      saveUninitialized: true,
      rolling: true,
      cookie: {
        // secure: true,
        secure: false, // This for local development
        httpOnly: true,
        maxage: 30 * 60 * 1000
      }
    })
  );

  const config = {
    azureAd: {
      clientId: process.env.OPENID_CLIENT_ID,
      clientSecret: process.env.OPENID_CLIENT_SECRET,
      scopes: process.env.OPENID_SCOPE,
      tenant: process.env.OPENID_TENANT_ID
    }
  };
  setupAuth(app, config);

  // authentication.authenticate(app);
  console.log('auth successfull');
}
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3030");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  if (!ignoredRoutes.includes(req.path) && req.session && req.session.user) {
    const payload = req.session.user;
    res.locals.cid = payload.uid;
    res.locals.session = payload.exp;
    res.locals.email = payload.email;
    res.locals.oid = payload.oid;
    next();
  } else {
    res.redirect('/login');
  }
});

app.get('/hello', function (req, res) {
  res.send('Hello World!');
});


app.get('/api/message', async (req, res) => {
  const accessToken = req.session.accessToken;

  if (!accessToken) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // Set CORS headers to allow requests from your frontend origin
  res.header('Access-Control-Allow-Origin', 'http://localhost:3030');
  res.header('Access-Control-Allow-Credentials', true);

  // Set Authorization header with the access token
  res.header('Authorization', `Bearer ${accessToken}`);
  res.json({ message: 'Hello from backend!' });
});

app.use(express.static(path.join(__dirname, "client/build")));
// app.use(AWSXRay.express.closeSegment());

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`);
});