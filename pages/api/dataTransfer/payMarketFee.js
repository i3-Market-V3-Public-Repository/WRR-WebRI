import { catchErrors, connector } from '../../../lib/server';
import { getSession } from '../../../lib/session';

export default catchErrors(async (req, res) => {
    const session = await getSession(req, res);
    const user = session.user;

    if (user) {
        const { agreementId, senderAddress, providerMPAddress, consumerMPAddress, dataAccessEndpoint } = req.body;

        const bodyRequest = {
            senderAddress: senderAddress,
            providerMPAddress: providerMPAddress,
            consumerMPAddress: consumerMPAddress
        };

        return await connector.payMarketFee(user.access_token, user.id_token, dataAccessEndpoint, agreementId, bodyRequest);
    }
    return null;
});
