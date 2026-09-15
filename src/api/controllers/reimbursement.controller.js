const reimbursementService = require('../services/reimbursement.service');
const { success, error, paginated } = require('../../utils/response');

class ReimbursementController {

    async createRequest(req, res) {
        try {
            const data = await reimbursementService.createRequest(req);
            return success(res, 201, data, 'Reimbursement request created successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getAllUser(req, res) {
        try {
            const paginatedData = await reimbursementService.getAllUser(req.query, req);
            return paginated(res, 200, paginatedData, 'Reimbursement requests retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async detail(req, res) {
        try {
            const id = req.params.id;
            const data = await reimbursementService.getRequestById(id);
            return success(res, 200, data, 'Reimbursement request retrieved successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;
            const data = await reimbursementService.updateRequest(id, req);
            return success(res, 200, data, 'Reimbursement request updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async delete(req, res) {
        try {
            const id = req.params.id;
            await reimbursementService.deleteRequest(id);
            return success(res, 200, null, 'Reimbursement request has been deleted successfully.');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async updateApproval(req, res) {
        try {
            const id = req.params.id;
            const data = await reimbursementService.updateApprovalStatus(id, req);
            return success(res, 200, null, 'Reimbursement approval status updated successfully');
        } catch (err) {
            return error(res, err.statusCode || 500, err);
        }
    }

    async getAll(req, res) {
        try {
            const paginatedData = await reimbursementService.getAll(req.query, req);
            return paginated(res, 200, paginatedData, 'Reimbursement requests retrieved successfully');
        } catch (err) {
            return error(res, 500, err);
        }
    }

    async downloadPDF(req, res) {
        try {
            const id = req.params.id;

            if (req.query.format === 'html') {
                const htmlContent = await reimbursementService.generateReimbursementHtml(id);
                res.setHeader('Content-Type', 'text/html');
                return res.send(htmlContent);
            }

            const pdfBuffer = await reimbursementService.generateReimbursementPdf(id);
            const data = await reimbursementService.getRequestById(id);
            const docNum = (data?.document_number || `REQ-${id}`).replace(/[\/\\:]/g, '_');

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="reimbursement_${docNum}.pdf"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            return res.send(pdfBuffer);

        } catch (err) {
            console.error("Error in downloadPDF:", err);
            return error(res, err.statusCode || 500, "Failed to generate Reimbursement PDF.");
        }
    }
}

module.exports = new ReimbursementController();