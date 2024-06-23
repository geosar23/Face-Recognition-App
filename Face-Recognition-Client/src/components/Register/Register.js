import React, { useState } from "react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Register.css'
import { getServerKeys } from '../../helpers/clarifai.js';
import { saveAuthTokenInSession } from "../../helpers/auth.js";

function Register({ loadUser, onRouteChange }) {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordVisibility, setPasswordVisibility] = useState(false);
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const onEmailChange = (event) => {
        setEmail(event.target.value);
    }

    const onPasswordChange = (event) => {
        setPassword(event.target.value);
    }

    const onNameChange = (event) => {
        setName(event.target.value);
    }

    const validateEmail = (email) => {
        // A simple email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    const visiblePasswordToggle = () => {
        const passwordInputHtmlElement = document.getElementById("passwordInput");
        if (passwordInputHtmlElement.type === "password") {
            passwordInputHtmlElement.type = "text";
            setPasswordVisibility(true);
        } else {
            passwordInputHtmlElement.type = "password"
            setPasswordVisibility(false);
        }
    }

    const validatePassword = (password) => {

        const MIN_LENGTH = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        // const hasSpecialChar = /[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]/.test(password);

        if (password.length < MIN_LENGTH) {
            toast.error("Password should be at least 8 characters long");
            return false;
        }

        if (!hasUpperCase) {
            toast.error("Password should have at least 1 upper case character");
            return false;
        }

        if (!hasLowerCase) {
            toast.error("Password should have at least 1 lower case character");
            return false;
        }

        if (!hasNumber) {
            toast.error("Password should be at least 1 number");
            return false;
        }

        return true;
    };

    const validateRegisterInput = () => {
        // Validate email
        if (!validateEmail(email)) {
            toast.error("Invalid email address");
            return false;
        }

        // Validate name (assuming at least 2 characters)
        if (name.length < 2) {
            toast.error("Name should be at least 2 characters long");
            return false;
        }

        // Validate password (assuming at least 6 characters)
        if (!validatePassword(password)) {
            return false;
        }

        return true;
    }

    const onRegister = () => {

        //Comment out for testing
        if (!validateRegisterInput()) {
            return;
        }

        setIsLoading(true);
        fetch('/register', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password,
                name: name
            })
        })
            .then(res => res.json())
            .then(async data => {
                setIsLoading(false);

                if (!data.success) {
                    let msg = data.message || "Error while trying to register, please try again";
                    toast.error(msg)
                    return;
                }
                saveAuthTokenInSession(data.token);
                loadUser(data.user);
                await getServerKeys();
                onRouteChange('home');
            })
            .catch(error => {
                setIsLoading(false);
                toast.error(error?.message || "Server is unable to connect");
                return;
            });
    }

    return (
        <div className="br3 ba b--black-10 mv4 mw6 shadow-5 center">
            <div className="m-4 w-100">
                <div>
                    <div id="register" className="ba b--transparent">
                        <h1>Create new account</h1>
                        <div className="mt-2">
                            <h4 htmlFor="name">Name</h4>
                            <input
                                aria-label="name input"
                                className="form-control center bg-transparent border border-dark w-75 font-weight-bold"
                                type="text"
                                name="name"
                                id="name"
                                onChange={onNameChange}
                            />
                        </div>
                        <div className="mt-2">
                            <h4 htmlFor="email-address">Email</h4>
                            <input
                                aria-label="email input"
                                className="form-control center bg-transparent border border-dark w-75"
                                type="email"
                                name="email-address"
                                id="email-address"
                                onChange={onEmailChange}
                            />
                        </div>
                        <div className="mt-2">
                            <h4 htmlFor="password">Password</h4>
                            <div className="d-flex align-items-center">

                                <input
                                    aria-label="password input"
                                    onChange={onPasswordChange}
                                    className="form-control center bg-transparent border border-dark w-75"
                                    type="password"
                                    name="password"
                                    id="passwordInput"
                                />
                                <div className="position-relative">
                                    {
                                        passwordVisibility ?
                                            <i className="fa-solid fa-eye" onClick={visiblePasswordToggle}></i> :
                                            <i className="fa-solid fa-eye-slash" onClick={visiblePasswordToggle}></i>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-3">
                        {isLoading ?
                            <button className="btn btn-outline-dark button-100" type="submit">
                                <span className="spinner-border spinner-border-sm pl-5 pr-5" role="status" aria-hidden="true"></span>
                            </button>
                            :
                            <button onClick={onRegister} className="btn btn-success" type="submit" disabled={isLoading}>
                                <span><i className="fa-solid fa-circle-user"></i> Create new account</span>
                            </button>
                        }
                    </div>
                    <div className="mt-3">
                        <p onClick={() => onRouteChange('signin')} href="#0" className="btn"><i className="fa-solid fa-arrow-right-to-bracket"></i> Sign in</p>
                    </div>
                </div>
            </div>
        </div>

    )
}

export default Register