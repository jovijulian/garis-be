const vehicleRequestRepository = require('../repositories/vehicle-request.repository');
const { getUserId, formatDateTime, parseMenuDescription } = require('../helpers/dataHelpers');
const { knexBooking } = require('../../config/database');
const vehicleAssignmentRepository = require('../repositories/vehicle-assignment.repository');
const driverRepository = require('../repositories/driver.repository');
const vehicleRepository = require('../repositories/vehicle.repository');
const userRepository = require('../repositories/user.repository');
const { sendNewVehicleRequestNotificationEmail, sendUpdateVehicleRequestNotificationEmail, sendRequestStatusUpdateEmail, sendAdminCancellationRequestEmail, sendAssignmentNotificationEmail } = require('./email.service');
// const fs = require('fs');
const path = require('path');
const moment = require('moment');
const ExcelJS = require('exceljs');
const puppeteer = require('puppeteer');
const ejs = require('ejs');
const fs = require('fs').promises;
class VehicleRequestService {
    async getAll(queryParams, request) {
        const siteId = request.user.sites ?? null;
        return siteId
            ? vehicleRequestRepository.findAllWithFilters(queryParams, siteId)
            : vehicleRequestRepository.findAllWithFilters(queryParams);
    }

    async getAllUser(request) {
        const userId = getUserId(request);
        const queryParams = request.query;
        return vehicleRequestRepository.findAllWithFiltersByUserId(queryParams, userId);
    }

    async detail(id) {
        const data = await vehicleRequestRepository.findByIdWithRelations(id,
            '[cabang, user, vehicle_type, detail.[vehicle, driver]]'
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
        try {
            const admins = await userRepository.findAdminsBySiteId(newRequest.cab_id);
            if (admins.length > 0) {
                const adminEmails = admins.map(admin => admin.email);
                const requestDetail = await this.detail(newRequest.id);
                await sendNewVehicleRequestNotificationEmail(adminEmails, requestDetail);
            }
        } catch (error) {
            console.log(error)
            console.error('Failed to send notification emails to admins.');
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
        try {
            const admins = await userRepository.findAdminsBySiteId(updatedRequest.cab_id);
            if (admins.length > 0) {
                const adminEmails = admins.map(admin => admin.email);
                const requestDetail = await this.detail(updatedRequest.id);
                await sendUpdateVehicleRequestNotificationEmail(adminEmails, requestDetail);
            }
        } catch (error) {
            console.log(error)
            console.error('Failed to send notification emails to admins.');
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
            await vehicleAssignmentRepository.deleteByRequestId(id, trx);

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
        if (payload.status == 'Completed') {
            try {
                const assignments = await vehicleAssignmentRepository.findByRequestId(id);
                console.log('Assignments for completed request:', assignments);
                if (assignments && assignments.length > 0) {
                    const vehicleIdsToUpdate = new Set();
                    const driverIdsToUpdate = new Set();

                    assignments.forEach(assign => {
                        vehicleIdsToUpdate.add(assign.vehicle_id);
                        if (assign.driver_id) {
                            driverIdsToUpdate.add(assign.driver_id);
                        }
                    });

                    if (vehicleIdsToUpdate.size > 0) {
                        await Promise.all(
                            Array.from(vehicleIdsToUpdate).map(vehicleId =>
                                vehicleRepository.update(vehicleId, { status: 'Available' })
                            )
                        );
                        console.log(`Vehicles [${Array.from(vehicleIdsToUpdate).join(', ')}] status set to Available for completed request ${id}`);
                    }

                    if (driverIdsToUpdate.size > 0) {
                        await Promise.all(
                            Array.from(driverIdsToUpdate).map(driverId =>
                                driverRepository.update(driverId, { status: 'Available' })
                            )
                        );
                        console.log(`Drivers [${Array.from(driverIdsToUpdate).join(', ')}] status set to Available for completed request ${id}`);
                    }
                }
            } catch (assetStatusError) {
                console.error(`Error updating asset status for completed request ${id}:`, assetStatusError);
            }
        }
        if (payload.status !== 'In Progress' && payload.status !== 'Completed') {
            try {
                const requester = await userRepository.findById(updatedRequest.id_user);
                if (requester) {
                    const email = requester.email;
                    const requestDetail = await this.detail(id);
                    await sendRequestStatusUpdateEmail(email, requestDetail);
                }
            } catch (error) {
                console.log(error)
                console.error('Failed to send notification email to requester.');
            }
        }
        return updatedRequest;
    }


    async cancelRequest(id) {
        const existingRequest = await this.detail(id);
        if (!existingRequest) {
            const error = new Error('Request not found.');
            error.statusCode = 404;
            throw error;
        }
        return knexBooking.transaction(async (trx) => {
            const updateRequest = await vehicleRequestRepository.update(id, {
                status: 'Canceled',
                updated_at: formatDateTime()
            }, trx);
            const requestDetailForEmail = { ...existingRequest, status: 'Canceled' };
            await sendAdminCancellationRequestEmail(requestDetailForEmail);
            return updateRequest;
        });
    }

    async assign(requestId, req) {
        const trx = await knexBooking.transaction();
        let createdAssignmentsData = [];
        let requestDetails;
        const vehiclesToUpdate = new Set();
        const driversToUpdate = new Set();


        try {
            const { details } = req.body;

            requestDetails = await vehicleRequestRepository.findByIdWithRelations(requestId, '[user, vehicle_type, cabang]', trx);
            if (!requestDetails) {
                const error = new Error('Vehicle Request not found.');
                error.statusCode = 404;
                throw error;
            }
            if (requestDetails.status !== 'Approved') {
                const error = new Error(`Request cannot be assigned because its status is '${requestDetails.status}'.`);
                error.statusCode = 400;
                throw error;
            }


            await vehicleAssignmentRepository.deleteByRequestId(requestId, trx);

            for (const assignmentDetail of details) {
                const { vehicle_id, driver_id, note_for_driver } = assignmentDetail;

                const vehicle = await vehicleRepository.findById(vehicle_id, trx);
                if (!vehicle || vehicle.status !== 'Available') {
                    const error = new Error(`Vehicle with ID ${vehicle_id} is not available or not found.`);
                    error.statusCode = 400;
                    throw error;
                }

                let driver = null;
                if (driver_id) {
                    driver = await driverRepository.findById(driver_id, trx);
                    if (!driver || driver.status !== 'Available') {
                        const error = new Error(`Driver with ID ${driver_id} is not available or not found.`);
                        error.statusCode = 400;
                        throw error;
                    }
                } else if (requestDetails.requires_driver) {
                    console.warn(`Warning: Assignment for request ${requestId} requires a driver but none provided for vehicle ${vehicle_id}.`);
                    const error = new Error(`Driver is required but not provided for vehicle ${vehicle_id}.`);
                    error.statusCode = 400;
                    throw error;
                }

                const assignmentPayload = {
                    request_id: Number(requestId),
                    vehicle_id: Number(vehicle_id),
                    driver_id: driver ? Number(driver_id) : null,
                    note_for_driver: note_for_driver || null,
                    created_at: formatDateTime(),
                    updated_at: formatDateTime(),
                };

                const newAssignment = await vehicleAssignmentRepository.create(assignmentPayload, trx);

                createdAssignmentsData.push({ ...newAssignment, vehicle, driver });

                vehiclesToUpdate.add(vehicle_id);
                if (driver_id) {
                    driversToUpdate.add(driver_id);
                }
            }

            const updatePromises = [];
            vehiclesToUpdate.forEach(id => {
                updatePromises.push(vehicleRepository.update(id, { status: 'Not Available' }, trx));
            });
            driversToUpdate.forEach(id => {
                updatePromises.push(driverRepository.update(id, { status: 'Not Available' }, trx));
            });
            await Promise.all(updatePromises);


            await trx.commit();

        } catch (error) {
            await trx.rollback();
            throw error;
        }
        try {
            for (const assignment of createdAssignmentsData) {
                if (assignment.driver && assignment.driver.id_user) {
                    const driverUserData = await userRepository.findDriverByIdUser(assignment.driver.id_user);
                    const driverEmail = driverUserData?.email;

                    if (driverEmail) {
                        await sendAssignmentNotificationEmail(
                            driverEmail,
                            assignment,
                            requestDetails,
                            assignment.vehicle
                        );
                    } else {
                        console.warn(`Could not find email for driver ID: ${assignment.driver.id} (User HR ID: ${assignment.driver.id_user})`);
                    }
                }
            }
        } catch (emailError) {
            console.error('Failed to send assignment notification emails:', emailError);
        }

        return createdAssignmentsData;
    }

    async generateSPJPdf(id) {
        const data = await this.detail(id);
        const templatePath = path.join(__dirname, '..', '..', 'templates', 'pdf', 'spj-template.ejs');
        const logoPath = path.join(__dirname, '..', '..', 'public', 'images', 'logo.png');
        let base64Logo = '';
        try {
            const logoBuffer = await fs.readFile(logoPath);
            base64Logo = logoBuffer.toString('base64');
        } catch (err) {
            console.error("Gagal membaca file logo:", err);
        }

        const templateData = {
            request: data,
            moment: moment,
            logoBase64: base64Logo // Kirim data base64 ke template
        };

        const html = await ejs.renderFile(templatePath, templateData);

        let browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage'
                ],
                // executablePath: '/usr/bin/google-chrome' 
            });
            const page = await browser.newPage();

            await page.setContent(html, { waitUntil: 'networkidle0' });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20px',
                    right: '20px',
                    bottom: '20px',
                    left: '20px'
                }
            });

            return pdfBuffer;
        } catch (error) {
            console.error("Error generating PDF:", error);
            throw new Error("Failed to generate SPJ PDF.");
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    async myAssign(request) {
        const userId = getUserId(request);
        const driver = await driverRepository.findByUserId(userId);
        if (!driver) {
            const error = new Error('Driver not found for the logged-in user.');
            error.statusCode = 404;
            throw error;
        }
        return vehicleAssignmentRepository.findAllAssignmentsByDriverUserId(request.query, driver.id);
    }

    async exportRequestToExcel(queryParams) {
        const requests = await vehicleRequestRepository.findAllForExport(queryParams);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Laporan Pengajuan Kendaraan');
        worksheet.columns = [
            { header: 'ID Pengajuan', key: 'request_id', width: 12 },
            { header: 'Status', key: 'request_status', width: 15 },
            { header: 'Pemohon', key: 'user_name', width: 30 },
            { header: 'Cabang Pemohon', key: 'branch_name', width: 20 },
            { header: 'Keperluan', key: 'purpose', width: 35 },
            { header: 'Tujuan', key: 'destination', width: 30 },
            { header: 'Lokasi Jemput', key: 'pickup_location', width: 30 },
            { header: 'Waktu Mulai (WIB)', key: 'start_time', width: 22 },
            { header: 'Waktu Selesai (WIB)', key: 'end_time', width: 22 },
            { header: 'Jml Penumpang', key: 'passenger_count', width: 15 },
            { header: 'Nama Penumpang', key: 'passenger_names', width: 40 },
            { header: 'Jenis Kendaraan Diminta', key: 'requested_vehicle_type', width: 25 },
            { header: 'Jml Unit Diminta', key: 'requested_vehicle_count', width: 15 },
            { header: 'Butuh Supir?', key: 'requires_driver', width: 15 },
            { header: 'Catatan Pemohon', key: 'note', width: 30 },
            { header: 'Kendaraan Ditugaskan (Plat)', key: 'assigned_vehicles_plate', width: 30 },
            { header: 'Kendaraan Ditugaskan (Nama)', key: 'assigned_vehicles_name', width: 30 },
            { header: 'Supir Ditugaskan', key: 'assigned_drivers', width: 30 },
            { header: 'Catatan Untuk Supir', key: 'driver_notes', width: 40 },
            { header: 'Disetujui Oleh', key: 'approved_by', width: 25 },
            { header: 'Tgl Pengajuan', key: 'created_at', width: 22 },
        ];
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

        requests.forEach(request => {
            const pickupLocation = request.pickup_location_text || request.cabang?.nama_cab || '-';

            const assignedVehiclesPlate = request.detail?.map(d => d.vehicle?.license_plate || '?').join('\n') || '-';
            const assignedVehiclesName = request.detail?.map(d => d.vehicle?.name || '?').join('\n') || '-';
            const assignedDrivers = request.detail?.map(d => d.driver?.name || (request.requires_driver ? 'Belum Ditugaskan' : '-')).join('\n') || (request.requires_driver ? 'Belum Ditugaskan' : '-');
            const driverNotes = request.detail?.map(d => d.note_for_driver || '-').join('\n') || '-';
            const startTimeWIB = request.start_time ? moment(request.start_time).add(7, 'hours').format('YYYY-MM-DD HH:mm') : null
            const endTimeWIB = request.end_time ? moment(request.end_time).add(7, 'hours').format('YYYY-MM-DD HH:mm') : null;

            worksheet.addRow({
                request_id: request.id,
                request_status: request.status,
                user_name: request.user?.nama_user || '-',
                branch_name: request.cabang?.nama_cab || '-',
                purpose: request.purpose,
                destination: request.destination,
                pickup_location: pickupLocation,
                start_time: startTimeWIB || '-',
                end_time: endTimeWIB || '-',
                passenger_count: request.passenger_count,
                passenger_names: request.passenger_names || '-',
                requested_vehicle_type: request.vehicle_type?.name || '-',
                requested_vehicle_count: request.requested_vehicle_count,
                requires_driver: request.requires_driver === 1 ? 'Ya' : 'Tidak',
                note: request.note || '-',
                assigned_vehicles_plate: assignedVehiclesPlate,
                assigned_vehicles_name: assignedVehiclesName,
                assigned_drivers: assignedDrivers,
                driver_notes: driverNotes,
                approved_by: request.approved_by || '-',
                created_at: request.created_at ? moment.utc(request.created_at).utcOffset('+07:00').format('YYYY-MM-DD HH:mm') : '-',
            });

            const lastRow = worksheet.lastRow;
            if (lastRow) {
                ['assigned_vehicles_plate', 'assigned_vehicles_name', 'assigned_drivers', 'driver_notes', 'passenger_names'].forEach(key => {
                    const cell = lastRow.getCell(key);
                    cell.alignment = { ...cell.alignment, wrapText: true, vertical: 'top' };
                });
            }

        });

        worksheet.columns.forEach(column => {
            let maxLen = column.header?.length ?? 10;
            worksheet.getColumn(column.key).eachCell({ includeEmpty: true }, cell => {
                const len = cell.value?.toString().length ?? 0;
                if (len > maxLen) maxLen = len;
            });
            column.width = maxLen < 10 ? 10 : maxLen + 2;
        });


        return workbook;
    }
}

module.exports = new VehicleRequestService();