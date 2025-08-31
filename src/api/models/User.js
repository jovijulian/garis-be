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
                phone: { type: 'string', maxLength: 20, nullable: true },
                role: { type: 'integer', enum: [1, 2] },
            }
        };
    }

    $formatJson(json) {
        json = super.$formatJson(json);
        delete json.password;
        delete json.token;
        return json;
    }
}

module.exports = User;