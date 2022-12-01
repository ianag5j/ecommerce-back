module.exports.ERROR_CODES = {
  STORE_NAME_USED: 1001,
  USER_ALREADY_HAS_STORE: 1002,
  USER_NOT_HAS_CREDENTIALS: 2001,
  UALA_ERROR: 2002,
};

const errorsCode = {
  1001: 'store name in use',
  1002: 'user already has store',
  2001: 'user not has uala credentials',
  2002: 'uala error',
};

class CustomError extends Error {
  message;

  errorCode;

  constructor(errorCode) {
    super(errorsCode[errorCode]);

    this.message = errorsCode[errorCode];
    this.errorCode = errorCode;
  }
}

module.exports.CustomError = CustomError;
