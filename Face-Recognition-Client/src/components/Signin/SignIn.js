import React, { useState } from "react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getServerKeys } from '../../helpers/clarifai';
import { saveAuthTokenInSession } from "../../helpers/auth";
import './SignIn.css'

function SignIn({ onRouteChange, loadUser }) {

    const [signInEmail, setSignInEmail] = useState("");
    const [signInPassword, setSignInPassword] = useState("");
    const [passwordVisibility, setPasswordVisibility] = useState(false);
    const [isLoading, setLoading] = useState(false);


    const onEmailChange = (event) => {
        setSignInEmail(event.target.value);
    }

    const onPasswordChange = (event) => {
        setSignInPassword(event.target.value);
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

    const onSubmitSignIn = () => {

        setLoading(true);
        fetch('/signin', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: signInEmail,
                password: signInPassword
            })
        })
            .then(res => res.json())
            .then(async data => {
                setLoading(false);

                if (!data.success) {
                    let msg = data.message || "Credentials are not correct";
                    toast.error(msg)
                    return;
                }
                saveAuthTokenInSession(data.token);
                loadUser(data.user);
                await getServerKeys();
                onRouteChange('home');
            })
            .catch(error => {
                setLoading(false);
                toast.error(error?.message || "Server is unable to connect");
                return;
            });
    }

    return (
        <div className="br3 ba b--black-10 mv4 mw6 shadow-5 center">
            <div className="m-4 w-100">
                <div id="sign_up" className="ba b--transparent">
                    <h1>Sign In</h1>
                    <div className="mt-2">
                        <h4 htmlFor="email-address">Email</h4>
                        <input
                            aria-label='email input'
                            onChange={onEmailChange}
                            className="form-control center bg-transparent border border-dark w-75"
                            type="email"
                            name="email-address"
                            id="email-address"
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
                        <button className="btn btn-success button-100" type="submit">
                            <span className="spinner-border spinner-border-sm pl-5 pr-5" role="status" aria-hidden="true"></span>
                        </button>
                    :
                        <button onClick={onSubmitSignIn} className="btn btn-success button-100" type="submit" disabled={isLoading}>
                            <span><i className="fa-solid fa-arrow-right-to-bracket"></i> Sign in</span>
                        </button>
                    }
                </div>
                <div className="mt-3">
                    <p onClick={() => onRouteChange('register')} href="#0" className="btn"><i className="fa-solid fa-circle-user"></i> Create new account</p>
                </div>
            </div>
        </div>

    )
}

export default SignIn