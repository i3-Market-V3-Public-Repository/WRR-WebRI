import { catchErrors, connector } from '../../../lib/server';
import { getSession } from '../../../lib/session';

export default catchErrors(async (req, res) => {
    const session = await getSession(req, res);
    const user = session.user;

    if (user) {
        const template = req.body;
        await connector.createDataPurchase(user.access_token, user.id_token, 'web-ri', user.DID, '', template);
        await sendNotificationProvider(template, user);
        return;
    }
    return null;
});

async function sendNotificationProvider(template, user) {
    const message = {
        msg: `Agreement pending for offering ${template.dataOfferingDescription.dataOfferingId}`,
        template: template
    };
    await connector.createNotification(user.access_token, user.id_token, 'web-ri', template.parties.providerDid, 'agreement.pending', message, 'OK');
}