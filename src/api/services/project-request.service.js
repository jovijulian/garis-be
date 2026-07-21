const projectRequestRepository = require('../repositories/project-request.repository');
const userRepository = require('../repositories/user.repository');
const employeeRepository = require('../repositories/employee.repository');
const jabatanRepository = require('../repositories/jabatan.repository');
const { knexBooking } = require('../../config/database');
const { getUserId, formatDateTime, getRoleUser } = require('../helpers/dataHelpers');
const moment = require('moment');
const fs = require('fs');

class ProjectRequestService {

    async createRequest(request) {
        const userId = await getUserId(request);
        const payload = request.body;
        const files = request.files;
        const trx = await knexBooking.transaction();
        let newRequest;

        try {
            const employee = await employeeRepository.findByUserId(userId);

            const cabId = Number(payload.cab_id);
            const currentMonth = moment().format('MM');
            const currentYear = moment().format('YYYY');

            const lastRequest = await projectRequestRepository.getLastRequestByBranchAndMonth(cabId, currentMonth, currentYear);
            let nextSequence = 1;

            if (lastRequest) {
                const lastNumberStr = lastRequest.document_number.split('/').pop();
                const lastSequence = parseInt(lastNumberStr, 10);
                if (!isNaN(lastSequence)) {
                    nextSequence = lastSequence + 1;
                }
            }

            const paddedSequence = String(nextSequence).padStart(3, '0');
            const docNumber = `REQ/GA/${currentYear}${currentMonth}/${paddedSequence}`;

            const insertPayload = {
                document_number: docNumber,
                user_id: userId,
                cab_id: cabId,
                dept_id: employee.id_dept,
                problem_description: payload.problem_description,
                root_cause: payload.root_cause || null,
                corrective_action: payload.corrective_action || null,
                status: 'WAITING_APPROVAL',
                is_active: 1,
                request_date: formatDateTime()
            };

            newRequest = await projectRequestRepository.create(insertPayload, trx);

            if (files && files.length > 0) {
                const attachmentsPayload = files.map(file => ({
                    request_id: newRequest.id,
                    progress_id: null,
                    file_url: `uploads/${file.filename}`,
                    file_name: file.originalname,
                    file_type: file.mimetype
                }));
                await projectRequestRepository.createAttachments(attachmentsPayload, trx);
            }

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
                approver_type: 'GA_ADMIN',
                approval_order: order++,
                assigned_to: null,
                status: 'PENDING'
            });

            await projectRequestRepository.createApprovals(approvalsToInsert, trx);
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
        const userId = getUserId(request)
        return projectRequestRepository.findAllWithFiltersUser(queryParams, userId)
    }

    async getRequestById(id) {
        const request = await projectRequestRepository.findByIdWithRelations(id, '[requester, department, approvals.[assigned_user], attachments, progress_timeline.[attachments]]');
        if (!request) {
            const error = new Error('Project request not found.');
            error.statusCode = 404;
            throw error;
        }
        return request;
    }

    async updateRequest(id, request) {
        const payload = request.body;
        const files = request.files;

        const existingRequest = await this.getRequestById(id);

        if (existingRequest.status !== 'WAITING_APPROVAL') {
            const error = new Error('This request cannot be edited as it has already been processed.');
            error.statusCode = 400;
            throw error;
        }

        const trx = await knexBooking.transaction();
        let updatedRequest;

        try {
            const updatePayload = {
                cab_id: Number(payload.cab_id),
                problem_description: payload.problem_description,
                root_cause: payload.root_cause || null,
                corrective_action: payload.corrective_action || null,
                updated_at: formatDateTime(),
            };

            updatedRequest = await projectRequestRepository.update(id, updatePayload, trx);

            if (files && files.length > 0) {

                if (existingRequest.attachments && existingRequest.attachments.length > 0) {
                    existingRequest.attachments.forEach(attachment => {
                        if (attachment.file_url && fs.existsSync(attachment.file_url)) {
                            fs.unlinkSync(attachment.file_url);
                        }
                    });
                }

                await projectRequestRepository.deleteAttachmentsByRequestId(id, trx);

                const attachmentsPayload = files.map(file => ({
                    request_id: id,
                    progress_id: null,
                    file_url: `uploads/${file.filename}`,
                    file_name: file.originalname,
                    file_type: file.mimetype
                }));

                await projectRequestRepository.createAttachments(attachmentsPayload, trx);
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

        if (existingRequest.status !== 'WAITING_APPROVAL') {
            const error = new Error('This request cannot be deleted as it has already been processed.');
            error.statusCode = 400;
            throw error;
        }

        return knexBooking.transaction(async (trx) => {
            await projectRequestRepository.update(id, { is_active: 0 }, trx);
            return { message: 'Project request has been deleted successfully.' };
        });
    }

    async updateApprovalStatus(requestId, request) {
        const userId = await getUserId(request);
        const roleGaris = await getRoleUser(request);
        const payload = request.body;
        const projectRequest = await projectRequestRepository.findByIdWithRelations(requestId, '[requester]');
        if (!projectRequest) {
            const error = new Error('Project request not found.');
            error.statusCode = 404;
            throw error;
        }
        const employee = await employeeRepository.findByUserId(userId);
        const cabId = employee ? employee.id_cab : null;

        const pendingApproval = await projectRequestRepository.findPendingApproval(requestId, userId, roleGaris, cabId);
        if (!pendingApproval) {
            const error = new Error('You do not have permission to approve this request or it has already been processed.');
            error.statusCode = 403;
            throw error;
        }

        const trx = await knexBooking.transaction();
        let updatedRequest;

        try {
            await projectRequestRepository.updateApprovalRecord(pendingApproval.id, {
                status: payload.status,
                notes: payload.notes || null,
                action_by: userId,
                action_date: formatDateTime()
            }, trx);

            if (payload.status === 'REJECTED') {
                updatedRequest = await projectRequestRepository.update(requestId, {
                    status: 'REJECTED',
                    updated_at: formatDateTime()
                }, trx);

            } else if (payload.status === 'APPROVED') {
                if (pendingApproval.approver_type === 'GA_ADMIN') {
                    updatedRequest = await projectRequestRepository.update(requestId, {
                        status: 'IN_PROGRESS',
                        updated_at: formatDateTime()
                    }, trx);
                } else if (payload.forward_to_head1 === true) {
                    const requesterEmployee = await employeeRepository.findByUserId(projectRequest.user_id);
                    let forwarded = false;

                    if (requesterEmployee && requesterEmployee.head1) {
                        const jabHead1 = await jabatanRepository.findByKode(requesterEmployee.head1);
                        if (jabHead1) {
                            const atasanHead1 = await employeeRepository.findByJabatanId(jabHead1.id_jab);
                            if (atasanHead1) {
                                const userHead1 = await userRepository.findEmployDataByIdUser(atasanHead1.nik);
                                if (userHead1) {
                                    await projectRequestRepository.shiftGaAdminOrder(requestId, 3, trx);

                                    await projectRequestRepository.createApprovals([{
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
                        updatedRequest = await projectRequestRepository.update(requestId, {
                            status: 'WAITING_APPROVAL',
                            updated_at: formatDateTime()
                        }, trx);
                    } else {
                        updatedRequest = await projectRequestRepository.update(requestId, {
                            status: 'WAITING_GA',
                            updated_at: formatDateTime()
                        }, trx);
                    }

                } else {
                    updatedRequest = await projectRequestRepository.update(requestId, {
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
            ? projectRequestRepository.findAllWithFilters(queryParams, siteId)
            : projectRequestRepository.findAllWithFilters(queryParams);
    }

    async addProgress(requestId, request) {
        const userId = await getUserId(request);
        const payload = request.body;
        const files = request.files;

        const existingRequest = await this.getRequestById(requestId);

        if (!['IN_PROGRESS', 'REVISION'].includes(existingRequest.status)) {
            const error = new Error('Cannot add progress. Request is not in progress.');
            error.statusCode = 400;
            throw error;
        }

        const trx = await knexBooking.transaction();
        let newProgress;

        try {
            const progressPayload = {
                request_id: Number(requestId),
                user_id: userId,
                title: payload.title,
                description: payload.description,
                progress_type: 'UPDATE_GA'
            };
            newProgress = await projectRequestRepository.createProgress(progressPayload, trx);

            if (files && files.length > 0) {
                const attachmentsPayload = files.map(file => ({
                    request_id: null,
                    progress_id: newProgress.id,
                    file_url: `uploads/${file.filename}`,
                    file_name: file.originalname,
                    file_type: file.mimetype
                }));
                await projectRequestRepository.createAttachments(attachmentsPayload, trx);
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

        return newProgress;
    }

    async requestVerification(requestId, request) {
        const existingRequest = await this.getRequestById(requestId);

        if (!['IN_PROGRESS', 'REVISION'].includes(existingRequest.status)) {
            const error = new Error('Request must be IN_PROGRESS to ask for verification.');
            error.statusCode = 400;
            throw error;
        }

        const trx = await knexBooking.transaction();
        let updatedRequest;

        try {
            updatedRequest = await projectRequestRepository.update(requestId, {
                status: 'WAITING_VERIFICATION',
                updated_at: formatDateTime()
            }, trx);

            await trx.commit();
        } catch (error) {
            await trx.rollback();
            throw error;
        }

        return updatedRequest;
    }

    async verifyRequest(requestId, request) {
        const userId = await getUserId(request);
        const payload = request.body;
        const files = request.files; 

        const existingRequest = await this.getRequestById(requestId);

        if (existingRequest.user_id !== userId) {
            const error = new Error('You do not have permission to verify this request.');
            error.statusCode = 403;
            throw error;
        }

        if (existingRequest.status !== 'WAITING_VERIFICATION') {
            const error = new Error('Request is not waiting for verification.');
            error.statusCode = 400;
            throw error;
        }

        const trx = await knexBooking.transaction();
        let updatedRequest;

        try {
            updatedRequest = await projectRequestRepository.update(requestId, {
                status: payload.status,
                completion_date: payload.status === 'CLOSED' ? formatDateTime() : null,
                updated_at: formatDateTime()
            }, trx);

            const progressType = payload.status === 'CLOSED' ? 'CLOSE_COMMENT_USER' : 'REVISION_USER';

            const progressTitle = payload.title || (payload.status === 'CLOSED' ? 'Karyawan Mengkonfirmasi Selesai' : 'Karyawan Meminta Revisi');
            const progressDesc = payload.description || (payload.status === 'CLOSED' ? '-' : '-');

            const progressPayload = {
                request_id: Number(requestId),
                user_id: userId,
                title: progressTitle,
                description: progressDesc,
                progress_type: progressType
            };
            const newProgress = await projectRequestRepository.createProgress(progressPayload, trx);

            if (files && files.length > 0) {
                const attachmentsPayload = files.map(file => ({
                    request_id: null,
                    progress_id: newProgress.id,
                    file_url: `uploads/${file.filename}`,
                    file_name: file.originalname,
                    file_type: file.mimetype
                }));
                await projectRequestRepository.createAttachments(attachmentsPayload, trx);
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
}

module.exports = new ProjectRequestService();