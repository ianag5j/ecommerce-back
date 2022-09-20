const jwt_decode = require('jwt-decode');
const { DynamoDBClient, QueryCommand, PutItemCommand } = require('@aws-sdk/client-dynamodb');
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

    const products = Items.map(({Name, Id}) => ({name: Name.S, id: Id.S}))
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
    const { Items } = await  docClient.send(new PutItemCommand({
      TableName: process.env.PRODUCTS_TABLE,
      Item: {
        Id: v4(),
        Name: body.name,
        UserId: decodedToken.sub,
        Price: body.price
      }
    }))
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Items }),
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