const { BaseModelBooking } = require('../../config/database');

class Driver extends BaseModelBooking {
    static get tableName() {
        return 'drivers';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['id_user', 'name', 'phone_number'],
            properties: {
                id: { type: 'integer' },
                id_user: { type: 'string' },
                name: { type: 'string' },
                phone_number: { type: 'string' },
                status: {
                    type: 'string',
                    enum: ['Available', 'Not Available'],
                    default: 'Available'
                },
                is_active: { type: 'integer' }
            },
        }
    };

    static get relationMappings() {
        const User = require('./User');
        return {
            user: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'drivers.id_user',
                    to: 'tb_user.id_user',
                },
            },
        };
    }


    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = Driver;