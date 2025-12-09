const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const crypto = require('crypto');

class PortalService {

    async login(payload) {
        const { id_user, password } = payload;

        const user = await userRepository.findByUserId(id_user);
        if (!user) {
            const error = new Error('Invalid user ID');
            error.statusCode = 401;
            throw error;
        }

        const passwordMd5 = crypto.createHash('md5').update(password).digest('hex');

        if (passwordMd5 !== user.password) {
            const error = new Error('ID User atau password salah.');
            error.statusCode = 401;
            throw error;
        }

        const getEmailUser = await userRepository.findEmailUser(user.id_user);

        const jwtPayload = {
            id_user: user.id_user,
            name: user.nama_user,
            email: getEmailUser.employee ? getEmailUser.employee.email : null,
            role: user.role_garis,
            sites: user.permissions.length > 0 ? user.permissions[0].cab_id : null,
        };

        const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
        await userRepository.updateUser(user.id_user, { token_garis: token }); //prod
        return { token };
    }

    async logout(id_user) {
        const user = await userRepository.findByUserId(id_user);
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        await userRepository.updateUser(user.id_user, { token_garis: null }); //prod
        return { message: 'Logged out successfully' };
    }

}

module.exports = new PortalService();