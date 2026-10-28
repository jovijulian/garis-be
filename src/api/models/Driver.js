const { BaseModelBooking } = require('../../config/database');

class Driver extends BaseModelBooking {
    static get tableName() {
        return 'drivers';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['name', 'phone_number', 'cab_id'],
            properties: {
                id: { type: 'integer' },
                id_user: { type: ['string', 'null'] },
                intern_id: { type: ['integer', 'null'] },
                name: { type: 'string' },
                cab_id: { type: 'integer' },
                phone_number: { type: 'string' },
                status: {
                    type: 'string',
                    enum: ['Available', 'Not Available'],
                    default: 'Available'
                },
                is_active: { type: 'integer' },
                is_external: { type: 'integer' }
            },
        }
    };

    static get relationMappings() {
        const User = require('./User');
        const Site = require('./Site')
        const Intern = require('./Intern')
        return {
            user: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'drivers.id_user',
                    to: 'tb_user.id_user',
                },
            },
            intern: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Intern,
                join: {
                    from: 'drivers.intern_id',
                    to: 'interns.id',
                },
            },
            cabang: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Site,
                join: {
                    from: 'drivers.cab_id',
                    to: 'tb_cab.id_cab'
                }
            },
        };
    }


    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = Driver;