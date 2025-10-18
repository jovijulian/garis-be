const { BaseModelBooking } = require('../../config/database');

class RequestAssignedVehicle extends BaseModelBooking {
    static get tableName() {
        return 'request_assigned_vehicles';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['request_id', 'vehicle_id'],
            properties: {
                id: { type: 'integer' },
                request_id: { type: 'integer' },
                vehicle_id: { type: 'integer' },
            }
        };
    }

    static get relationMappings() {
        const VehicleRequest = require('./VehicleRequest');
        const Vehicle = require('./Vehicle');

        return {
            vehicle_request: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: VehicleRequest,
                join: {
                    from: 'request_assigned_vehicles.request_id',
                    to: 'vehicle_requests.id'
                }
            },
            vehicle: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Vehicle,
                join: {
                    from: 'request_assigned_vehicles.vehicle_id',
                    to: 'vehicles.id'
                }
            },
        };
    }

    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = RequestAssignedVehicle;