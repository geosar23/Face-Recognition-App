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
                        👋 Welcome to Face Recognition, my exciting project inspired by the renowned online course <a href="https://zerotomastery.io/courses/coding-bootcamp/" target="_blank" rel="noopener noreferrer" title="https://zerotomastery.io/courses/coding-bootcamp/">"The Complete Web Developer in 2024: Zero to Mastery"</a>.
                        I've taken the core concepts and expanded the functionality, creating an interactive space for you to explore and have fun.
                        In this unique experience, we leverage the power of the <a href="https://www.clarifai.com/" target="_blank" rel="noopener noreferrer" title="https://www.clarifai.com/">CLARIFAI API</a> for face recognition. To get started, simply register as a user, and then dive into the world of points and face detection!
                        Earn 1 point for each face detected when you provide a URL to an image. Take it up a notch by uploading your own image file, and score 2 points for every face recognized.
                        The more faces, the more points—challenge yourself and see how high you can go!
                        Ready to embark on this facial recognition journey?
                        Sign up, upload, and watch your points stack up as you explore the fascinating capabilities of this innovative technology. Let the face recognition adventure begin! 🚀</p>
                    <p>Register your user and start earning points by providing a URL or uploading your own image file.</p>
                    <p>
                        <button className="btn btn-primary btn-lg" onClick={onRegister}>Get Started</button>
                    </p>
                </div>
            </div>
            <div className="row justify-content-center mt-4 m">
                <div className="col-sm-5 col-12 m-4 shadow p-3 bg-transparent rounded enlarge-on-hover">
                    <h2>
                        <a className="buttonLink" href="https://www.linkedin.com/in/georgesaramantis/" target="_blank">
                            <i className="fa-brands fa-linkedin"></i> LinkedIn
                        </a>
                    </h2>
                </div>
                <div className="col-sm-5 col-12 m-4 shadow p-3 bg-transparent rounded enlarge-on-hover">
                    <h2>
                        <a className="buttonLink" href="https://github.com/geosar23" target="_blank">
                            <i className="fa-brands fa-github"></i> Github
                        </a>
                    </h2>
                </div>
            </div>
        </div>

    )
}

export default About