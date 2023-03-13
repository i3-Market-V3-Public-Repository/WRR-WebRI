import { Button, Form, Modal } from 'react-bootstrap';
import RatingInfo from '../../components/contract/RatingInfo';
import Layout from '../../components/layout/Layout';
import ContractParameters from '../../components/contract/ContractParameters';
import { useRouter } from 'next/router';
import { useData } from '../../lib/hooks';
import { useState } from 'react';
import { Loading } from '../../components/layout/Loading';
import Error from '../../components/layout/Error';
import { walletApi } from '../../lib/walletApi';
import { NonRepudiationProtocol, I3mWalletAgentDest } from '@i3m/non-repudiation-library';

export default function ContractPage() {
    const router = useRouter();
    const { agreementId } = router.query;
    const { data, error, isValidating } = useData(`/api/contracts/${agreementId}`);
    const [ showTransfer, setShowTransfer ] = useState(false);

    if (isValidating)
        return <Loading />;

    if (error)
        return <Error error={error} />;

    function onBack() {
        router.back();
    }

    function onTransferClick() {
        setShowTransfer(true);
    }

    async function onTransfer(e) {
        e.preventDefault();

        const { agreementId, consumerPublicKey, offering, user } = data;

        // TODO transfer data

        const wallet = await walletApi();

        // retrieve ethereumAddress from wallet
        const walletInfo = await wallet.identities.info({ did: user.DID });
        const ethereumAddress = walletInfo.addresses[0];

        // retrieve agreements from wallet
        const agreements = await wallet.resources.list({ type: 'Contract', identity: user.DID });

        // get dataSharingAgreement according to consumerPublicKey in agreement
        const dataSharingAgreement = agreements.find(res => res.resource.keyPair.publicJwk === consumerPublicKey).resource.dataSharingAgreement;

        const dataAccessEndpoint = offering.hasDataset.distribution[0].accessService.endpointURL;
        if (dataAccessEndpoint) {
            // validate market fee
            fetch('/api/dataTransfer/payMarketFee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agreementId: agreementId,
                    senderAddress: ethereumAddress,
                    providerMPAddress: dataSharingAgreement.dataExchangeAgreement.ledgerSignerAddress,
                    consumerMPAddress: dataSharingAgreement.dataExchangeAgreement.ledgerSignerAddress,
                    dataAccessEndpoint: dataAccessEndpoint
                }),
            }).then(res => {
                res.json().then(async pay => {
                    // fee is 0, don't need to pay to market a fee
                    if (pay.name === 'OK') {
                        await getBlockData(wallet, user, consumerPublicKey, dataAccessEndpoint, dataSharingAgreement);
                    }
                    // TODO other cases

                });
            });
        } else {
            console.error(`Data Access Endpoint not found for Offering: ${offering.dataOfferingId}`);
            setShowTransfer(false);
        }
    }

    async function getBlockData(wallet, user, consumerPublicKey, dataAccessEndpoint, dataSharingAgreement) {
        const bearerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIwLjAuMC4wIiwiYXVkIjoiMC4wLjAuMCIsImV4cCI6MTY2ODY5MDcyNiwic3ViIjoiZGlkOmV0aHI6aTNtOjB4MDNlZGRjYzU0YmZiZGNlNGZiZDU5OGY0ODI3MzUxZmViMjMxMGQwMDVmYjFkNTMxNDVlNjc4N2QwYTZmN2IwZjVmIiwic2NvcGUiOiJvcGVuaWQgdmMgdmNlOmNvbnN1bWVyIiwiaWF0IjoxNjY4NjA0MzI2fQ.xnGXN3H754Hz1Y7bdJgmxTxSY59imspJLDmTwq6VUkQ';
        const agreementId = 17;
        const data = 'exampledata.7z';
        let blockId = 'null';
        let blockAck = 'null';

        const dataExchangeAgreement = dataSharingAgreement.dataExchangeAgreement;
        console.log('DataExchangeAgreement', dataExchangeAgreement);

        // DLT agent providing read connection to the ledger
        const consumerDltAgent = new I3mWalletAgentDest(wallet, user.DID);
        console.log('Consumer DLT Agent', consumerDltAgent);

        // retrieve consumer private key from the wallet
        const consumerKeys = await wallet.resources.list({ type: 'KeyPair', identity: user.DID });
        const consumerPrivateKey = consumerKeys.find(res => res.resource.keyPair.publicJwk === consumerPublicKey).resource.keyPair.privateJwk;
        console.log('Consumer Private Key', consumerPrivateKey);
    }

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
                    <RatingInfo {...data.rating} forProvider={data.offering.providerDid} onTransaction={agreementId} isAgreement/>
                </Form>
            </Layout>
            {showModal()}
        </>
    );
}
