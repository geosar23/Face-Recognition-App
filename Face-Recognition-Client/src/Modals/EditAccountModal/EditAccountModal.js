import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { toast } from 'react-toastify';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function EditAccountModal({ show, onHide, onEdit, user }) {

    const [email, setEmail] = useState(user?.email);
    const [name, setName] = useState(user?.name);
    const [entries, setEntries] = useState(user.entries);
    const [score, setScore] = useState(user.score);
    const [joined, setJoined] = useState(new Date(user.joined));
    const [isLoading, setIsLoading] = useState(false);

    const capitalizeFirstLetter = (string) => {
        return string ? string[0]?.toUpperCase() + string.slice(1) : undefined;
    }

    const editUser = () => {
        setIsLoading(true);
        const authorizationToken = window.localStorage.getItem('token');
        fetch(`/user/${user.id}`, {
            method: 'put',
            headers: { 'Content-Type': 'application/json', 'Authorization': authorizationToken },
            body: JSON.stringify({
                name: name,
                email: email,
                joined: joined,
                score: score,
                entries: entries
            })
        }).then(res => res.json())
            .then((res) => {
                if(!res.success) {
                    toast.error(`${res.message || "Oups something went wrong"}`);
                    return;
                }
                onEdit(true);
                toast.success("Account edited succesfully");
            })
            .catch(error => {
                onEdit(true);
                toast.error(error?.message || "Server is unable to connect");
                return;
            }).finally(setIsLoading(false))
    };

    const onEmailChange = (event) => {
        setEmail(event.target.value);
    }

    const onNameChange = (event) => {
        setName(event.target.value);
    }

    const onJoinedChange = (event) => {
        setJoined(event);
    }

    const onEntriesChange = (event) => {
        setEntries(event.target.value);
    }

    const onScoreChange = (event) => {
        setScore(event.target.value);
    }

    const resetUserValues = () => {
        setEmail(user.email);
        setName(user.name);
        setJoined(new Date(user.joined));
        setScore(user.score);
        setEntries(user.entries);
    }

    return (
        <Modal show={show} size="lg" centered>
            <Modal.Header>
                <h3>{`Edit account ${capitalizeFirstLetter(user?.name)} !`}</h3>
            </Modal.Header>

            <Modal.Body>
                <div>
                    <div className="mb-3 row">
                        <label htmlFor="name" className="col-sm-2 col-form-label">Name</label>
                        <div className="col-sm-10">
                            <input aria-label="name edit input" type="text" className="form-control" id="name" value={name} onChange={onNameChange}></input>
                        </div>
                    </div>
                    <div className="mb-3 row">
                        <label htmlFor="email" className="col-sm-2 col-form-label">Email</label>
                        <div className="col-sm-10">
                            <input
                                aria-label="email edit input"
                                className="form-control"
                                type="email"
                                name="email"
                                id="email"
                                value={email}
                                onChange={onEmailChange}
                            />
                        </div>
                    </div>
                    <div className="mb-3 row">
                        <label htmlFor="joined" className="col-sm-2 col-form-label">Joining day</label>
                        <div className="col-sm-10">
                            <DatePicker className="form-control" selected={joined} onChange={(date) => onJoinedChange(date)} />
                        </div>
                    </div>
                    <div className="mb-3 row">
                        <label htmlFor="entries" className="col-sm-2 col-form-label">Entries</label>
                        <div className="col-sm-10">
                            <input
                                aria-label="entries edit input"
                                className="form-control"
                                type="number"
                                name="entries"
                                id="entries"
                                value={entries}
                                onChange={onEntriesChange}
                            />
                        </div>
                    </div>
                    <div className="mb-3 row">
                        <label htmlFor="score" className="col-sm-2 col-form-label">Score</label>
                        <div className="col-sm-10">
                            <input
                                aria-label="score edit input"
                                className="form-control"
                                type="number"
                                name="score"
                                id="score"
                                value={score}
                                onChange={onScoreChange}
                            />
                        </div>
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer>
                <Button className="btn-secondary" onClick={onHide}><i className="fa fa-xmark" aria-hidden="true"></i> Close</Button>
                <Button className="btn-warning" disabled={isLoading} onClick={resetUserValues}><i className="fa fa-refresh" aria-hidden="true"></i> Reset values</Button>
                <Button className="btn btn-success" disabled={isLoading} onClick={editUser}><i className="fa fa-save" aria-hidden="true"></i> Save</Button>
            </Modal.Footer>
        </Modal>
    );
}

export default EditAccountModal;
