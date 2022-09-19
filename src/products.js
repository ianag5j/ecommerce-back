const jwt_decode = require('jwt-decode');
const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');

const docClient = new DynamoDBClient();

module.exports.getProducts = async (event) => {
  try {
    const accessToken = event.headers.authorization.replace('Bearer ', '');
    const decodedToken = jwt_decode(accessToken);

    const params = {
      TableName: process.env.PRODUCTS_TABLE,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: "UserId = :userId",
      ExpressionAttributeValues: {
        ":userId": { S: decodedToken.sub}
      }
    }
    console.log(params);
    const { Items } = await  docClient.send(new QueryCommand(params))

    console.log("result: ", Items);
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