const jwtDecode = require('jwt-decode');
const {
  DynamoDBClient, PutItemCommand, UpdateItemCommand, GetItemCommand,
} = require('@aws-sdk/client-dynamodb');
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
      // ExternalId: { S: body.externalId },
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

module.exports.webhook = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { orderId } = event.pathParameters;
    console.log('OrderId: ', orderId);
    console.log('body: ', body);
    console.log({
      TableName: process.env.ORDERS_TABLE,
      Key: {
        Id: { S: orderId },
      },
      UpdateExpression: 'set UpdatedAt = :u, Status = :s',
      ExpressionAttributeValues: {
        ':u': (new Date()).toISOString(),
        ':s': body.status,
      },
      ReturnValues: 'ALL_NEW',
    });
    const data = await docClient.send(new UpdateItemCommand({
      TableName: process.env.ORDERS_TABLE,
      Key: {
        Id: { S: orderId },
      },
      UpdateExpression: 'set #u = :u, #s = :s, #eId = :eId',
      ExpressionAttributeValues: {
        ':u': { S: (new Date()).toISOString() },
        ':s': { S: body.status },
        ':eId': { S: body.uuid },
      },
      ExpressionAttributeNames: {
        '#s': 'Status',
        '#u': 'UpdatedAt',
        '#eId': 'ExternalId',
      },
      ReturnValues: 'ALL_NEW',
    }));
    console.log(data);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
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
