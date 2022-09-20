const jwtDecode = require('jwt-decode');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { v4 } = require('uuid');

const docClient = new DynamoDBClient();

module.exports.createOrder = async (event) => {
  try {
    const accessToken = event.headers.authorization.replace('Bearer ', '');
    const decodedToken = jwtDecode(accessToken);
    const body = JSON.parse(event.body);
    const Item = {
      Id: { S: v4() },
      UserId: { S: decodedToken.sub },
      ExternalId: { S: body.externalId },
      Status: { S: 'CREATED' },
      Amount: { S: body.amount },
      CreatedAt: { S: (new Date()).toISOString() },
      UpdatedAt: { S: (new Date()).toISOString() },
    };
    console.log('Item: ', Item);
    await docClient.send(new PutItemCommand({
      TableName: process.env.ORDERS_TABLE,
      Item,
    }));
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order: Item }),
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error, message: error.message }),
    };
  }
};
