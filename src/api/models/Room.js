const { BaseModelBooking } = require('../../config/database');

class Room extends BaseModelBooking {
    static get tableName() {
        return 'rooms';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['name'],
            properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                cab_id: { type: 'integer' },
                capacity: { type: 'integer' },
                description: { type: 'string' },
                location: { type: 'string' },
                is_active: { type: 'integer' }
            }
        };
    }

    static get relationMappings() {
        const Site = require('./Site');
        return {
            cabang: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Site,
                join: {
                    from: 'rooms.cab_id',
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

module.exports = Room;