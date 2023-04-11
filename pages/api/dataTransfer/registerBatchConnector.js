import { catchErrors, connector } from '/lib/server.js';
import { getSession } from '../../../lib/session';

export default catchErrors(async (req, res) => {
    const session = await getSession(req, res);
    const user = session.user;

    if (user) {
        const { dataSharingAgreement } = req.body;

        const offering = await connector.getFederatedOffering(user.access_token, user.id_token, dataSharingAgreement.dataOfferingDescription.dataOfferingId);

        if (offering) {
            const dataAccessEndpoint = offering.hasDataset.distribution[0].accessService.endpointURL;

            if (dataAccessEndpoint) {

                const connectorBodyRequest = {
                    offeringId: offering.dataOfferingId,
                    description: 'reg',
                    url: 'http://95.211.3.244:3536',
                    action: 'register'
                };
                return await connector.registerConnector(user.access_token, user.id_token, dataAccessEndpoint, connectorBodyRequest);
            }
            return { error: `Data Access Endpoint not founded for offering ${offering.dataOfferingId}` };
        }
    }
    return null;
});
