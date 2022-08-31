import { Accordion, Card, Col, Form, Row } from 'react-bootstrap';
import CustomToggle from '../../../../common/CustomToggle';

export default function PaymentOnSize(props) {
    const { paymentOnSizeName, hasSizePrice, description, dataSize, eventKey } = props;

    return (
        <Accordion>
            <Card className="mb-3">
                <CustomToggle eventKey={eventKey} className="bg-secondary text-white">
                    Payment on Size
                </CustomToggle>
                <Accordion.Collapse eventKey={eventKey}>
                    <Card.Body>
                        <Form.Group controlId={eventKey + 'paymentOnSizeName'}>
                            <Form.Label>Name</Form.Label>
                            <Form.Control type="text" placeholder="Name"
                                name={eventKey + 'paymentOnSizeName'} defaultValue={paymentOnSizeName} />
                        </Form.Group>

                        <Form.Group controlId={eventKey + 'description'}>
                            <Form.Label>Description</Form.Label>
                            <Form.Control as="textarea" rows={3} placeholder="Description"
                                name={eventKey + 'description'} defaultValue={description} />
                        </Form.Group>
                        <Row>
                            <Col>
                                <Form.Group controlId={eventKey + 'dataSize'}>
                                    <Form.Label>Data Size</Form.Label>
                                    <Form.Control type="text" placeholder="Data Size"
                                        name={eventKey + 'dataSize'} defaultValue={dataSize} />
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group controlId={eventKey + 'hasSizePrice'}>
                                    <Form.Label>Size Price</Form.Label>
                                    <Form.Control type="number" placeholder="Size Price" min={0}
                                        name={eventKey + 'hasSizePrice'} defaultValue={hasSizePrice} />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Accordion.Collapse>
            </Card>
        </Accordion>
    );
}
