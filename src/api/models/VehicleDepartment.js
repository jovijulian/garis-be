const { BaseModelBooking } = require('../../config/database');

class VehicleDepartment extends BaseModelBooking {
    static get tableName() {
        return 'vehicle_departments';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['vehicle_id', 'id_dept'],
            properties: {
                id: { type: 'integer' },
                vehicle_id: { type: 'integer' },
                id_dept: { type: 'integer' },
            }
        };
    }

    static get relationMappings() {
        const Vehicle = require('./Vehicle');
        const Department = require('./Department');
        return {
            vehicle: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Vehicle,
                join: {
                    from: 'vehicle_departments.vehicle_id',
                    to: 'vehicles.id'
                }
            },
            department: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Department,
                join: {
                    from: 'vehicle_departments.id_dept',
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

module.exports = VehicleDepartment;