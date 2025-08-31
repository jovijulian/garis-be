const authService = require('../services/auth.service');
const { success, error } = require('../../utils/response');

class AuthController {

    async login(req, res) {
        try {
            const loginData = req.body;
            const data = await authService.login(loginData);
            return success(res, 200, data, 'Login successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err, err.data || null);
        }
    }

    async logout(req, res) {
        try {
            const userId = req.user.id;
            await authService.logout(userId);
            return success(res, 200, null, 'Logout successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async me(req, res) {
        try {
            const userId = req.user.id;
            const data = await authService.me(userId);
            return success(res, 200, data, 'User data retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async changePassword(req, res) {
        try {
            const data = await authService.changePassword(req);
            return success(res, 200, data, 'Change password successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }
}

module.exports = new AuthController();