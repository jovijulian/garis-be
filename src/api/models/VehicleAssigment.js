const { BaseModelBooking } = require('../../config/database');

class VehicleAssigment extends BaseModelBooking {
    static get tableName() {
        return 'vehicle_assigments';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['vehicle_request_id', 'vehicle_id', 'driver_id'],
            properties: {
                id: { type: 'integer' },
                vehicle_request_id: { type: 'integer' },
                vehicle_id: { type: 'integer' },
                driver_id: { type: 'integer' },
                notes_for_driver: { type: 'string' },
            }
        };
    }

    static get relationMappings() {
        const VehicleRequest = require('./VehicleRequest');
        const Vehicle = require('./Vehicle');
        const Driver = require('./Driver');

        return {
            vehicle_request: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: VehicleRequest,
                join: {
                    from: 'vehicle_assigments.vehicle_request_id',
                    to: 'vehicle_requests.id'
                }
            },
            vehicle: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Vehicle,
                join: {
                    from: 'vehicle_assigments.vehicle_id',
                    to: 'vehicles.id'
                }
            },
            driver: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Driver,
                join: {
                    from: 'vehicle_assigments.driver_id',
                    to: 'drivers.id'
                }
            }
        };
    }

    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = VehicleAssigment;