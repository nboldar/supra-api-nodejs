const { errorCodes, BaseMiddleware } = require('supra-core')
const { jwtHelper } = require('../auth')
const SECRET = require('../config').token.access.secret
const roles = require('../config').roles
const logger = require('../logger')

class CheckAccessTokenMiddleware extends BaseMiddleware {
  async init () {
    logger.trace(`${this.constructor.name} initialized...`)
  }

  handler () {
    return (req, res, next) => {
      const authorization = req.headers['authorization'] || req.headers['Authorization']
      const bearer = authorization && authorization.startsWith('Bearer ') ? authorization : null
      const token = bearer ? bearer.split('Bearer ')[1] : null

      // set default meta data
      req.currentUser = Object.freeze({
        id: null,
        name: null,
        role: roles.anonymous,
        email: null,
        expiresIn: null
      })

      if (token) {
        return jwtHelper.verify(token, SECRET)
          .then(tokenData => {
            // set actual current user
            req.currentUser = Object.freeze({
              id: tokenData.sub,
              name: tokenData.username,
              role: tokenData.userRole,
              email: tokenData.email,
              expiresIn: Number(tokenData.exp)
            })

            next()
          }).catch(error => {
            if (error.code === errorCodes.TOKEN_EXPIRED.code) {
              /**
               * pass request if token is not valid
               * in this case security service will consider that request as anonymous request
               */
              next()
            } else {
              next(error)
            }
          })
      }
      next()
    }
  }
}

module.exports = new CheckAccessTokenMiddleware()
