import React from "react";
import Logo from "../Logo/logo.js";
import "./About.css"

function About({ onRouteChange }) {

    const onRegister = () => {
        onRouteChange('register')
    }

    return (
        <div className="w-90 m-auto">
            <Logo />
            <div className="shadow-lg p-3 bg-transparent rounded">
                <div>
                    <h1>Welcome to Face Recognition!</h1>
                    <p>
                        👋 Welcome to Face Recognition, my project inspired by the online course <a href="https://zerotomastery.io/courses/coding-bootcamp/" target="_blank" rel="noopener noreferrer">"The Complete Web Developer in 2020: Zero to Mastery"</a>.
                        I've taken the core concepts and significantly expanded the functionality over time.
                    </p>
                    <p>
                        <strong>Originally</strong>, the app used the <a href="https://www.clarifai.com/" target="_blank" rel="noopener noreferrer">Clarifai API</a> to detect faces server-side.
                        When Clarifai removed their free tier, making every API call require paid credits, the face detection engine was replaced entirely.
                    </p>
                    <p>
                        <strong>Today</strong>, face detection runs <strong>100% in your browser</strong> using <a href="https://github.com/vladmandic/face-api" target="_blank" rel="noopener noreferrer">face-api.js</a> — a TensorFlow.js-powered library.
                        No images are ever sent to a third-party server. The model (~190 KB) loads once from a CDN and is cached by your browser for instant subsequent use.
                    </p>
                    <p>
                        Earn <strong>1 point</strong> per face detected when submitting an image URL, or <strong>2 points</strong> per face when uploading a file directly.
                        The more faces, the more points — see how high you can go! 🚀
                    </p>
                    <p>Register your user and start earning points by providing a URL or uploading your own image file.</p>
                    <p>
                        <button className="btn btn-primary btn-lg" onClick={onRegister}>Get Started</button>
                    </p>
                </div>
            </div>
            <div className="row justify-content-center mt-4 m">
                <div className="col-sm-5 col-12 m-4 shadow p-3 bg-transparent rounded enlarge-on-hover">
                    <h2>
                        <a className="buttonLink" href="https://www.linkedin.com/in/georgesaramantis/" target="_blank" rel="noreferrer">
                            <i className="fa-brands fa-linkedin"></i> LinkedIn
                        </a>
                    </h2>
                </div>
                <div className="col-sm-5 col-12 m-4 shadow p-3 bg-transparent rounded enlarge-on-hover">
                    <h2>
                        <a className="buttonLink" href="https://github.com/geosar23" target="_blank" rel="noreferrer">
                            <i className="fa-brands fa-github"></i> Github
                        </a>
                    </h2>
                </div>
            </div>
        </div>

    )
}

export default About