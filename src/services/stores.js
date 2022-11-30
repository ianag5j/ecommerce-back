const {
  DynamoDBClient, QueryCommand, GetItemCommand, PutItemCommand,
} = require('@aws-sdk/client-dynamodb');
const { v4 } = require('uuid');
const { default: CustomError, ERROR_CODES } = require('../lib/error');

const docClient = new DynamoDBClient();

module.exports.getStoreByName = async (storeName) => {
  const { Item: store } = await docClient.send(new GetItemCommand({
    TableName: process.env.STORES_TABLE,
    Key: {
      Name: { S: storeName },
    },
  }));
  return store;
};

module.exports.getStoreByUser = async (userId) => {
  const { Items: [store] } = await docClient.send(new QueryCommand({
    TableName: process.env.STORES_TABLE,
    IndexName: 'UserIdIndex',
    KeyConditionExpression: 'UserId = :userId',
    ExpressionAttributeValues: {
      ':userId': { S: userId },
    },
    Select: 'ALL_PROJECTED_ATTRIBUTES',
  }));
  if (!store) {
    return null;
  }
  return {
    Name: store.Name.S,
    UserId: store.UserId.S,
  };
};

module.exports.createStore = async (storeName, userId) => {
  const [storeByName, storeByUser] = await Promise.all([
    this.getStoreByName(storeName), this.getStoreByUser(userId),
  ]);

  if (storeByName) {
    throw new CustomError(ERROR_CODES.STORE_NAME_USED);
  }
  if (storeByUser) {
    throw new CustomError(ERROR_CODES.USER_ALREADY_HAS_STORE);
  }

  const Item = {
    Id: { S: v4() },
    Name: { S: storeName },
    UserId: { S: userId },
  };

  await docClient.send(new PutItemCommand({
    TableName: process.env.STORES_TABLE,
    Item,
  }));

  return Item;
};
