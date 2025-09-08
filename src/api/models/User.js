const { BaseModelHr } = require('../../config/database');

class User extends BaseModelHr {
    static get tableName() {
        return 'tb_user';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: [],
            properties: {
                id_user: { type: 'string' },
                nama_user: { type: 'string', minLength: 1, maxLength: 255 },
                email: { type: 'string', format: 'email' },
                password: { type: 'string', minLength: 8 },
                phone: { type: 'string', maxLength: 20, nullable: true },
                role_garis: { type: 'integer', enum: [1, 2, 3] },
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