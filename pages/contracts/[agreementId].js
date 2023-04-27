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
import { I3mWalletAgentDest, NonRepudiationProtocol } from '@i3m/non-repudiation-library';
import { saveAs } from 'file-saver';

export default function ContractPage() {
    const router = useRouter();
    const { agreementId } = router.query;
    const { data, error, isValidating } = useData(`/api/contracts/${agreementId}`);
    const [ showTransfer, setShowTransfer ] = useState(false);
    const [ showMsg, setShowMsg ] = useState(false);
    const [ transferMsg, setTransferMsg ] = useState('');

    if (isValidating)
        return <Loading />;

    if (error)
        return <Error error={error} />;

    function onBack() {
        router.back();
    }

    function onTransferClick() {
        setTransferMsg('');
        setShowTransfer(true);
    }

    async function onTransfer(e) {
        e.preventDefault();
        setShowMsg(false);
        setTransferMsg('');

        const { agreementId, consumerPublicKey, offering, user } = data;

        const wallet = await walletApi();

        // retrieve ethereumAddress from wallet
        const walletInfo = await wallet.identities.info({ did: user.DID });
        const ethereumAddress = walletInfo.addresses[0];

        // retrieve agreements from wallet
        const agreements = await wallet.resources.list({ type: 'Contract', identity: user.DID });

        // get dataSharingAgreement according to consumerPublicKey in agreement
        const dataSharingAgreement = agreements.find(res => res.resource.keyPair.publicJwk === consumerPublicKey).resource.dataSharingAgreement;

        // get consumerPrivateKey
        const consumerPrivateKey = JSON.parse(agreements.find(res => res.resource.keyPair.publicJwk === consumerPublicKey).resource.keyPair.privateJwk);

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
                res.json().then(async payObj => {
                    console.log(payObj);
                    if (payObj.name === 'OK') {
                        await getBlockData(wallet, user, consumerPrivateKey, consumerPublicKey, dataAccessEndpoint, dataSharingAgreement, agreementId);
                    } else {
                        const { transactionObject } = payObj;

                        const signTransaction = await wallet.identities.sign({ did: user.DID }, { type: 'Transaction', data: transactionObject });
                        console.log('Sign RawTransaction', signTransaction);

                        fetch('/api/dataTransfer/deployTransaction', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                agreementId,
                                dataAccessEndpoint,
                                signTransaction
                            })
                        }).then(res => {
                            res.json().then(async deployRes => {
                                console.log('Payment transaction deployed', deployRes);
                                await getBlockData(wallet, user, consumerPrivateKey, consumerPublicKey, dataAccessEndpoint, dataSharingAgreement, agreementId);
                            });
                        });
                    }
                });
            });
        } else {
            console.error(`Data Access Endpoint not found for Offering: ${offering.dataOfferingId}`);
            setShowTransfer(false);
        }
    }

    async function getBlockData(wallet, user, consumerPrivateKey, consumerPublicKey, dataAccessEndpoint, dataSharingAgreement, agreementId) {
        const offeringId = dataSharingAgreement.dataOfferingDescription.dataOfferingId;

        const dataSourceFiles = await getDataSourceFiles(offeringId, dataAccessEndpoint);

        if (dataSourceFiles) {
            let blockId = 'null';
            let blockAck = 'null';

            const filename = dataSourceFiles[0];

            const batch = await getBatchData(filename, agreementId, dataAccessEndpoint, blockId, blockAck);

            if (batch) {
                const dataExchangeAgreement = dataSharingAgreement.dataExchangeAgreement;
                const consumerDltAgent = new I3mWalletAgentDest(wallet, user.DID);
                const tolerance = 5000; // proof tolerance interval in ms

                let check_eof = true;

                let blockData = [];

                while (check_eof) {

                    let content = await getBatchData(filename, agreementId, dataAccessEndpoint, blockId, blockAck);

                    if (content.poo !== 'null') {
                        const poo = content.poo;

                        const npConsumer = new NonRepudiationProtocol.NonRepudiationDest(dataExchangeAgreement, consumerPrivateKey, consumerDltAgent);

                        await npConsumer.verifyPoO(poo, content.cipherBlock, { tolerance: tolerance });

                        // save PoO in wallet
                        await wallet.resources.create({
                            type: 'NonRepudiationProof',
                            resource: poo
                        });

                        const por = await npConsumer.generatePoR();

                        // save PoR in wallet
                        await wallet.resources.create({
                            type: 'NonRepudiationProof',
                            resource: por.jws
                        });

                        const res = await requestPop(dataAccessEndpoint, por);
                        if (res) {
                            await npConsumer.verifyPoP(res.pop, { tolerance: tolerance });

                            // save PoP in wallet
                            await wallet.resources.create({
                                type: 'NonRepudiationProof',
                                resource: res.pop
                            });

                            const decryptedBlock = await npConsumer.decrypt();
                            blockData = [...blockData, ...decryptedBlock];
                        }
                    }

                    blockId = content.nextBlockId;
                    blockAck = content.blockId;

                    if (content.nextBlockId === 'null' && blockAck === 'null') {
                        check_eof = false;

                        // save file
                        const uint8array = new Uint8Array(blockData);
                        const blob = new Blob([uint8array.buffer], { type:'application/x-7z-compressed' });
                        saveAs(blob, filename);

                        setShowMsg(false);
                        setShowTransfer(false);
                        setTransferMsg('');
                        console.log('File imported');
                    }
                }
            }
        }
        else {
            setShowMsg(true);
            setTransferMsg('Error: Data source files not found');
        }
    }

    async function getDataSourceFiles(offeringId, dataAccessEndpoint) {
        const res = await fetch('/api/dataTransfer/listDataSourceFiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                offeringId,
                dataAccessEndpoint
            }),
        });
        if (res.status === 200) {
            return await res.json();
        }
        else {
            setShowMsg(true);
            setTransferMsg('Error: ' + res.statusText);
        }
    }

    async function getBatchData(filename, agreementId, dataAccessEndpoint, blockId, blockAck) {
        const res = await fetch('/api/dataTransfer/batchData', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: filename,
                agreementId,
                dataAccessEndpoint,
                blockId,
                blockAck
            })
        });
        if (res.status === 200) {
            return await res.json();
        }
        else {
            setShowMsg(true);
            setTransferMsg('Error: ' + res.statusText);
        }
    }

    async function requestPop(dataAccessEndpoint, por) {
        const res = await fetch('/api/dataTransfer/requestPop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dataAccessEndpoint,
                por
            })
        });
        if (res.status === 200) {
            return await res.json();
        }
        else {
            setShowMsg(true);
            setTransferMsg('Error: ' + res.statusText);
        }
    }

    function showModal() {
        if (showTransfer) {
            return (
                <Modal show={showTransfer} onHide={() => setShowTransfer(false)}>
                    <Modal.Header closeButton>
                        Transfer Data
                    </Modal.Header>
                    <Modal.Body>
                        <div className="d-flex flex-column">
                            <div>Do you want to transfer the data ?</div>
                            { showMsg
                                ? <div className="my-2 text-danger">
                                    { transferMsg }
                                </div> : null
                            }
                        </div>
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
