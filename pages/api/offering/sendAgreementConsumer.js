import { catchErrors, connector } from '../../../lib/server';
import { getSession } from '../../../lib/session';

export default catchErrors(async (req, res) => {
    const session = await getSession(req, res);
    const user = session.user;

    if (user) {
        const dataSharingAgreement = req.body;
        const message = {
            msg: `Proposal for offering "${dataSharingAgreement.dataOfferingDescription.title}" accepted. Please sign the agreement to finish the purchase`,
            dataSharingAgreement: dataSharingAgreement
        };
        await connector.createNotification(user.access_token, user.id_token, 'web-ri', dataSharingAgreement.parties.consumerDid, 'agreement.pending', message, 'OK');
    }
    return null;
});
