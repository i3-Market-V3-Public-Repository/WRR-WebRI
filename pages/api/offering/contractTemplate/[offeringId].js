import { catchErrors, connector } from '/lib/server.js';
import { getSession } from '../../../../lib/session';

export default catchErrors(async (req, res) => {
    const { offeringId } = req.query;
    const session = await getSession(req, res);
    const user = session.user;

    if (user) {
        switch (req.method) {
            case 'GET':
                const template = await connector.getContractTemplate(user.access_token, user.id_token, offeringId);
                const offering = await connector.getFederatedOffering(user.access_token, user.id_token, offeringId);
                return { ...template, offering, user };
        }
    }
    return null;
});
