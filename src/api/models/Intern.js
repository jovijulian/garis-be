const { BaseModelBooking } = require('../../config/database');

class Intern extends BaseModelBooking {
    static get tableName() {
        return 'interns';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['name', 'phone_number', 'cab_id'],
            properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                cab_id: { type: 'integer' },
                phone_number: { type: 'string' },
                is_active: { type: 'integer' },
            },
        }
    };

    static get relationMappings() {
        const Site = require('./Site')
        return {
            cabang: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Site,
                join: {
                    from: 'interns.cab_id',
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

module.exports = Intern;