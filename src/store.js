const jwtDecode = require('jwt-decode');
const { getProductsByUserId } = require('./services/products');
const { getStoreByName, getStoreByUser, createStore } = require('./services/stores');

module.exports.getProducts = async (event) => {
  console.log('event: ', event);
  const store = await getStoreByName(event.pathParameters.storeName);
  console.log(store);
  const products = await getProductsByUserId(store.UserId.S);
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ products }),
  };
};

module.exports.createStore = async (event) => {
  try {
    console.log('event: ', event);
    const accessToken = event.headers.authorization.replace('Bearer ', '');
    const decodedToken = jwtDecode(accessToken);
    const body = JSON.parse(event.body);

    const store = await createStore(body.name, decodedToken.sub);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ store }),
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: error.message, errorCode: error.errorCode }),
    };
  }
};

module.exports.getStore = async (event) => {
  try {
    console.log('event: ', event);
    const accessToken = event.headers.authorization.replace('Bearer ', '');
    const decodedToken = jwtDecode(accessToken);
    const store = await getStoreByUser(decodedToken.sub);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(store),
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error, message: error.message }),
    };
  }
};
