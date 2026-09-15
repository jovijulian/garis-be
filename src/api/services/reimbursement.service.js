const reimbursementRepository = require('../repositories/reimbursement.repository');
const userRepository = require('../repositories/user.repository');
const employeeRepository = require('../repositories/employee.repository');
const jabatanRepository = require('../repositories/jabatan.repository');
const { knexBooking } = require('../../config/database');
const { getUserId, formatDateTime, getRoleUser, getCabId } = require('../helpers/dataHelpers');
const moment = require('moment');
const fs = require('fs');
const ejs = require('ejs');
const path = require('path');

class ReimbursementService {

    async createRequest(request) {
        const userId = await getUserId(request);
        const payload = request.body;
        const files = request.files;
        const trx = await knexBooking.transaction();
        let newRequest;

        try {
            const employee = await employeeRepository.findByUserId(userId);
            const cabId = Number(payload.cab_id) || employee.id_cab;
            const currentMonth = moment().format('MM');
            const currentYear = moment().format('YYYY');

            const lastRequest = await reimbursementRepository.getLastRequestByBranchAndMonth(cabId, currentMonth, currentYear);
            let nextSequence = 1;

            if (lastRequest) {
                const lastNumberStr = lastRequest.document_number.split('/').pop();
                const lastSequence = parseInt(lastNumberStr, 10);
                if (!isNaN(lastSequence)) nextSequence = lastSequence + 1;
            }

            const docNumber = `REQ/REIMB/${currentYear}${currentMonth}/${String(nextSequence).padStart(3, '0')}`;

            // Parse details JSON string (dari multipart/form-data)
            let parsedDetails = [];
            let totalClaim = 0;
            if (payload.details) {
                parsedDetails = JSON.parse(payload.details);
                totalClaim = parsedDetails.reduce((sum, item) => sum + Number(item.claim_amount || 0), 0);
            }

            const insertPayload = {
                document_number: docNumber,
                user_id: userId,
                cab_id: cabId,
                dept_id: employee.id_dept,
                destination: payload.destination,
                start_date: payload.start_date,
                end_date: payload.end_date,
                duration: Number(payload.duration),
                duration_type: payload.duration_type,
                purpose: payload.purpose,
                total_claim: totalClaim,
                status: 'WAITING_MANAGER', // Status awal reimbursement
                is_active: 1,
                created_at: formatDateTime(),
            };

            newRequest = await reimbursementRepository.create(insertPayload, trx);

            // Insert Details
            if (parsedDetails.length > 0) {
                const detailsPayload = parsedDetails.map(detail => ({
                    reimbursement_id: Number(newRequest.id),
                    item_id: detail.item_id,
                    claim_amount: detail.claim_amount,
                    notes: detail.notes || null,
                    has_receipt: Number(detail.has_receipt) || 0,
                }));
                await reimbursementRepository.createDetails(detailsPayload, trx);
            }

            // Insert Attachments
            if (files && files.length > 0) {
                const attachmentsPayload = files.map(file => ({
                    reimbursement_id: Number(newRequest.id),
                    file_url: `uploads/${file.filename}`,
                    file_name: file.originalname,
                    file_type: file.mimetype
                }));
                await reimbursementRepository.createAttachments(attachmentsPayload, trx);
            }

            // Generate Approvals
            const approvalsToInsert = [];
            let order = 1;

            if (employee.head) {
                const jabAtasan = await jabatanRepository.findByKode(employee.head);
                if (jabAtasan) {
                    const atasanLangsung = await employeeRepository.findByJabatanId(jabAtasan.id_jab);
                    if (atasanLangsung) {
                        const userAtasan = await userRepository.findEmployDataByIdUser(atasanLangsung.nik);
                        if (userAtasan) {
                            approvalsToInsert.push({
                                reference_id: newRequest.id,
                                approver_type: 'MANAGER',
                                approval_order: order++,
                                assigned_to: userAtasan.id_user,
                                status: 'PENDING'
                            });
                        }
                    }
                }
            }

            approvalsToInsert.push({
                reference_id: newRequest.id,
                approver_type: 'GA_ADMIN', // HRGA
                approval_order: order++,
                assigned_to: null,
                status: 'PENDING'
            });

            await reimbursementRepository.createApprovals(approvalsToInsert, trx);
            await trx.commit();
        } catch (error) {
            await trx.rollback();
            if (files && files.length > 0) {
                files.forEach(file => {
                    if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
                });
            }
            throw error;
        }

        return newRequest;
    }

    async getAllUser(queryParams, request) {
        const userId = getUserId(request);
        return reimbursementRepository.findAllWithFiltersUser(queryParams, userId);
    }

    async getRequestById(id) {
        const request = await reimbursementRepository.findByIdWithRelations(id, '[requester, department, details.[item], approvals.[assigned_user], attachments]');
        if (!request) {
            const error = new Error('Reimbursement request not found.');
            error.statusCode = 404;
            throw error;
        }
        return request;
    }

    async updateApprovalStatus(requestId, request) {
        const userId = await getUserId(request);
        const roleGaris = await getRoleUser(request);
        const payload = request.body;
        
        const reimbursement = await reimbursementRepository.findByIdWithRelations(requestId, '[requester]');
        if (!reimbursement) {
            const error = new Error('Reimbursement request not found.');
            error.statusCode = 404;
            throw error;
        }

        const employee = await employeeRepository.findByUserId(userId);
        const cabId = employee ? employee.id_cab : getCabId(request);
        const pendingApproval = await reimbursementRepository.findPendingApproval(requestId, userId, roleGaris, cabId);
        
        if (!pendingApproval) {
            const error = new Error('You do not have permission to approve this request or it has already been processed.');
            error.statusCode = 403;
            throw error;
        }

        const trx = await knexBooking.transaction();
        let updatedRequest;

        try {
            await reimbursementRepository.updateApprovalRecord(pendingApproval.id, {
                status: payload.status,
                notes: payload.notes || null,
                action_by: userId,
                action_date: formatDateTime()
            }, trx);

            if (payload.status === 'REJECTED') {
                updatedRequest = await reimbursementRepository.update(requestId, {
                    status: 'REJECTED',
                    updated_at: formatDateTime()
                }, trx);

            } else if (payload.status === 'APPROVED') {
                if (pendingApproval.approver_type === 'GA_ADMIN') {
                    updatedRequest = await reimbursementRepository.update(requestId, {
                        status: 'CLOSED',
                        updated_at: formatDateTime()
                    }, trx);
                } else if (payload.forward_to_head1 === true) {
                    const requesterEmployee = await employeeRepository.findByUserId(reimbursement.user_id);
                    let forwarded = false;

                    if (requesterEmployee && requesterEmployee.head1) {
                        const jabHead1 = await jabatanRepository.findByKode(requesterEmployee.head1);
                        if (jabHead1) {
                            const atasanHead1 = await employeeRepository.findByJabatanId(jabHead1.id_jab);
                            if (atasanHead1) {
                                const userHead1 = await userRepository.findEmployDataByIdUser(atasanHead1.nik);
                                if (userHead1) {
                                    await reimbursementRepository.shiftGaAdminOrder(requestId, 3, trx);
                                    await reimbursementRepository.createApprovals([{
                                        reference_id: requestId,
                                        approver_type: 'MANAGER',
                                        approval_order: 2,
                                        assigned_to: userHead1.id_user,
                                        status: 'PENDING'
                                    }], trx);
                                    forwarded = true;
                                }
                            }
                        }
                    }

                    if (forwarded) {
                        updatedRequest = await reimbursementRepository.update(requestId, {
                            status: 'WAITING_MANAGER',
                            updated_at: formatDateTime()
                        }, trx);
                    } else {
                        updatedRequest = await reimbursementRepository.update(requestId, {
                            status: 'WAITING_GA',
                            updated_at: formatDateTime()
                        }, trx);
                    }

                } else {
                    updatedRequest = await reimbursementRepository.update(requestId, {
                        status: 'WAITING_GA',
                        updated_at: formatDateTime()
                    }, trx);
                }
            }

            await trx.commit();
        } catch (error) {
            await trx.rollback();
            throw error;
        }

        return updatedRequest;
    }

    async getAll(queryParams, request) {
        const siteId = request.user.sites ?? null;
        return siteId
            ? reimbursementRepository.findAllWithFilters(queryParams, siteId)
            : reimbursementRepository.findAllWithFilters(queryParams);
    }

    async updateRequest(id, request) {
        const payload = request.body;
        const files = request.files;

        const existingRequest = await this.getRequestById(id);

        if (existingRequest.status !== 'WAITING_MANAGER') {
            const error = new Error('This request cannot be edited as it has already been processed.');
            error.statusCode = 400;
            throw error;
        }

        const trx = await knexBooking.transaction();
        let updatedRequest;

        try {
            let parsedDetails = [];
            let totalClaim = 0;
            if (payload.details) {
                parsedDetails = JSON.parse(payload.details);
                totalClaim = parsedDetails.reduce((sum, item) => sum + Number(item.claim_amount || 0), 0);
            }

            const updatePayload = {
                cab_id: payload.cab_id ? Number(payload.cab_id) : existingRequest.cab_id,
                destination: payload.destination || existingRequest.destination,
                start_date: payload.start_date || existingRequest.start_date,
                end_date: payload.end_date || existingRequest.end_date,
                duration: Number(payload.duration) || Number(existingRequest.duration),
                duration_type: payload.duration_type || existingRequest.duration_type,
                purpose: payload.purpose || existingRequest.purpose,
                total_claim: payload.details ? totalClaim : existingRequest.total_claim,
                updated_at: formatDateTime(),
            };

            updatedRequest = await reimbursementRepository.update(id, updatePayload, trx);

            if (payload.details) {
                await reimbursementRepository.deleteDetailsByRequestId(id, trx); 
                if (parsedDetails.length > 0) {
                    const detailsPayload = parsedDetails.map(detail => ({
                        reimbursement_id: Number(id),
                        item_id: detail.item_id,
                        claim_amount: detail.claim_amount,
                        notes: detail.notes || null,
                        has_receipt: Number(detail.has_receipt) || 0,
                    }));
                    await reimbursementRepository.createDetails(detailsPayload, trx); 
                }
            }

            if (files && files.length > 0) {
                
                if (existingRequest.attachments && existingRequest.attachments.length > 0) {
                    existingRequest.attachments.forEach(attachment => {
                        if (attachment.file_url && fs.existsSync(attachment.file_url)) {
                            fs.unlinkSync(attachment.file_url);
                        }
                    });
                }

                await reimbursementRepository.deleteAttachmentsByRequestId(id, trx);

                const attachmentsPayload = files.map(file => ({
                    reimbursement_id: Number(id),
                    file_url: `uploads/${file.filename}`,
                    file_name: file.originalname,
                    file_type: file.mimetype
                }));
                await reimbursementRepository.createAttachments(attachmentsPayload, trx);
            }

            await trx.commit();
        } catch (error) {
            await trx.rollback();
            if (files && files.length > 0) {
                files.forEach(file => {
                    if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
                });
            }
            throw error;
        }

        return updatedRequest;
    }

    async deleteRequest(id) {
        const existingRequest = await this.getRequestById(id);

        if (existingRequest.status !== 'WAITING_MANAGER') {
            const error = new Error('This request cannot be deleted as it has already been processed.');
            error.statusCode = 400;
            throw error;
        }

        return knexBooking.transaction(async (trx) => {
            await reimbursementRepository.update(id, { is_active: 0, updated_at: formatDateTime() }, trx);
            return { message: 'Reimbursement request has been deleted successfully.' };
        });
    }

    async generateReimbursementHtml(id) {
        const data = await this.getRequestById(id);

        let jabatanName = '-';
        if (data.user_id) {
            try {
                const employee = await employeeRepository.findByUserId(data.user_id);
                if (employee && employee.id_jab) {
                    const jabatan = await jabatanRepository.findById(employee.id_jab);
                    if (jabatan) jabatanName = jabatan.nama_jab;
                }
            } catch (err) {
                console.warn("Could not fetch employee/jabatan for reimbursement:", err.message);
            }
        }

        // Process attachments to convert to base64 if local file exists
        if (data.attachments && data.attachments.length > 0) {
            data.attachments = data.attachments.map(att => {
                const cleanUrl = (att.file_url || '').replace(/^\/+/, '');
                const localPath = path.join(process.cwd(), 'public', cleanUrl);
                let base64Data = null;
                try {
                    if (fs.existsSync(localPath)) {
                        const fileBuf = fs.readFileSync(localPath);
                        base64Data = `data:${att.file_type || 'application/octet-stream'};base64,${fileBuf.toString('base64')}`;
                    }
                } catch (e) {
                    console.warn(`Could not read local attachment file: ${localPath}`, e.message);
                }
                return {
                    ...att,
                    base64Data: base64Data,
                    directUrl: `https://api-garis.cisangkan.co.id/${cleanUrl}`
                };
            });
        }

        const templatePath = path.join(__dirname, '..', '..', 'templates', 'pdf', 'reimbursement-pdf.ejs');

        const templateData = {
            request: data,
            jabatan: jabatanName,
            moment: moment 
        };

        try {
            const html = await ejs.renderFile(templatePath, templateData);
            return html;
        } catch (error) {
            console.error("Error rendering EJS:", error);
            throw new Error("Failed to render Reimbursement HTML.");
        }
    }
}

module.exports = new ReimbursementService();