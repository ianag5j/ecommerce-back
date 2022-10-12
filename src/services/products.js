const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');
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
