const vehicleRequestService = require('../services/vehicle-request.service');
const { success, error, paginated } = require('../../utils/response');
const moment = require('moment');
class VehicleRequestController {

    async create(req, res) {
        try {
            const data = await vehicleRequestService.create(req);
            return success(res, 201, data, 'Vehicle Request created successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getAll(req, res) {
        try {
            const paginatedData = await vehicleRequestService.getAll(req.query, req);
            return paginated(res, 200, paginatedData, 'Vehicle Requests retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async getAllUser(req, res) {
        try {
            const paginatedData = await vehicleRequestService.getAllUser(req);
            return paginated(res, 200, paginatedData, 'Vehicle Requests retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async detail(req, res) {
        try {
            const id = req.params.id;
            const data = await vehicleRequestService.detail(id);
            return success(res, 200, data, 'Vehicle Request retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;

            const data = await vehicleRequestService.update(id, req);
            return success(res, 200, data, 'Vehicle Request updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async delete(req, res) {
        try {
            const id = req.params.id;
            await vehicleRequestService.delete(id);
            return success(res, 200, null, 'Vehicle Request has been deleted successfully.');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async updateVehicleRequestStatus(req, res) {
        try {
            const id = req.params.id;

            const data = await vehicleRequestService.updateVehicleRequestStatus(id, req);
            return success(res, 200, data, 'Vehicle Request status updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async cancelRequest(req, res) {
        try {
            const id = req.params.id;

            const data = await vehicleRequestService.cancelRequest(id);
            return success(res, 200, data, 'Vehicle Request canceled successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async assign(req, res) {
        try {
            const id = req.params.requestId;
            const data = await vehicleRequestService.assign(id, req);
            return success(res, 201, data, 'Assignment successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }
    async downloadSPJ(req, res) {
        try {
            const id = req.params.id;

            const pdfBuffer = await vehicleRequestService.generateSPJPdf(id);
            const data = await vehicleRequestService.detail(id);
            const filename = `SPJ_Request_${id}_${moment(data.start_time).format('YYYYMMDD')}.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

            res.send(pdfBuffer);

        } catch (err) {
            console.error("Error in downloadSPJ:", err);
            return error(res, err.statusCode || 500, "Failed to generate SPJ PDF.");
        }
    }

    async myAssign(req, res) {
        try {
            const paginatedData = await vehicleRequestService.myAssign(req);
            return paginated(res, 200, paginatedData, 'Assigned Vehicle Requests retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async exportToExcel(req, res) {
        try {
            const workbook = await vehicleRequestService.exportRequestToExcel(req.query);

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="vehicle_request_report_${moment().format('YYYY-MM-DD')}.xlsx"`
            );

            await workbook.xlsx.write(res);
            res.end();

        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getSchedule(req, res) {
        try {
            const data = await vehicleRequestService.getSchedule(req.query);
            // Note: Not using 'paginated' helper here, assuming it's a single day's schedule
            return success(res, 200, data, 'Vehicle schedule retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

}

module.exports = new VehicleRequestController();