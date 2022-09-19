const AWS = require('aws-sdk');
const jwt_decode = require('jwt-decode');


const docClient = new AWS.DynamoDB.DocumentClient();

module.exports.saveCredentials = async (event) => {
  console.log('Event: ', event);
  try {
    const accessToken = event.headers.authorization.replace('Bearer ', '');
    const decodedToken = jwt_decode(accessToken);
    const body = JSON.parse(event.body)
    const Item = {
      UserId: decodedToken.sub,
      Provider: 'Uala',
      externalClientId: body.externalClientId,
      externalClientSecret: body.externalClientSecret,
      externalUserName: body.externalUserName
  }
  const params = {
    TableName: process.env.CREDENTIALS_TABLE,
    Item
  }
  console.log(params);
  await docClient.put(params).promise()
  return {
    statusCode: 201,
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
      body: JSON.stringify({ error }),
    }
  }
}

module.exports.getCredentials = async (event) => {
  console.log('Event: ', event);
  try {
    const accessToken = event.headers.authorization.replace('Bearer ', '');
    const decodedToken = jwt_decode(accessToken);
    const params = {
      TableName: process.env.CREDENTIALS_TABLE,
      Key: {
        UserId: decodedToken.sub,
        Provider: event.queryStringParameters.provider,
      }
    }
  console.log(params);
  const { Item } = await docClient.get(params).promise()
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ credentials: Item }),
  }
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error }),
    }
  }
}