const BaseRepository = require('./base.repository');
const VehicleRequest = require('../models/VehicleRequest');
const moment = require('moment');
class VehicleRequestRepository extends BaseRepository {
    constructor() {
        super(VehicleRequest);
    }

    async findAllWithFilters(queryParams = {}, siteId = null) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = VehicleRequest.query()
            .select('*')
            .where('is_active', 1)
            .withGraphFetched('[cabang, user, vehicle_type, detail.[vehicle, driver]]')
            .modifyGraph('cabang', builder => {
                builder.select('id_cab', 'nama_cab');
            })
            .modifyGraph('user', builder => {
                builder.select('id_user', 'nama_user');
            })
            .modifyGraph('vehicle_type', builder => {
                builder.select('id', 'name');
            })
            .modifyGraph('detail.vehicle', builder => {
                builder.select('id', 'license_plate', 'name');
            })
            .modifyGraph('detail.driver', builder => {
                builder.select('id', 'name', 'phone_number');
            })

            .page(page - 1, per_page)
            .orderBy('id', 'DESC');

        if (search) {
            query.where(builder => {
                builder.where('destination', 'like', `%${search}%`)
                    .orWhere('purpose', 'like', `%${search}%`)
                    .orWhereExists(
                        VehicleRequest.relatedQuery('vehicle_type')
                            .where('name', 'like', `%${search}%`)
                    )
                    .orWhereExists(
                        VehicleRequest.relatedQuery('detail')
                            .joinRelated('[vehicle, driver]')
                            .where('vehicle.name', 'like', `%${search}%`)
                            .orWhere('vehicle.license_plate', 'like', `%${search}%`)
                            .orWhere('driver.name', 'like', `%${search}%`)
                            .orWhere('driver.phone_number', 'like', `%${search}%`)
                    );
            });
        }

        if (siteId) {
            query.where('cab_id', siteId);
        }

        const paginatedResult = await query;

        return {
            results: paginatedResult.results,
            total: paginatedResult.total,
            page: page,
            per_page: per_page,
        };
    }

    async findAllWithFiltersByUserId(queryParams = {}, userId) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = VehicleRequest.query()
            .select('*')
            .where('is_active', 1)
            .withGraphFetched('[cabang, user, vehicle_type, detail.[vehicle, driver]]')
            .modifyGraph('cabang', builder => {
                builder.select('id_cab', 'nama_cab');
            })
            .modifyGraph('user', builder => {
                builder.select('id_user', 'nama_user');
            })
            .modifyGraph('vehicle_type', builder => {
                builder.select('id', 'name');
            })
            .modifyGraph('detail.vehicle', builder => {
                builder.select('id', 'license_plate', 'name');
            })
            .modifyGraph('detail.driver', builder => {
                builder.select('id', 'name', 'phone_number');
            })
            .where('id_user', userId)
            .page(page - 1, per_page)
            .orderBy('id', 'DESC');

        if (search) {
            query.where(builder => {
                builder.where('destination', 'like', `%${search}%`)
                    .orWhere('purpose', 'like', `%${search}%`)
                    .orWhereExists(
                        VehicleRequest.relatedQuery('vehicle_type')
                            .where('name', 'like', `%${search}%`)
                    )
                    .orWhereExists(
                        VehicleRequest.relatedQuery('detail')
                            .joinRelated('[vehicle, driver]')
                            .where('vehicle.name', 'like', `%${search}%`)
                            .orWhere('vehicle.license_plate', 'like', `%${search}%`)
                            .orWhere('driver.name', 'like', `%${search}%`)
                            .orWhere('driver.phone_number', 'like', `%${search}%`)
                    );
            });
        }

        const paginatedResult = await query;

        return {
            results: paginatedResult.results,
            total: paginatedResult.total,
            page: page,
            per_page: per_page,
        };
    }


    async findByIdWithRelations(id, relations) {
        if (!relations) {
            return this.findById(id);
        }
        return VehicleRequest.query().findById(id).withGraphFetched(relations);
    }

    async findAllForExport(queryParams = {}) {
        const { startDate, endDate, status } = queryParams;

        const query = VehicleRequest.query()
            .select('*')
            .where('is_active', 1)
            .withGraphFetched('[cabang, user, vehicle_type, detail.[vehicle, driver]]')
            .modifyGraph('cabang', builder => {
                builder.select('id_cab', 'nama_cab');
            })
            .modifyGraph('user', builder => {
                builder.select('id_user', 'nama_user');
            })
            .modifyGraph('vehicle_type', builder => {
                builder.select('id', 'name');
            })
            .modifyGraph('detail.vehicle', builder => {
                builder.select('id', 'license_plate', 'name');
            })
            .modifyGraph('detail.driver', builder => {
                builder.select('id', 'name', 'phone_number');
            })
            .orderBy('id', 'DESC');



        if (startDate && endDate) {
            query.whereBetween('vehicle_requests.start_time', [startDate, endDate]);
        }

        if (status) {
            query.where('vehicle_requests.status', status);
        }

        return query
    }

    async findScheduleData({startDate, endDate, cab_id, statuses}) {
        const startOfDay = moment(startDate).startOf('day').toISOString();
        const endOfDay = moment(endDate).endOf('day').toISOString();
        const query = VehicleRequest.query()
            .whereIn('status', statuses)
            .where('is_active', 1)
            .whereBetween('start_time', [startOfDay, endOfDay])
            .withGraphFetched('[cabang(selectCabang), user(selectUser), detail(selectDetail).[vehicle(selectVehicle), driver(selectDriver)]]')
            .modifiers({
                selectCabang: builder => builder.select('id_cab', 'nama_cab'),
                selectUser: builder => builder.select('id_user', 'nama_user'),
                selectDetail: builder => builder.select('id', 'vehicle_id', 'driver_id', 'note_for_driver', 'request_id'), // Select necessary fields from assignment table
                selectVehicle: builder => builder.select('id', 'name', 'license_plate'),
                selectDriver: builder => builder.select('id', 'name')
                
            })
            .orderBy('start_time', 'ASC'); 

        if (cab_id) {
            query.where('cab_id', cab_id);
        }

        return query;
    }
}

module.exports = new VehicleRequestRepository();