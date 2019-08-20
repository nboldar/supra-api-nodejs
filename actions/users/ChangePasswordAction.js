const BaseAction = require('../BaseAction')
const UserDAO = require('../../dao/UserDAO')
const UserModel = require('../../models/UserModel')
const SessionDAO = require('../../dao/SessionDAO')
const authModule = require('../../services/auth')

class ChangePasswordAction extends BaseAction {
  static get accessTag () {
    return 'users:change-password'
  }

  static get validationRules () {
    return {
      body: {
        oldPassword: [UserModel.schema.passwordHash, true],
        newPassword: [UserModel.schema.passwordHash, true]
      }
    }
  }

  static async run (ctx) {
    const { currentUser } = ctx

    const userModel = await UserDAO.baseGetById(currentUser.id)
    await authModule.checkPasswordService(ctx.body.oldPassword, userModel.passwordHash)
    const newHash = await authModule.makePasswordHashService(ctx.body.newPassword)

    await Promise.all([
      SessionDAO.baseRemoveWhere({ userId: currentUser.id }), // Changing password will remove all logged in sessions.
      UserDAO.baseUpdate(currentUser.id, { passwordHash: newHash })
    ])

    return this.result({ message: 'Password changed' })
  }
}

module.exports = ChangePasswordAction
