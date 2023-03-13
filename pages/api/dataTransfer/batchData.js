import { catchErrors, connector } from '../../../lib/server';
import { getSession } from '../../../lib/session';

export default catchErrors(async (req, res) => {
    const session = await getSession(req, res);
    const user = session.user;

    if (user) {
        const { agreementId, dataAccessEndpoint, data, blockId, blockAck } = req.body;
        return await connector.downloadBatchData(user.access_token, user.id_token, dataAccessEndpoint, agreementId, data, { blockId, blockAck });
    }
    return null;
});
