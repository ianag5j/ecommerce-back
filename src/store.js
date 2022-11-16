const { getUserByName } = require('./services/cognito');
const { getProductsByUserId } = require('./services/products');

module.exports.getProducts = async (event) => {
  console.log('event: ', event);
  const userName = event.pathParameters.storeName;
  const user = await getUserByName(userName);
  const userId = user.Attributes.find((attribute) => attribute.Name === 'sub').Value;
  const products = await getProductsByUserId(userId);
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ products }),
  };
};
