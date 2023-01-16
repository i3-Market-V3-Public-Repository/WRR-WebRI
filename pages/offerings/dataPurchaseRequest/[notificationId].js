import { useRouter } from 'next/router';
import { useData } from '../../../lib/hooks';
import { Loading } from '../../../components/layout/Loading';
import BigText from '../../../components/common/BigText';
import Error from '../../../components/layout/Error';
import DataPurchaseRequest from '../../../components/contract/DataPurchaseRequest';

export default function DataPurchaseRequestPage() {
    const router = useRouter();
    const { notificationId } = router.query;
    const { data, error, isValidating } = useData(`/api/notification/${notificationId}`);

    if (isValidating)
        return <Loading />;

    if (!data)
        return <BigText>Notification {notificationId} not found</BigText>;

    if (error)
        return <Error error={error} />;

    return <DataPurchaseRequest {...data} />;
}
