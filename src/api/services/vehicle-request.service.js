const vehicleRequestRepository = require('../repositories/vehicle-request.repository');
const { getUserId, formatDateTime, parseMenuDescription } = require('../helpers/dataHelpers');
const { knexBooking } = require('../../config/database');
const assignedVehicleRepository = require('../repositories/request-assigned-vehicle.repository');
const assignedDriverRepository = require('../repositories/request-assigned-driver.repository');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const ExcelJS = require('exceljs');
class VehicleRequestService {

    async getAll(queryParams) {
        return vehicleRequestRepository.findAllWithFilters(queryParams);
    }

    async getAllUser(request) {
        const userId = getUserId(request);
        const queryParams = request.query;
        return vehicleRequestRepository.findAllWithFiltersByUserId(queryParams, userId);
    }

    async detail(id) {
        const data = await vehicleRequestRepository.findByIdWithRelations(id,
            '[cabang, user, vehicle_type, assigned_vehicles.[vehicle], assigned_drivers.[driver]]'
        );
        if (!data) {
            const error = new Error('Vehicle Request not found.');
            error.statusCode = 404;
            throw error;
        }
        return data;
    }



    async create(request) {
        const loggedInUserId = await getUserId(request);
        const trx = await knexBooking.transaction();
        let newRequest;
        try {
            const header = request.body;

            if (!header.cab_id && !header.pickup_location_text) {
                const error = new Error('Lokasi penjemputan (Cabang atau Teks Lokasi) wajib diisi.');
                error.statusCode = 400;
                throw error;
            }

            const requestPayload = {
                ...header,
                id_user: header.id_user || loggedInUserId,
                status: header.id_user ? 'Approved' : 'Submit',
                created_at: formatDateTime(),
                updated_at: formatDateTime(),
                approved_by: header.id_user ? loggedInUserId : null,
            };

            const createdRequest = await vehicleRequestRepository.create(requestPayload, trx);
            await trx.commit();

            newRequest = await this.detail(createdRequest.id);

        } catch (error) {
            await trx.rollback();
            throw error;
        }
        return newRequest;
    }

    async update(id, request) {
        const existingRequest = await this.detail(id);

        if (existingRequest.status !== 'Submit') {
            const error = new Error('Request ini tidak dapat diubah karena sudah diproses.');
            error.statusCode = 400;
            throw error;
        }

        const trx = await knexBooking.transaction();
        let updatedRequest;

        try {
            const header = request.body;
            const preparedPayload = {
                ...header,
                updated_at: formatDateTime(),
            };

            await vehicleRequestRepository.update(id, preparedPayload, trx);
            await trx.commit();
            updatedRequest = await this.detail(id);
        } catch (error) {
            await trx.rollback();
            throw error;
        }
        return updatedRequest;
    }

    async delete(id) {
        const existingRequest = await this.detail(id);

        if (existingRequest.status !== 'Submit') {
            const error = new Error('Request ini tidak dapat dihapus karena sudah diproses.');
            error.statusCode = 400;
            throw error;
        }

        return knexBooking.transaction(async (trx) => {
            await assignedVehicleRepository.deleteByRequestId(id, trx);
            await assignedDriverRepository.deleteByRequestId(id, trx);

            await vehicleRequestRepository.delete(id, trx);

            return { message: 'Vehicle Request has been deleted successfully.' };
        });
    }

    async updateVehicleRequestStatus(id, request) {
        const payload = request.body;
        const userId = await getUserId(request);

        const existingRequest = await vehicleRequestRepository.findById(id);
        if (!existingRequest) {
            const error = new Error("Request not found.");
            error.statusCode = 404;
            throw error;
        }

        if (existingRequest.status !== 'Submit') {
            const error = new Error('Status request ini tidak dapat diubah karena sudah diproses.');
            error.statusCode = 400;
            throw error;
        }

        const trx = await knexBooking.transaction();
        let updatedRequest;
        try {
            const updatePayload = {
                status: payload.status,
                rejection_reason: payload.rejection_reason || null,
                approved_by: userId,
                updated_at: formatDateTime(),
            };

            updatedRequest = await vehicleRequestRepository.update(id, updatePayload, trx);
            await trx.commit();
        } catch (error) {
            await trx.rollback();
            throw error;
        }
        return updatedRequest;
    }


    async cancelRequest(id) {
        await this.detail(id);

        return knexBooking.transaction(async (trx) => {
            const updatedOrder = await vehicleRequestRepository.update(id, {
                status: 'Canceled',
                updated_at: formatDateTime()
            }, trx);
            return updatedOrder;
        });
    }

    async assignVehicle(id, req) {
        const { vehicle_id } = req.body;

        const payload = {
            vehicle_request_id: Number(id),
            vehicle_id: Number(vehicle_id)
        };

        return knexBooking.transaction(async (trx) => {
            const data = assignedVehicleRepository.create(payload, trx);
            return data;
        });

    }

    async removeVehicleAssignment(id) {
        return knexBooking.transaction(async (trx) => {
            const data = await assignedVehicleRepository.delete(id, trx);

            if (!data) {
                const error = new Error('Failed to deleted vehicle assignment.');
                error.statusCode = 500;
                throw error;
            }

            return { message: 'Vehicle assignment removed.' };
        });
    }

    async assignDriver(id, req) {
        const { driver_id } = req.body;

        const payload = {
            vehicle_request_id: Number(id),
            driver_id: Number(driver_id)
        };

        return knexBooking.transaction(async (trx) => {
            const data = assignedDriverRepository.create(payload, trx);
            return data;
        });

    }

    async removeDriverAssignment(id) {
        return knexBooking.transaction(async (trx) => {
            const data = await assignedDriverRepository.delete(id, trx);

            if (!data) {
                const error = new Error('Failed to deleted driver assignment.');
                error.statusCode = 500;
                throw error;
            }

            return { message: 'Driver assignment removed.' };
        });
    }
}

module.exports = new VehicleRequestService();