import { catchErrors, connector } from '/lib/server.js';
import { getSession } from '../../../lib/session';

export default catchErrors(async (req, res) => {
    const session = await getSession(req, res);
    const user = session.user;

    if (user) {
        const { publicKey, privateKey, dataSharingAgreement } = req.body;

        // retrieve the list of agreements associated to dataSharingAgreement offering (an offering could have many agreements)
        const agreements = await connector.getAgreementsByOffering(user.access_token, user.id_token, dataSharingAgreement.dataOfferingDescription.dataOfferingId);

        // retrieve the offering associated to dataSharingAgreement
        const offering = await connector.getFederatedOffering(user.access_token, user.id_token, dataSharingAgreement.dataOfferingDescription.dataOfferingId);

        if (offering) {
            // retrieve endpointURL from dataset distribution
            const dataAccessEndpoint = offering.hasDataset.distribution[0].accessService.endpointURL;

            if (dataAccessEndpoint) {
                // retrieve the agreement with corresponding provider public key
                const agreement = agreements.find(el=>el.providerPublicKey === publicKey);
                if (agreement) {
                    const publishBodyRequest = {
                        agreementId: agreement.agreementId,
                        providerPublicKey: JSON.parse(publicKey),
                        providerPrivateKey: JSON.parse(privateKey),
                        dataSharingAgreement
                    };

                    // publish dataSharingAgreement to Data Access
                    await connector.publishDataSharing(user.access_token, user.id_token, dataAccessEndpoint, publishBodyRequest);

                    // TODO batch or stream url

                    // register connector to Data Access API
                    const connectorBodyRequest = {
                        offeringId: offering.dataOfferingId,
                        description: 'reg',
                        url: 'http://95.211.3.244:3536',
                        action: 'register'
                    };
                    return await connector.registerConnector(dataAccessEndpoint, connectorBodyRequest);
                }
            }
        }
    }
    return null;
});
