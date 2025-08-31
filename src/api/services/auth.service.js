const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');
const { formatDateTime, getUserId } = require('../helpers/dataHelpers');
const { knexConnection } = require('../../config/database');

class AuthService {

    async login(payload) {
        const { email } = payload;

        const user = await userRepository.findByEmail(email);
        if (!user) {
            const error = new Error('Invalid email');
            error.statusCode = 401;
            throw error;
        }

        const activeUser = user.deleted_at === null;
        if (!activeUser) {
            const error = new Error('User is not active');
            error.statusCode = 403
            throw error;
        }


        const isPasswordMatch = await bcrypt.compare(payload.password, user.password);
        if (!isPasswordMatch) {
            const error = new Error('Invalid email or password');
            error.statusCode = 401;
            throw error;
        }

        const jwtPayload = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };
        const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
        await userRepository.update(user.id, { token: token });

        return { token };

    }


    async logout(userId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        await userRepository.update(userId, { token: null });
        return { message: 'Logged out successfully' };
    }

    async me(userId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };
    }

    async firstLogin(userId, newPassword) {
        const user = await userRepository.findById(userId);
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        if (user.first_login !== null) {
            const error = new Error('You have already changed your password');
            error.statusCode = 403;
            throw error;
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const payload = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        });
        await userRepository.update(userId, { password: hashedPassword, first_login: formatDateTime(), token: token });

        return { token };
    }



    async changePassword(request) {
        const userId = getUserId(request);
        const { old_password, new_password } = request.body;

        const user = await userRepository.findById(userId);
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        const isPasswordMatch = await bcrypt.compare(old_password, user.password);
        if (!isPasswordMatch) {
            const error = new Error('Old password is incorrect.');
            error.statusCode = 401;
            throw error;
        }

        const isSamePassword = await bcrypt.compare(new_password, user.password);
        if (isSamePassword) {
            const error = new Error('New password must be different from the old password.');
            error.statusCode = 400;
            throw error;
        }

        return knexConnection.transaction(async (trx) => {
            const hashedNewPassword = await bcrypt.hash(new_password, 10);
            await userRepository.update(userId, { password: hashedNewPassword }, trx);
            return { message: 'Change password successfully.' };
        });
    }

}

module.exports = new AuthService();