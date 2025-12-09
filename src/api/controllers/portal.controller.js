const portalService = require('../services/portal.service');
const { success, error } = require('../../utils/response');

class PortalController {

    async login(req, res) {
        try {
            const loginData = req.body;
            const data = await portalService.login(loginData);
            return success(res, 200, data, 'Login successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err, err.data || null);
        }
    }
    async logout(req, res) {
        try {
            const userId = req.user.id_user;
            await portalService.logout(userId);
            return success(res, 200, null, 'Logout successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

}

module.exports = new PortalController();