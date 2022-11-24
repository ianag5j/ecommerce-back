const jwtDecode = require('jwt-decode');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { getProductsByUserId } = require('./services/products');
const { getStore } = require('./services/stores');

module.exports.getProducts = async (event) => {
  console.log('event: ', event);
  const store = await getStore(event.pathParameters.storeName);
  console.log(store);
  const products = await getProductsByUserId(store.UserId.S);
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ products }),
  };
};

module.exports.createStore = async (event) => {
  try {
    console.log('event: ', event);
    const accessToken = event.headers.authorization.replace('Bearer ', '');
    const decodedToken = jwtDecode(accessToken);
    const body = JSON.parse(event.body);

    const docClient = new DynamoDBClient();

    const Item = {
      Name: { S: body.name },
      UserId: { S: decodedToken.sub },
    };
    console.log({
      TableName: process.env.STORES_TABLE,
      Item,
    });
    await docClient.send(new PutItemCommand({
      TableName: process.env.STORES_TABLE,
      Item,
    }));
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Item }),
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
