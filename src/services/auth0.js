const jwksClient = require('jwks-rsa');
const jwt = require('jsonwebtoken');
const util = require('util');

process.env.AUTH0_DOMAIN = 'https://dev-7yp156lleklcumhn.us.auth0.com/';
const client = jwksClient({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10, // Default value
  jwksUri: `${process.env.AUTH0_DOMAIN}.well-known/jwks.json`,
});

const getPolicyDocument = (effect, resource) => {
  const policyDocument = {
    Version: '2012-10-17', // default version
    Statement: [{
      Action: 'execute-api:Invoke', // default action
      Effect: effect,
      Resource: resource,
    }],
  };
  return policyDocument;
};

// extract and return the Bearer Token from the Lambda event parameters
const getToken = (params) => {
  if (!params.type || params.type !== 'REQUEST') {
    throw new Error('Expected "event.type" parameter to have value "REQUEST"');
  }

  const tokenString = params.headers.authorization;
  if (!tokenString) {
    throw new Error('Expected "event..authorization" parameter to be set');
  }

  const match = tokenString.match(/^Bearer (.*)$/);
  if (!match || match.length < 2) {
    throw new Error(`Invalid Authorization token - ${tokenString} does not match "Bearer .*"`);
  }
  return match[1];
};

const jwtOptions = {
  audience: `${process.env.AUTH0_DOMAIN}api/v2/`,
  issuer: process.env.AUTH0_DOMAIN,
};

module.exports.authenticate = async (params) => {
  const token = getToken(params);

  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || !decoded.header || !decoded.header.kid) {
    throw new Error('invalid token');
  }
  const getSigningKey = util.promisify(client.getSigningKey);
  return getSigningKey(decoded.header.kid)
    .then((key) => {
      const signingKey = key.publicKey || key.rsaPublicKey;
      return jwt.verify(token, signingKey, jwtOptions);
    })
    .then((decodedPayload) => ({
      principalId: decodedPayload.sub,
      policyDocument: getPolicyDocument('Allow', params.routeArn),
      context: { scope: decodedPayload.scope },
    }));
};
