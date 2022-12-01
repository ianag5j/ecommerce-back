const { v4 } = require('uuid');
const { DynamoDBClient, PutItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { getProductsByIds, getTotalAmount } = require('./products');
const { getStoreByName } = require('./stores');
const { createOrder } = require('./uala');

const docClient = new DynamoDBClient();

module.exports.createOrder = async (cart, storeName) => {
  const store = await getStoreByName(storeName);
  const products = await getProductsByIds(cart.map((item) => item.id));
  const totalAmount = getTotalAmount(cart, products);

  const Order = {
    Id: { S: v4() },
    StoreId: { S: store.Id.S },
    Status: { S: 'CREATED' },
    Amount: { S: totalAmount },
    CreatedAt: { S: (new Date()).toISOString() },
    UpdatedAt: { S: (new Date()).toISOString() },
    PaymentMethod: { S: 'Uala' },
    // Cart: { L: body.cart.map((item) => ({ M: item })) },
    // Products: { L: products },
  };

  await docClient.send(new PutItemCommand({
    TableName: process.env.ORDERS_TABLE,
    Item: Order,
  }));
  const ualaOrder = await createOrder(Order, store.Name.S, store.UserId.S);

  const { Attributes: updatedOrder } = await docClient.send(new UpdateItemCommand({
    TableName: process.env.ORDERS_TABLE,
    Key: {
      Id: { S: Order.Id.S },
    },
    UpdateExpression: 'set #u = :u, #s = :s, #eId = :eId',
    ExpressionAttributeValues: {
      ':u': { S: (new Date()).toISOString() },
      ':s': { S: 'PENDING' },
      ':eId': { S: ualaOrder.uuid },
    },
    ExpressionAttributeNames: {
      '#s': 'Status',
      '#u': 'UpdatedAt',
      '#eId': 'ExternalId',
    },
    ReturnValues: 'ALL_NEW',
  }));
  return {
    order: updatedOrder,
    ualaOrder,
  };
};
