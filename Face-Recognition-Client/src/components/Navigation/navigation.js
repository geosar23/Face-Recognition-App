import React, { useState } from 'react'
import DeleteAccountModal from '../../Modals/DeleteAccountModal/DeleteAccountModal';
import AdminPanelModal from '../../Modals/AdminPanelModal/AdminPanelModal';
import './navigation.css'
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Offcanvas from 'react-bootstrap/Offcanvas';

const Navigation = ({ onRouteChange, signIn, user, route }) => {

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAdminPanelModal, setShowAdminPanelModal] = useState(false);
    const [offcanvasVisible, setOffcanvasVisible] = useState(false);

    const openConfirmationForDeleteAccountModal = () => {
        setShowDeleteModal(true)
    }

    const openAdminPanelModal = () => {
        setShowAdminPanelModal(true)
    }

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
    }

    const closeAdminPanelModal = () => {
        setShowAdminPanelModal(false);
    }

    const onDelete = (event) => {
        closeDeleteModal();
        if (event) {
            onRouteChange('signout');
        }
    };

    const handleNavSelections = (event) => {
        if (event) {
            onRouteChange(event);
        }
        setOffcanvasVisible(false);
    }

    return (
        <div>
            {showAdminPanelModal ? <AdminPanelModal show={showAdminPanelModal} onHide={closeAdminPanelModal} user={user} /> : ""}
            <DeleteAccountModal show={showDeleteModal} onHide={closeDeleteModal} user={user} onDelete={onDelete} />
            <Navbar key={false} expand={false} className="mb-3">
                <Container fluid>
                    <Navbar.Brand href="#"></Navbar.Brand>
                    <Navbar.Toggle onClick={() => setOffcanvasVisible(!offcanvasVisible)} />
                    <Navbar.Offcanvas placement="end" className="bg-dark" show={offcanvasVisible}  onHide={() => setOffcanvasVisible(false)} onExit={() => setOffcanvasVisible(false)} >
                        <Offcanvas.Header closeButton>
                        </Offcanvas.Header>
                        <Offcanvas.Body>

                            <Nav className="text-center">
                                {signIn ?
                                    <div>
                                        <Nav.Link><button onClick={() => handleNavSelections('home')} className='btn btn-primary m-2 w-75'><i className="fa-solid fa-house"></i> Home</button></Nav.Link>
                                        <button onClick={() => handleNavSelections('about')} className='btn btn-info m-2 w-75'><i className="fa-regular fa-lightbulb"></i> About</button>

                                        {user?.name === 'admin' ?
                                            <button onClick={openAdminPanelModal} className='btn btn-primary m-2 w-75'><i className="fa fa-gear" aria-hidden="true"></i> Admin panel</button>
                                            :
                                            <button onClick={openConfirmationForDeleteAccountModal} className='btn btn-danger m-2 w-75'><i className="fa fa-trash" aria-hidden="true"></i> Delete account</button>
                                        }

                                        <button onClick={() => handleNavSelections('signout')} className='btn btn-warning m-2 w-75'><i className="fa-solid fa-arrow-right-from-bracket"></i> Sign Out</button>
                                    </div>
                                    :
                                    <div>
                                        <button onClick={() => handleNavSelections('register')} className='btn btn-success m-2 w-75'><i className="fa-solid fa-circle-user"></i> Create new account</button>
                                        <button onClick={() => handleNavSelections('signin')} className='btn btn-primary m-2 w-75'><i className="fa-solid fa-arrow-right-to-bracket"></i> Sign In</button>
                                        <button onClick={() => handleNavSelections('about')} className='btn btn-info m-2 w-75'><i className="fa-regular fa-lightbulb"></i> About</button>
                                    </div>
                                }
                            </Nav>
                        </Offcanvas.Body>
                    </Navbar.Offcanvas>
                </Container>
            </Navbar>

        </div >
    )
}

export default Navigation;
