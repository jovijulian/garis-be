const { BaseModelBooking } = require('../../config/database');

class Vehicle extends BaseModelBooking {
    static get tableName() {
        return 'vehicles';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['vehicle_type_id', 'name', 'license_plate', 'passenger_capacity'],
            properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                vehicle_type_id: { type: 'integer' },
                license_plate: { type: 'string' },
                passenger_capacity: { type: 'integer' },
                status: {
                    type: 'string',
                    enum: ['Available', 'Not Available', 'In Repair'],
                    default: 'Available'
                },
                is_active: { type: 'integer' }
            },
        }
    };

    static get relationMappings() {
        const VehicleType = require('./VehicleType');
        return {
            vehicle_type: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: VehicleType,
                join: {
                    from: 'vehicles.vehicle_type_id',
                    to: 'vehicle_types.id'
                }
            },
        };
    }


    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = Vehicle;