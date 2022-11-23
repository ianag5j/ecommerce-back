const { authenticate } = require('./services/auth0');

module.exports.handler = async (event, context) => {
  try {
    console.log('event: ', JSON.stringify(event));
    const data = await authenticate(event);
    console.log('data: ', JSON.stringify(data));
    return data;
  } catch (err) {
    console.log(err);
    return context.fail('Unauthorized');
  }
};
