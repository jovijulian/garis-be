const approvalRepository = require('../repositories/approval.repository');
const employeeRepository = require('../repositories/employee.repository');
const projectRequestService = require('./project-request.service');
const { getUserId, getRoleUser } = require('../helpers/dataHelpers');

class ApprovalService {
    async getMyNotifications(request) {
        const userId = await getUserId(request);
        const roleGaris = await getRoleUser(request);

        const employee = await employeeRepository.findByUserId(userId);
        const cabId = employee ? employee.id_cab : null;

        const notifications = await approvalRepository.getPendingNotifications(userId, cabId, roleGaris);

        return notifications.map(notif => {
            let title = 'Pengajuan Baru';
            let description = '-';
            let requesterName = 'Unknown';

            if (notif.module_name === 'PROJECT_REQUEST' && notif.project_request) {
                title = `Pengajuan Perbaikan: ${notif.project_request.document_number}`;
                description = notif.project_request.problem_description;
                if (notif.project_request.requester) {
                    requesterName = notif.project_request.requester.nama_user;
                }
            }

            return {
                id_approval: notif.id,
                reference_id: notif.reference_id,
                module_name: notif.module_name,
                approver_type: notif.approver_type,
                title: title,
                description: description,
                requester_name: requesterName,
                created_at: notif.created_at
            };
        });
    }

    async getNotificationDetail(id, request) {
        const userId = await getUserId(request);
        const roleGaris = await getRoleUser(request);

        const approval = await approvalRepository.findDetailById(id);

        if (!approval) {
            const error = new Error('Approval notification not found.');
            error.statusCode = 404;
            throw error;
        }

        let isAuthorized = false;

        if (approval.assigned_to === userId) {
            isAuthorized = true;
        }
        else if (roleGaris === 2 && approval.approver_type === 'GA_ADMIN' && approval.assigned_to === null) {
            const employee = await employeeRepository.findByUserId(userId);
            if (employee && approval.project_request && approval.project_request.cab_id === employee.id_cab) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            const error = new Error('You do not have permission to view this approval detail.');
            error.statusCode = 403;
            throw error;
        }

        const canForward = (approval.approver_type === 'MANAGER' && approval.approval_order === 1);

        return {
            approval_info: {
                id_approval: approval.id,
                module_name: approval.module_name,
                approver_type: approval.approver_type,
                status: approval.status,
                can_forward: canForward,
                created_at: approval.created_at
            },
            request_detail: approval.project_request
        };
    }

    async processAction(request) {
        const approvalId = request.params.id;

        const approval = await approvalRepository.findById(approvalId);

        if (!approval) {
            const error = new Error('Approval record not found.');
            error.statusCode = 404;
            throw error;
        }

        let result;

        switch (approval.module_name) {
            case 'PROJECT_REQUEST':
                await projectRequestService.updateApprovalStatus(approval.reference_id, request);
                break;

            case 'LEAVE_REQUEST':
                break;

            default:
                const err = new Error(`Module ${approval.module_name} is not supported for general action.`);
                err.statusCode = 400;
                throw err;
        }

        return result;
    }
}

module.exports = new ApprovalService();