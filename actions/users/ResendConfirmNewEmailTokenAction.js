const { AppError, errorCodes } = require('supra-core')
const BaseAction = require('../BaseAction')
const { emailClient } = require('../RootProvider')
const UserDAO = require('../../dao/UserDAO')
const { makeEmailConfirmTokenHelper } = require('../../auth')
const ChangeEmail = require('../../emails/ChangeEmail')

class ResendConfirmNewEmailTokenAction extends BaseAction {
  static get accessTag () {
    return 'users:resend-confirm-new-email-token'
  }

  static async run (ctx) {
    const { currentUser } = ctx

    const user = await UserDAO.baseGetById(currentUser.id)
    if (!user.newEmail) {
      throw new AppError({ ...errorCodes.NOT_FOUND, message: 'There is no new email confirmation.' })
    }
    const { newEmail } = user

    const emailConfirmToken = await makeEmailConfirmTokenHelper(user)
    await emailClient.send(new ChangeEmail({ newEmail, emailConfirmToken }))
    await UserDAO.baseUpdate(currentUser.id, { emailConfirmToken })

    return this.result({ message: 'Email confirmation token was send!' })
  }
}

module.exports = ResendConfirmNewEmailTokenAction
