const { DynamoDBClient, GetItemCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');
const formatItem = require('../lib/formatItem');

const docClient = new DynamoDBClient();

module.exports.getProductsByIds = async (productsIds) => {
  const dynamoRequests = [];
  productsIds.forEach((productId) => {
    dynamoRequests.push(docClient.send(new GetItemCommand({
      TableName: process.env.PRODUCTS_TABLE,
      Key: {
        Id: { S: productId },
      },
    })));
  });
  const products = await Promise.all(dynamoRequests);
  return products.map(({ Item }) => formatItem(Item));
};

module.exports.getTotalAmount = (cart, products) => {
  let totalAmount = 0;
  cart.forEach((item) => {
    const currentProduct = products.find((product) => item.id === product.Id);
    totalAmount += item.cant * currentProduct.Price;
  });
  return totalAmount.toPrecision(3);
};

module.exports.getProductsByUserId = async (userId) => {
  const { Items } = await docClient.send(new QueryCommand({
    TableName: process.env.PRODUCTS_TABLE,
    IndexName: 'UserIdIndex',
    KeyConditionExpression: 'UserId = :userId',
    ExpressionAttributeValues: {
      ':userId': { S: userId },
    },
    Select: 'ALL_PROJECTED_ATTRIBUTES',
  }));
  const products = Items.map(({ Name, Id, Price }) => ({
    name: Name.S, id: Id.S, price: Price.S,
  }));
  return products;
};
