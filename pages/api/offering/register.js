import { catchErrors, connector } from '/lib/server.js';
import { getSession } from '../../../lib/session';

export default catchErrors(async (req, res) => {
    const data = req.body;
    const session = await getSession(req, res);
    const user = session.user;

    switch (req.method) {
        case 'GET':
            let categoriesList = [];
            if (user) {
                categoriesList = await connector.getCategories(user.access_token, user.id_token);
            }
            return {
                categories: categoriesList,
                market_name: process.env.MARKET_NAME,
                user
            };
        case 'POST':
            if (user) {
                await connector.registerOffering(user.access_token, user.id_token, data);
            }
            return null;
    }
});
