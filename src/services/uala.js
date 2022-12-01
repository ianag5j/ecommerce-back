const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const UalaBis = require('ualabis-nodejs');
const { CustomError, ERROR_CODES: { USER_NOT_HAS_CREDENTIALS, UALA_ERROR } } = require('../lib/error');

const docClient = new DynamoDBClient();

module.exports.getCredentials = async (userId) => {
  const { Item: ualaCredentials } = await docClient.send(new GetItemCommand({
    TableName: process.env.CREDENTIALS_TABLE,
    Key: {
      UserId: { S: userId },
      Provider: { S: 'Uala' },
    },
  }));
  if (!ualaCredentials) {
    throw new CustomError(USER_NOT_HAS_CREDENTIALS);
  }
  return ualaCredentials;
};

module.exports.createOrder = async (order, storeName, storeUserId) => {
  const credentials = await this.getCredentials(storeUserId);
  try {
    await UalaBis.setUp({
      userName: credentials.externalUserName.S,
      clientId: credentials.externalClientId.S,
      clientSecret: credentials.externalClientSecret.S,
      isDev: true,
    });
    return await UalaBis.createOrder({
      amount: parseFloat(order.Amount.S),
      // description: `${storeName} Order ${order.Id.S}`,
      description: `${storeName} Order`,
      callbackFail: `${process.env.FRONT_BASE_URL}/fail`,
      callbackSuccess: `${process.env.FRONT_BASE_URL}/success`,
      notificationUrl: `${process.env.LAMBDA_URL}/webhook/order/${order.Id.S}`,
    });
  } catch (error) {
    console.log(error);
    throw new CustomError(UALA_ERROR);
  }
};
