import { useRouter } from 'next/router';
import { useData } from '../../lib/hooks';
import Error from '../../components/layout/Error';
import ContractParameters from '../../components/contract/ContractParameters';
import { Button, Form, Modal } from 'react-bootstrap';
import Layout from '../../components/layout/Layout';
import { Loading } from '../../components/layout/Loading';
import { useState } from 'react';

export default function ContractPage() {
    const router = useRouter();
    const { agreementId } = router.query;
    const { data, error, isValidating } = useData(`/api/contracts/${agreementId}`);
    const [ showTransfer, setShowTransfer ] = useState(false);

    if (isValidating)
        return <Loading />;

    if (error)
        return <Error error={error} />;

    console.log(data);

    function onBack() {
        router.back();
    }

    function onTransferClick() {
        setShowTransfer(true);
    }

    function onTransfer() {
        // TODO call payMarketFee
        // TODO transfer data
    }

    return (
        <>
            <Layout>
                <Form className="px-5 pb-3 d-flex flex-column flex-grow-1">
                    <div className="d-flex">
                        <h3 className="flex-grow-1 mb-0">Contract Details</h3>
                        { data.user.consumer ? (
                            <Button variant="primary" onClick={onTransferClick}>Transfer Data</Button>
                        ) : null}
                        <Button className="ml-2" variant="secondary" onClick={onBack}>Back</Button>
                    </div>
                    <ContractParameters {...data} disableInput isAgreement/>
                </Form>
            </Layout>
            {showModal()}
        </>
    );

    function showModal() {
        if (showTransfer) {
            return (
                <Modal show={showTransfer} onHide={() => setShowTransfer(false)}>
                    <Modal.Header closeButton>
                        Transfer Data
                    </Modal.Header>
                    <Modal.Body>
                        Do you want to transfer the data ?
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowTransfer(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={onTransfer}>
                            Download
                        </Button>
                    </Modal.Footer>
                </Modal>
            );
        }
    }
}
