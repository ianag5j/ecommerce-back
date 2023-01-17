const jwtDecode = require('jwt-decode');
const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { createOrder } = require('./services/orders');

const docClient = new DynamoDBClient();

module.exports.createOrder = async (event) => {
  try {
    const { storeName, cart } = JSON.parse(event.body);
    const order = await createOrder(cart, storeName);
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order),
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

module.exports.getOrders = async (event) => {
  try {
    const accessToken = event.headers.authorization.replace('Bearer ', '');
    const decodedToken = jwtDecode(accessToken);
    const { Items } = await docClient.send(new QueryCommand({
      TableName: process.env.ORDERS_TABLE,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'UserId = :userId',
      ExpressionAttributeValues: {
        ':userId': { S: decodedToken.sub },
      },
      Select: 'ALL_PROJECTED_ATTRIBUTES',
    }));
    console.log('Items: ', Items);
    const orders = Items.map((order) => {
      const formatedOrder = {};
      Object.keys(order).forEach((key) => {
        const [type] = Object.keys(order[key]);
        formatedOrder[key] = order[key][type];
      });
      return formatedOrder;
    });
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orders }),
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
