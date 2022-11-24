const { authenticate } = require('./services/auth0');

module.exports.handler = async (event, context) => {
  try {
    console.log('event: ', JSON.stringify(event));
    const isAuthorized = await authenticate(event);
    console.log({ isAuthorized });
    return { isAuthorized };
  } catch (err) {
    console.log(err);
    return context.fail('Unauthorized');
  }
};
