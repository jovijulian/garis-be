const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');
const { getUserId } = require('../helpers/dataHelpers');
const { knexHr } = require('../../config/database');
const crypto = require('crypto');

class AuthService {

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

        const jwtPayload = {
            id_user: user.id_user,
            name: user.nama_lengkap,
            email: user.email,
            role: user.role_garis,
            sites: user.permissions.length > 0 ? user.permissions[0].cab_id : null,
        };

        const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
        await userRepository.updateUser(user.id_user, { token: token });
        return { token };
    }


    async logout(id_user) {
        const user = await userRepository.findByUserId(id_user);
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        await userRepository.updateUser(user.id_user, { token: null });
        return { message: 'Logged out successfully' };
    }

    async me(id_user) {
        const user = await userRepository.findByUserId(id_user);
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        return {
            id_user: user.id_user,
            name: user.nama_lengkap,
            email: user.email,
            role: user.role_garis,
            sites: user.permissions.length > 0 ? user.permissions[0].cab_id : null,
        };
    }

    async changePassword(request) {
        const userId = getUserId(request);
        const { old_password, new_password } = request.body;
        const user = await userRepository.findByUserId(userId);
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        const oldPasswordMd5 = crypto.createHash('md5').update(old_password).digest('hex');
        
        if (oldPasswordMd5 !== user.password) {
            const error = new Error('Old password is incorrect.');
            error.statusCode = 401;
            throw error;
        }

        const newPasswordMd5 = crypto.createHash('md5').update(new_password).digest('hex');
        if (newPasswordMd5 === user.password) {
            const error = new Error('New password must be different from the old password.');
            error.statusCode = 400;
            throw error;
        }

        return knexHr.transaction(async (trx) => {
            await userRepository.updateUser(userId, { password: newPasswordMd5 }, trx);
            return { message: 'Change password successfully.' };
        });
    }

}

module.exports = new AuthService();