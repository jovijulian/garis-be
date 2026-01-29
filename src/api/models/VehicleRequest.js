const { BaseModelBooking } = require('../../config/database');

class VehicleRequest extends BaseModelBooking {
    static get tableName() {
        return 'vehicle_requests';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['id_user', 'destination', 'start_time', 'passenger_count', 'requested_vehicle_type_id', 'requested_vehicle_count', 'purpose'],
            properties: {
                id: { type: 'integer' },
                id_user: { type: 'string' },
                cab_id: { type: 'integer', nullable: true },
                pickup_location_text: { type: 'string', nullable: true },
                destination: { type: 'string', nullable: true },
                start_time: { type: 'string', format: 'date-time' },
                end_time: { type: 'string', format: 'date-time', nullable: true },
                passenger_count: { type: 'integer' },
                passenger_names: { type: 'string', nullable: true },
                requested_vehicle_type_id: { type: 'integer', nullable: true },
                requested_vehicle_count: { type: 'integer', nullable: true },
                purpose: { type: 'string' },
                note: { type: 'string', nullable: true },
                status: { type: 'string', enum: ['Submit', 'Approved', 'Rejected', 'Completed', 'Canceled', 'In Progress'] },
                rejection_reason: { type: 'string', nullable: true },
                approved_by: { type: 'string', nullable: true },
                id_dept: { type: 'integer', nullable: true },
            }
        };
    }

    static get relationMappings() {
        const Site = require('./Site');
        const User = require('./User');
        const RequestAssignedVehicle = require('./RequestAssignedVehicle');
        const RequestAssignedDriver = require('./RequestAssignedDriver');
        const VehicleType = require('./VehicleType');
        const VehicleAssigment = require('./VehicleAssignment');
        const Department = require('./Department');
        return {
            cabang: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Site,
                join: {
                    from: 'vehicle_requests.cab_id',
                    to: 'tb_cab.id_cab'
                }
            },
            user: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'vehicle_requests.id_user',
                    to: 'tb_user.id_user'
                }
            },
            vehicle_type: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: VehicleType,
                join: {
                    from: 'vehicle_requests.requested_vehicle_type_id',
                    to: 'vehicle_types.id'
                }
            },
            detail: {
                relation: BaseModelBooking.HasManyRelation,
                modelClass: VehicleAssigment,
                join: {
                    from: 'vehicle_requests.id',
                    to: 'vehicle_assignments.request_id'
                }
            },
            department: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Department,
                join: {
                    from: 'vehicle_requests.id_dept',
                    to: 'tb_dept.id_dept'
                }
            }
            
        };
    }


    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = VehicleRequest;