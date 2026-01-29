const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');
const driverRepository = require('../repositories/driver.repository');
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

        const getEmployData = await userRepository.findEmployData(user.id_user);

        const jwtPayload = {
            id_user: user.id_user,
            name: user.nama_user,
            email: getEmployData.employee ? getEmployData.employee.email : null,
            role: user.role_garis,
            sites: user.permissions.length > 0 ? user.permissions[0].cab_id : null,
            id_dept: getEmployData.employee ? getEmployData.employee.id_dept : null,
        };

        const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
        // await userRepository.updateUser(user.id_user, { token: token });
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

        // await userRepository.updateUser(user.id_user, { token: null });
        await userRepository.updateUser(user.id_user, { token_garis: null }); //prod
        return { message: 'Logged out successfully' };
    }

    async me(id_user) {
        const user = await userRepository.findByUserId(id_user);
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        let isDriver
        const checkDriver = await driverRepository.findByUserId(user.id_user);
        if (checkDriver) {
            isDriver = true
        }
        const getEmployData = await userRepository.findEmployData(user.id_user);

        return {
            id_user: user.id_user,
            name: user.nama_user,
            email: getEmployData.employee ? getEmployData.employee.email : null,
            role: user.role_garis,
            sites: user.permissions.length > 0 ? user.permissions[0].cab_id : null,
            is_driver: isDriver || false,
            id_dept: getEmployData.employee ? getEmployData.employee.id_dept : null,
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