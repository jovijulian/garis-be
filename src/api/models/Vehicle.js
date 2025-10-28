const { BaseModelBooking } = require('../../config/database');

class Vehicle extends BaseModelBooking {
    static get tableName() {
        return 'vehicles';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['vehicle_type_id', 'name', 'license_plate', 'passenger_capacity', 'is_operational'],
            properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                vehicle_type_id: { type: 'integer' },
                cab_id: { type: 'integer' },
                license_plate: { type: 'string' },
                passenger_capacity: { type: 'integer' },
                status: {
                    type: 'string',
                    enum: ['Available', 'Not Available', 'In Repair'],
                    default: 'Available'
                },
                is_operational: { type: 'integer' },
                is_active: { type: 'integer' }
            },
        }
    };

    static get relationMappings() {
        const VehicleType = require('./VehicleType');
        const Site = require('./Site');
        return {
            vehicle_type: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: VehicleType,
                join: {
                    from: 'vehicles.vehicle_type_id',
                    to: 'vehicle_types.id'
                }
            },
            cabang: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Site,
                join: {
                    from: 'vehicles.cab_id',
                    to: 'tb_cab.id_cab'
                }
            }
        };
    }


    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = Vehicle;