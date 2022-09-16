const AWS = require('aws-sdk');
const jwt_decode = require('jwt-decode');


const docClient = new AWS.DynamoDB.DocumentClient();

module.exports.handler = async (event) => {
  console.log('Event: ', event);
  try {
    const accessToken = event.headers.authorization.replace('Bearer ', '');
    const decodedHeader = jwt_decode(accessToken, { header: true });
    console.log('DecodedHeader: ', decodedHeader);
    const body = JSON.parse(event.body)
    const Item = {
      UserId: body.userId,
      Provider: 'Uala',
      externalClientId: body.clientId,
      externalClientSecret: body.clientSecret,
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