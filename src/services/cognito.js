const {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

module.exports.getUserByName = async (userName) => {
  const cognitoClient = new CognitoIdentityProviderClient();
  const cognitoCommand = new ListUsersCommand({ Filter: `name = "${userName}"`, Limit: 1, UserPoolId: process.env.USER_POOL_ID });
  const { Users } = await cognitoClient.send(cognitoCommand);
  if (!Users) {
    return null;
  }
  return Users[0];
};
