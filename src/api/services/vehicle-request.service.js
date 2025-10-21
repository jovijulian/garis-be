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
}

module.exports = new VehicleRequestService();