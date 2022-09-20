const jwt_decode = require('jwt-decode');
const { DynamoDBClient, QueryCommand, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { v4 } = require('uuid');

const docClient = new DynamoDBClient();

module.exports.getProducts = async (event) => {
  try {
    const accessToken = event.headers.authorization.replace('Bearer ', '');
    const decodedToken = jwt_decode(accessToken);

    const { Items } = await  docClient.send(new QueryCommand({
      TableName: process.env.PRODUCTS_TABLE,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: "UserId = :userId",
      ExpressionAttributeValues: {
        ":userId": { S: decodedToken.sub}
      },
      Select: "ALL_PROJECTED_ATTRIBUTES",
    }))
    console.log('Items: ', Items);
    const products = Items.map(({Name, Id, Price}) => ({name: Name.S, id: Id.S, price: Price.S}))
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ products }),
    }
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error, message: error.message }),
    }
  }
}

module.exports.createProduct = async (event) => {
  try {
    const accessToken = event.headers.authorization.replace('Bearer ', '');
    const decodedToken = jwt_decode(accessToken);
    const body = JSON.parse(event.body)
    const Item = {
      Id: {S: v4()},
      Name: {S: body.name},
      UserId: {S: decodedToken.sub},
      Price: {S: body.price}
    }
    console.log({
      TableName: process.env.PRODUCTS_TABLE,
      Item
    });
    await  docClient.send(new PutItemCommand({
      TableName: process.env.PRODUCTS_TABLE,
      Item
    }))
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Item }),
    }
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error, message: error.message }),
    }
  }
}

module.exports.getProduct = async (event) => {
  console.log('event: ', event);
  try {
    const productId = event.pathParameters.id
    const {Item: product} = await docClient.send(new GetItemCommand({
      TableName: process.env.PRODUCTS_TABLE,
      Key: {
        Id: {S: productId}
      }
    }))
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product }),
    }
  } catch (error) {
    console.log(error);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error, message: error.message }),
    }
  }
}