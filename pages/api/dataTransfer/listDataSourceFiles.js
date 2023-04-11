import { catchErrors, connector } from '../../../lib/server';
import { getSession } from '../../../lib/session';

export default catchErrors(async (req, res) => {
    const session = await getSession(req, res);
    const user = session.user;

    if (user) {
        const { dataAccessEndpoint, offeringId } = req.body;
        return await connector.getListDataSourceFiles(user.access_token, user.id_token, dataAccessEndpoint, offeringId);
    }
    return null;
});
