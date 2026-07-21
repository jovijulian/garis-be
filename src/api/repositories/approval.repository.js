const BaseRepository = require('./base.repository');
const Approval = require('../models/Approval');
const ProjectRequest = require('../models/ProjectRequest');

class ApprovalRepository extends BaseRepository {
    constructor() {
        super(Approval);
    }

    async getPendingNotifications(userId, cabId, roleGaris) {
        const query = Approval.query()
            .where('approvals.status', 'PENDING')
            .withGraphFetched('[project_request.[requester(selectUsername)]]')
            .modifiers({
                selectUsername: builder => builder.select('id_user', 'nama_user')
            })
            .andWhere(builder => {
                builder.where('approvals.assigned_to', userId);
                // if (roleGaris === 2) {
                //     builder.orWhere(gaBuilder => {
                //         gaBuilder.where('approvals.approver_type', 'GA_ADMIN')
                //                  .whereNull('approvals.assigned_to')
                //                  .where('approvals.module_name', 'PROJECT_REQUEST')
                //                  .whereExists(
                //                      ProjectRequest.query()
                //                          .whereRaw('project_requests.id = approvals.reference_id')
                //                          .andWhere('project_requests.cab_id', cabId)
                //                  );
                //     });
                // }
            })
            .orderBy('approvals.created_at', 'DESC');

        return query;
    }

    async findDetailById(id) {
        return Approval.query()
            .findById(id)
            .withGraphFetched('project_request.[requester(selectUsername), department(selectDeptName), attachments]')
            .modifiers({
                selectUsername: builder => builder.select('id_user', 'nama_user'),
                selectDeptName: builder => builder.select('id_dept', 'nama_dept')
            });
    }
}

module.exports = new ApprovalRepository();