import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { toast } from 'react-toastify';
import { capitalizeFirstLetter } from '../../helpers/general';

function DeleteAccountModal({show, onHide, onDelete, user, adminAccess}) {

    const deleteUser = () => {
        const authorizationToken = window.localStorage.getItem('token');
        fetch(`/user/${user.id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorizationToken
            }
        })
        .then(response => response.json())
        .then(data => {
            if(!data.success) {
                let msg = data.message || "Account cannot be deleted";
                toast.error(msg)
                return; 
            }
            onDelete(true);
            toast.success("Account deleted succesfully");
        })
        .catch(error => {
            onDelete(true);
            toast.error(error?.message || "Server is unable to connect");
            return;
        });
    };

    const confirmationText = adminAccess
    ? "Are you sure you want to delete the account?"
    : "Are you sure you want to delete your account?";
    const confirmationUnderText = adminAccess
    ? "All of their data will be gone forever..."
    : "All of your data will be gone forever...";

    return (
      <Modal show={show} size="lg" centered>
            <Modal.Header>
                <h3>
                    {`Delete account ${capitalizeFirstLetter(user?.name)} !`}
                </h3>
            </Modal.Header>

            <Modal.Body>
                <p>{confirmationText}</p>
                <small>{confirmationUnderText}</small>
            </Modal.Body>

            <Modal.Footer>
                <Button className="btn-secondary" onClick={onHide}><i className="fa fa-xmark" aria-hidden="true"></i> Close</Button>
                <Button className="btn btn-danger" onClick={deleteUser}><i className="fa fa-trash" aria-hidden="true"></i> Delete</Button>
            </Modal.Footer>

      </Modal>
    );
  }

export default DeleteAccountModal;