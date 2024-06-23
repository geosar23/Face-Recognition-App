import React, { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import moment from 'moment';
import './AdminPanelModal.css'
import DeleteAccountModal from '../DeleteAccountModal/DeleteAccountModal';
import EditAccountModal from '../EditAccountModal/EditAccountModal';

function AdminPanelModal({ show, onHide }) {

    const [userData, setUserData] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        getUserData();
    }, []);

    const getUserData = () => {
        const authorizationToken = window.localStorage.getItem('token');
        fetch('/users', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorizationToken
            }
        })
            .then((response) => response.json())
            .then((data) => {
                setUserData(data)
            })
            .catch((error) => console.error('Error fetching user data:', error));
    }


    const openConfirmationForDeleteAccountModal = (user) => {
        setSelectedUser(user)
        setShowDeleteModal(true)
    }

    const openEditUserModal = (user) => {
        setSelectedUser(user)
        setShowEditModal(true)
    }

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
    }

    const closeEditModal = () => {
        setShowEditModal(false);
    }

    const onDelete = () => {
        closeDeleteModal();
        getUserData();
    }

    const onEdit = () => {
        closeEditModal();
        getUserData();
    }

    return (
        <Modal dialogClassName='dark-modal' show={show} size="fullscreen" centered onHide={onHide}>
            <Modal.Header closeButton>
                <h3>Admin panel <i className="fa fa-gear" aria-hidden="true"></i></h3>
            </Modal.Header>

            <Modal.Body>
                {showDeleteModal ? <DeleteAccountModal show={showDeleteModal} onHide={closeDeleteModal} user={selectedUser} adminAccess={true} onDelete={onDelete} /> : ""}
                {showEditModal ? <EditAccountModal show={showEditModal} onHide={closeEditModal} user={selectedUser} adminAccess={true} onEdit={onEdit} /> : ""}
                <div className="sectionContainer">
                    <div className="flex">
                        <h4>Users Management</h4>
                        <span className="pointer" data-bs-toggle="tooltip" data-bs-placement="top" title="Reload users" onClick={() => getUserData()} >
                            <i className="text-warning fa fa-refresh p-2" aria-hidden="true"></i>
                        </span>
                    </div>
                    <div className="container mt-4">
                        {userData.map((user) => (
                            <div key={user.id} className="card mb-4">
                                <div className="card-header font-weight-bold">
                                    ID: {user.id}
                                </div>
                                <div className="card-body custom-card">
                                    <div className="row">
                                        <div className="col-md-4">
                                            <div className="mb-2">
                                                <strong>Name:</strong> {user.name}
                                            </div>
                                            <div className="mb-2">
                                                <strong>Email:</strong> {user.email}
                                            </div>
                                            <div className="mb-2">
                                                <strong>Password:</strong> {user.password}
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="mb-2">
                                                <strong>Entries:</strong> {user.entries}
                                            </div>
                                            <div className="mb-2">
                                                <strong>Score:</strong> {user.score}
                                            </div>
                                            <div className="mb-2">
                                                <strong>Joined:</strong> {moment(user.joined).format()}
                                            </div>
                                        </div>
                                        <div className="col-md-4 align-self-center">
                                            
                                            {user.name !== 'admin' && (
                                                <div className="actions-container">
                                                    <button className="m-2 btn btn-sm btn-primary" onClick={() => openEditUserModal(user)}>
                                                        <i className="fa fa-user-pen" aria-hidden="true"></i> Edit user
                                                    </button>
                                                    <button className="m-2 btn btn-sm btn-warning ml-2">
                                                        <i className="fa fa-key" aria-hidden="true"></i> Reset password
                                                    </button>
                                                    <button className="m-2 btn btn-sm btn-danger ml-2" onClick={() => openConfirmationForDeleteAccountModal(user)}>
                                                        <i className="fa fa-trash" aria-hidden="true"></i> Delete user
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer>
                <Button className="btn btn-secondary" onClick={onHide}>
                    <i className="fa fa-xmark" aria-hidden="true"></i> Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default AdminPanelModal;
