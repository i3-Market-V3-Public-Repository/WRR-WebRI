import { catchErrors, connector } from '../../../lib/server';
import { getSession } from '../../../lib/session';

export default catchErrors(async (req, res) => {
    const session = await getSession(req, res);
    const user = session.user;

    if (user) {
        const { agreementId, senderAddress, providerMPAddress, consumerMPAddress, dataAccessEndpoint } = req.body;

        console.log(req.body)

        const bodyRequest = {
            senderAddress: senderAddress,
            providerMPAddress: providerMPAddress,
            consumerMPAddress: consumerMPAddress
        }

        return await connector.payMarketFee(user.access_token, user.id_token, 'http://95.211.3.244:3100', 92, bodyRequest);
    }
    return null;
});
