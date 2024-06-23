import React, { useEffect, useState, useRef } from 'react'
import Navigation from './components/Navigation/navigation.js'
import FaceRecognition from './components/FaceRecognition/FaceRecognition.js'
import Logo from './components/Logo/logo.js'
import ImageInputForm from './components/ImageInputForm/ImageInputForm.js'
import Rank from './components/Rank/Rank.js'
import ParticlesBg from 'particles-bg'
import './App.css'
import SignIn from './components/Signin/SignIn.js';
import Register from './components/Register/Register'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { getServerKeys, filePredict, urlPredict, saveImageToLocalStorage, checkIfImageHasBeenUploadedAlready } from './helpers/clarifai.js';
import About from './components/About/About.js'

function App() {

    //PREDICT VIA URL METHOD
    const [imageUrl, setImageUrl] = useState("");

    //PREDICT VIA FILE METHOD
    const [filepath, setFilepath] = useState(null);

    //IMG SRC TO PROVIDE
    const [imageSrc, setImageSrc] = useState('');

    const [error, setError] = useState(null);
    const [boxes, setBoxes] = useState([]);
    const [route, setRoute] = useState('');
    const [signIn, setSignIn] = useState(false);
    const [user, setUser] = useState({
        id: "",
        name: "",
        email: "",
        password: "",
        entries: 0,
        score: 0,
        joined: null
    });
    const [loading, setLoading] = useState(false);


    const [pointsEarned, setPointsEarned] = useState(0);

    const ref = useRef(null);

    useEffect(() => {
        checkForToken().then((res) => {
            if (res) {
                getServerKeys();
            }
        })
    }, []);

    useEffect(() => {
        cleanState('all')
    }, [user.id])

    const checkForToken = async () => {
        const authorizationToken = window.localStorage.getItem('token');
        if (authorizationToken) {
            const response = await fetch('/signin', {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authorizationToken
                },
            });
            const res = await response.json();

            if (res.success) {
                loadUser(res.user);
                onRouteChange('home');
                return true;
            } else {
                onRouteChange('about');
                return false;
            }

        } else {
            onRouteChange('about');
        }
    };

    const handleLogout = () => {
        window.localStorage.removeItem('token');
    };

    const scrollToImage = () => {
        if (ref?.current) {
            ref.current?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const loadUser = (data) => {
        setUser({
            id: data.id,
            name: data.name,
            emai: data.email,
            password: data.password,
            entries: data.entries,
            score: data.score,
            joined: data.joined
        });
    }

    const calculateFaceLocation = (data) => {

        const facesArray = data.outputs[0]?.data?.regions;

        const numberOfFaces = data.outputs[0]?.data?.regions?.length || 0;

        if (!numberOfFaces) {
            toast.info("No faces recognized in the photo");
            return;
        }

        return facesArray.map((face, index) => {
            const clarifaiFace = face.region_info.bounding_box;
            const image = document.getElementById('inputImage')
            const width = Number(image.width)
            const height = Number(image.height)
            return {
                leftCol: clarifaiFace.left_col * width,
                topRow: clarifaiFace.top_row * height,
                rightCol: width - (clarifaiFace.right_col * width),
                bottomRow: height - (clarifaiFace.bottom_row * height)
            }
        })
    }

    const displayFaceBox = (boxes) => {
        setBoxes(boxes);
    }

    const onURLchange = event => {
        setImageUrl(event.target.value)
    };

    const onFileChange = event => {
        const filepath = event.target.files[0]

        if (filepath) {
            setFilepath(filepath);
        }
    }

    const convertFileToBase64 = (filepath) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(filepath);

            reader.onload = () => {
                resolve(reader.result)
            };

            reader.onerror = (error) => {
                console.error('Error converting file to Base64:', error);
                reject(error)
            };
        });
    };

    const onLinkSubmition = (event) => {
        cleanState("file")

        if (!imageUrl) {
            toast.warning("Please provide a url of an image");
            return;
        }

        setImageSrc(imageUrl)

        // app.models.predict(Clarifai.FACE_DETECT_MODEL,imageUrl)
        // app.models.predict('face-detection', imageUrl)
        setLoading(true);
        fetch("https://api.clarifai.com/v2/models/face-detection/outputs", urlPredict(imageUrl))
            .then(response => response.json())
            .then(response => {
                setLoading(false);
                if (response.status.code !== 10000) {
                    if (response.outputs) {
                        toast.error(`${response.outputs[0].status.description} \n ${response.outputs[0].status.details}`);
                        return;
                    } else {
                        toast.error(`${response.status.description} \n ${response.status.details}`);
                        return;
                    }
                }

                //Check for duplicate image uploads
                if (checkIfImageHasBeenUploadedAlready(response, user.id)) {
                    toast.warning("You cannot use the same image more than once");
                    return;
                }
                //Save image data to local storage
                saveImageToLocalStorage(response, user.id)

                //Score how many faces you found
                const facesRecognized = response?.outputs[0]?.data?.regions?.length || 0;

                if (facesRecognized) {
                    const authorizationToken = window.localStorage.getItem('token');
                    fetch('/user/score', {
                        method: 'put',
                        headers: { 'Content-Type': 'application/json', 'Authorization': authorizationToken },
                        body: JSON.stringify({
                            id: user.id,
                            score: facesRecognized
                        })
                    }).then(res => res.json())
                        .then((res) => {

                            if (!res.success || !res.score) {
                                toast.error("Error: Server was not able to log your score please try again");
                                return;
                            }

                            toast.success(`Success, you claimed ${facesRecognized} points !`);

                            setPointsEarned(facesRecognized);

                            setUser({
                                ...user,
                                score: res.score,
                            });

                        })

                    //Draw the boxes
                    displayFaceBox(calculateFaceLocation(response, false));
                    scrollToImage();
                }
            })
            .catch(error => {
                setLoading(false);
                toast.error(error?.message || "Error when trying to call the Clarifai API");
                setError(error.message);
                return;
            })
    }

    const onFileUpload = async (event) => {

        cleanState("url")

        if (!filepath) {
            toast.warning("Please upload an image");
            cleanState("url")
            return;
        }

        const base64String = await convertFileToBase64(filepath)
        setImageSrc(base64String)
        const base64Content = base64String.split(',')[1]; // Remove the data URI prefix

        setLoading(true);
        fetch("https://api.clarifai.com/v2/models/face-detection/outputs", filePredict(base64Content))
            .then(response => response.json())
            .then(response => {
                setLoading(false);

                if (response.status.code !== 10000) {
                    if (response.outputs[0]) {
                        toast.error(`${response.outputs[0].status.description} \n ${response.outputs[0].status.details}`);
                        return;
                    } else {
                        toast.error(`${response.status.description} \n ${response.status.details}`);
                        return;
                    }
                }

                //Check for duplicate image uploads
                if (checkIfImageHasBeenUploadedAlready(response, user.id)) {
                    toast.warning("You cannot use the same image more than once");
                    return;
                }
                //Save image data to local storage
                saveImageToLocalStorage(response, user.id);

                //Score how many faces you found
                const facesRecognized = response?.outputs[0]?.data?.regions?.length || 0;

                if (facesRecognized) {
                    const authorizationToken = window.localStorage.getItem('token');
                    fetch('/user/score', {
                        method: 'put',
                        headers: { 'Content-Type': 'application/json', 'Authorization': authorizationToken },
                        body: JSON.stringify({
                            id: user.id,
                            score: facesRecognized * 2
                        })
                    }).then(res => res.json())
                        .then((res) => {

                            if (!res.success || !res.score) {
                                toast.error("Error: Server was not able to log your score please try again");
                                return;
                            }

                            toast.success(`Success, you claimed ${facesRecognized * 2} points !`);

                            setPointsEarned(facesRecognized * 2);

                            setUser({
                                ...user,
                                score: res.score,
                            });

                            scrollToImage();

                        })

                    //Draw the boxes
                    displayFaceBox(calculateFaceLocation(response, true))
                }
            })
            .catch(error => {
                setLoading(false);
                toast.error(error?.message || "Error when trying to call the Clarifai API");
                setError(error.message);
                return;
            })
    }

    const cleanState = (mode) => {

        if (mode === 'all') {
            setPointsEarned(0)
            setImageUrl('');
            setImageSrc('');
            setFilepath(null);
            setBoxes([]);
            if (document.getElementById('formFile')?.value) {
                document.getElementById('formFile').value = "";
            }
            return;
        }

        if (mode === "file") {
            setFilepath(null);
            setBoxes([]);
            if (document.getElementById('formFile')?.value) {
                document.getElementById('formFile').value = "";
            }
            return;
        }

        if (mode === "url") {
            setImageUrl('')
            setBoxes([]);
            return;
        }

        if (mode === "boxes") {
            setBoxes([]);
            return;
        }
    }

    const onRouteChange = (route) => {

        cleanState('all');

        if (route === 'signout') {
            handleLogout();
            setSignIn(false);
        } else if (route === 'home') {
            setSignIn(true);
        }

        route = (route === 'signout') ? 'signin' : route;
        setRoute(route);
    }

    return (
        <div className="App">

            <div className="background-container">
                <ParticlesBg type="circle" bg={true} />
            </div>

            <ToastContainer theme="colored" />
            {route ? <Navigation onRouteChange={onRouteChange} route={route} signIn={signIn} user={user} /> : <div></div>}

            {route === 'home' ?
                <div>
                    <Logo />
                    <Rank user={user} pointsEarned={pointsEarned} />
                    <ImageInputForm
                        loading={loading}
                        imageUrl={imageUrl}
                        onURLchange={onURLchange}
                        onLinkSubmition={onLinkSubmition}
                        onFileChange={onFileChange}
                        onFileUpload={onFileUpload} />
                    <div ref={ref} className='mb-5'>
                        <FaceRecognition imageSrc={imageSrc} boxes={boxes} />
                    </div>
                </div>
                : (route === 'signin') ?
                    <SignIn loadUser={loadUser} onRouteChange={onRouteChange} />
                    : (route === 'register') ?
                        <Register loadUser={loadUser} onRouteChange={onRouteChange} />
                        : (route === 'about') ?
                            <About onRouteChange={onRouteChange} />
                            : <h1 className='loading'>Loading...</h1>
            }
        </div>
    );
}

export default App;
