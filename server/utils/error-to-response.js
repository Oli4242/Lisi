const Sequelize = require('sequelize')

module.exports = function errorToResponse(error) { // TODO: write tests for this function
  const errorResponse = {
    message: error.message
  }

  if (error instanceof Sequelize.ValidationError) {
    errorResponse.errors = error.errors.map(e => ({
      message: e.message,
      path: e.path,
      model: e.instance.constructor.name,
      type: e.type,
      validatorKey: e.validatorKey,
      validatorArgs: e.validatorArgs
    }))
  }

  return errorResponse
}
