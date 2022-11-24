const {
  DynamoDBClient, QueryCommand, PutItemCommand, GetItemCommand,
} = require('@aws-sdk/client-dynamodb');

const docClient = new DynamoDBClient();

module.exports.getStore = async (storeName) => {
  const { Item: store } = await docClient.send(new GetItemCommand({
    TableName: process.env.STORES_TABLE,
    Key: {
      Name: { S: storeName },
    },
  }));
  return store;
};
