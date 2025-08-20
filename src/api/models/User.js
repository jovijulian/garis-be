const { Model } = require('../../config/database');

class User extends Model {
    static get tableName() {
        return 'users';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['name', 'email', 'password'],
            properties: {
                id: { type: 'integer' },
                name: { type: 'string', minLength: 1, maxLength: 255 },
                email: { type: 'string', format: 'email' },
                password: { type: 'string', minLength: 8 },
                phone: { type: 'string', maxLength: 15, nullable: true },
                role: { type: 'integer', enum: [1, 2, 3,4] }, 
                first_login: { type: 'string' },
                otp_code: { type: 'string', maxLength: 6, nullable: true },
                otp_expires_at: { type: 'string', format: 'date-time', nullable: true },
                password_reset_token: { type: 'string', maxLength: 255, nullable: true },
                password_reset_expires: { type: 'string', format: 'date-time', nullable: true },

            }
        };
    }

    $formatJson(json) {
        json = super.$formatJson(json);
        delete json.password;
        return json;
    }
}

module.exports = User;