const BaseRepository = require('./base.repository');
const VehicleAssignment = require('../models/VehicleAssignment');
const Vehicle = require('../models/Vehicle');

class VehicleRepository extends BaseRepository {
    constructor() {
        super(Vehicle);
    }

    async findAllWithFilters(queryParams = {}) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = Vehicle.query()
            .select('*')
            .withGraphFetched('[vehicle_type]')
            .modifyGraph('vehicle_type', builder => {
                builder.select('id', 'name');
            })
            .withGraphFetched('[cabang]')
            .modifyGraph('cabang', builder => {
                builder.select('id_cab', 'nama_cab');
            })
            .modifyGraph('vehicle_type', builder => {
                builder.select('id', 'name');
            })
            .where('is_active', 1)

            .page(page - 1, per_page)
            .orderBy('id', 'DESC');

        if (search) {
            query.where('name', 'like', `%${search}%`)
                .where('is_active', 1)
                .orWhere('license_plate', 'like', `%${search}%`)
                .orWhereExists(
                    Vehicle.relatedQuery('vehicle_type')
                        .where('name', 'like', `%${search}%`)
                )

        }

        const paginatedResult = await query;

        return {
            results: paginatedResult.results,
            total: paginatedResult.total,
            page: page,
            per_page: per_page,
        };
    }

    async options(params) {
        const search = params.search || '';
        const vehicleTypeId = params.vehicle_type_id || null;
        const status = params.status || null;
        const cab_id = params.cab_id || null;
        const query = Vehicle.query()
            .select('id', 'name', 'license_plate', 'vehicle_type_id', 'passenger_capacity', 'status', 'cab_id')
            .where('is_active', 1)
            .withGraphFetched('[vehicle_type]')
            .modifyGraph('vehicle_type', builder => {
                builder.select('id', 'name');
            })
            .withGraphFetched('[cabang]')
            .modifyGraph('cabang', builder => {
                builder.select('id_cab', 'nama_cab');
            })

        if (search) {
            query.where('name', 'like', `%${params}%`)
        }
        if (vehicleTypeId) {
            query.where('vehicle_type_id', vehicleTypeId);
        }
        if (status) {
            query.where('status', status);
        }
        if (cab_id) {
            query.where('cab_id', cab_id);
        }

        const data = await query;

        return data;
    }

    async findByIdWithRelations(id, relations) {
        if (!relations) {
            return this.findById(id);
        }
        return Vehicle.query().findById(id).withGraphFetched(relations);
    }

    async findByLicensePlate(licensePlate) {
        return Vehicle.query()
            .where('license_plate', licensePlate)
            .andWhere('is_active', 1)
            .first();
    }

    async updateStatus(id, payload, trx = null) {
        return this.update(id, payload, trx);
    }

    async checkStatus(id) {
        const vehicle = await this.findById(id);
        return vehicle.status;
    }

    async findAllForSchedule(cab_id) {
        const query = Vehicle.query()
            .select('id', 'name', 'license_plate', 'vehicle_type_id', 'passenger_capacity', 'status', 'cab_id')
            .where('is_active', 1);

        if (cab_id) {
            query.where('cab_id', cab_id);
        }
        const data = await query;
        return data;

    }

    async findAvailableForBooking(params) {
        const { start_time, end_time, cab_id, vehicle_type_id, search } = params;
        const busyVehicleIds = VehicleAssignment.query()
            .joinRelated('vehicle_request')
            .whereIn('vehicle_request.status', ['Approved', 'In Progress'])
            .andWhere(builder => {
                builder.where('vehicle_request.start_time', '<', end_time)
                       .andWhere('vehicle_request.end_time', '>', start_time);
            })
            .whereNotNull('vehicle_assignments.vehicle_id')
            .select('vehicle_assignments.vehicle_id');
           
        const query = Vehicle.query()
            .select('id', 'name', 'license_plate', 'vehicle_type_id', 'passenger_capacity', 'status', 'cab_id')
            .where('is_active', 1)
            .where('status', 'Available') 
            .whereNotIn('id', busyVehicleIds)
            .withGraphFetched('[vehicle_type, cabang]')
            .modifyGraph('vehicle_type', builder => builder.select('id', 'name'))
            .modifyGraph('cabang', builder => builder.select('id_cab', 'nama_cab'));
        if (cab_id) {
            query.where('cab_id', cab_id);
        }
        if (vehicle_type_id) {
            query.where('vehicle_type_id', vehicle_type_id);
        }
        if (search) {
            query.where(builder => {
                builder.where('name', 'like', `%${search}%`)
                       .orWhere('license_plate', 'like', `%${search}%`);
            });
        }

        return await query.orderBy('name');
    }
}

module.exports = new VehicleRepository();