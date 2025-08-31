const userRepository = require('../repositories/user.repository');
const { formatDateTime } = require("../helpers/dataHelpers");
const { knexConnection } = require('../../config/database');
const bcrypt = require('bcryptjs');
class UserService {

    async getAll(request) {
        const queryParams = request.query;
        return userRepository.findAllWithFilters(queryParams);
    }

    async detail(id) {
        const data = await userRepository.findById(id)
        if (!data) {
            const error = new Error('User not found.');
            error.statusCode = 404;
            throw error;
        }
        return data;
    }

    async create(request) {
        const payload = request.body;
        return knexConnection.transaction(async (trx) => {
            const password = "12345678" //default
            const hashedPassword = await bcrypt.hash(password, 10);
            payload.role = payload.role ? payload.role : 2; // default user role
            payload.password = hashedPassword;
            payload.created_at = formatDateTime();
            payload.updated_at = formatDateTime();

            const data = await userRepository.create(payload, trx);
            return data;
        });
    }

    async update(id, request) {
        await this.detail(id);
        const payload = request.body;
        return knexConnection.transaction(async (trx) => {
            payload.updated_at = formatDateTime();

            const data = await userRepository.update(id, payload, trx);
            return data;
        });
    }

    async delete(id) {
        await this.detail(id);
        return knexConnection.transaction(async (trx) => {
            const data = await userRepository.update(id, { deleted_at: formatDateTime() }, trx); 

            if (!data) {
                const error = new Error('Failed to delete user.');
                error.statusCode = 500;
                throw error;
            }

            return { message: 'User has been delete successfully.' };
        });
    }
}

module.exports = new UserService();