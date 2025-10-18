const { BaseModelBooking } = require('../../config/database');

class RequestAssignedDriver extends BaseModelBooking {
    static get tableName() {
        return 'request_assigned_drivers';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['request_id', 'driver_id'],
            properties: {
                id: { type: 'integer' },
                request_id: { type: 'integer' },
                driver_id: { type: 'integer' },
            }
        };
    }

    static get relationMappings() {
        const VehicleRequest = require('./VehicleRequest');
        const Driver = require('./Driver');

        return {
            vehicle_request: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: VehicleRequest,
                join: {
                    from: 'request_assigned_drivers.request_id',
                    to: 'vehicle_requests.id'
                }
            },
            driver: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Driver,
                join: {
                    from: 'request_assigned_drivers.driver_id',
                    to: 'drivers.id'
                }
            },
        };
    }

    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = RequestAssignedDriver;