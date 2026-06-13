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
import * as faceapi from '@vladmandic/face-api';
import { saveImageToLocalStorage, checkIfImageHasBeenUploadedAlready } from './helpers/imageHistory.js';
import { signOut } from './helpers/auth.js';
import About from './components/About/About.js'

function App() {

    //PREDICT VIA URL METHOD
    const [imageUrl, setImageUrl] = useState("");

    //PREDICT VIA FILE METHOD
    const [filepath, setFilepath] = useState(null);

    //IMG SRC TO PROVIDE
    const [imageSrc, setImageSrc] = useState('');

    const [boxes, setBoxes] = useState([]);
    const [route, setRoute] = useState('');
    const [signIn, setSignIn] = useState(false);
    const [user, setUser] = useState({
        id: "",
        name: "",
        email: "",
        entries: 0,
        score: 0,
        joined: null
    });
    const [loading, setLoading] = useState(false);
    const [modelLoaded, setModelLoaded] = useState(false);


    const [pointsEarned, setPointsEarned] = useState(0);

    const ref = useRef(null);

    useEffect(() => {
        checkForToken(); // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        cleanState('all')
    }, [user.id])

    useEffect(() => {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
            .then(() => setModelLoaded(true))
            .catch(() => toast.error('Failed to load face detection model'));
    }, []);

    const checkForToken = async () => {
        // Cookie is sent automatically by the browser — no localStorage needed
        const response = await fetch('/signin', {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        const res = await response.json();

        if (res.success) {
            loadUser(res.user);
            onRouteChange('home');
        } else {
            onRouteChange('about');
        }
    };

    const handleLogout = async () => {
        await signOut();
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
            email: data.email,
            entries: data.entries,
            score: data.score,
            joined: data.joined
        });
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

    // Detect faces in an already-loaded HTMLImageElement.
    // Returns boxes scaled to the 500px display width used by FaceRecognition.
    const detectFaces = async (imgElement) => {
        const displayWidth = 500;
        const scaleX = displayWidth / imgElement.naturalWidth;
        const displayHeight = Math.round(imgElement.naturalHeight * scaleX);
        const detections = await faceapi.detectAllFaces(
            imgElement,
            new faceapi.TinyFaceDetectorOptions()
        );
        const resized = faceapi.resizeResults(detections, { width: displayWidth, height: displayHeight });
        return {
            count: resized.length,
            boxes: resized.map(det => ({
                leftCol: det.box.x,
                topRow: det.box.y,
                rightCol: displayWidth - (det.box.x + det.box.width),
                bottomRow: displayHeight - (det.box.y + det.box.height),
            }))
        };
    };

    const onLinkSubmition = async () => {
        cleanState('file');
        if (!imageUrl) {
            toast.warning('Please provide a URL of an image');
            return;
        }
        if (!modelLoaded) {
            toast.info('Face detection model is still loading, please wait a moment...');
            return;
        }
        if (checkIfImageHasBeenUploadedAlready(imageUrl, user.id)) {
            toast.warning('You cannot use the same image more than once');
            return;
        }

        setLoading(true);

        try {
            // Fetch the image through the server proxy so cross-origin images work
            const proxyRes = await fetch('/proxy/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ imageUrl })
            });

            if (!proxyRes.ok) {
                const err = await proxyRes.json().catch(() => ({}));
                setLoading(false);
                toast.error(err.message || 'Could not fetch the image. Check the URL and try again.');
                return;
            }

            const blob = await proxyRes.blob();
            const objectUrl = URL.createObjectURL(blob);
            setImageSrc(objectUrl);

            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = objectUrl;
            });

            const { count, boxes: detectedBoxes } = await detectFaces(img);
            setLoading(false);

            if (!count) {
                toast.info('No faces recognized in the photo');
                return;
            }

            saveImageToLocalStorage(imageUrl, user.id);

            fetch('/user/score', {
                method: 'put',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ id: user.id, score: count })
            })
                .then(res => res.json())
                .then(res => {
                    if (!res.success || !res.score) {
                        toast.error('Error: Server was not able to log your score, please try again');
                        return;
                    }
                    toast.success(`Success, you claimed ${count} point${count > 1 ? 's' : ''}!`);
                    setPointsEarned(count);
                    setUser({ ...user, score: res.score });
                });

            displayFaceBox(detectedBoxes);
            scrollToImage();
        } catch {
            setLoading(false);
            toast.error('Could not process the image. Please try a different URL.');
        }
    };

    const onFileUpload = async () => {
        cleanState('url');
        if (!filepath) {
            toast.warning('Please upload an image');
            return;
        }
        if (!modelLoaded) {
            toast.info('Face detection model is still loading, please wait a moment...');
            return;
        }

        const imageId = filepath.name + '_' + filepath.size;
        if (checkIfImageHasBeenUploadedAlready(imageId, user.id)) {
            toast.warning('You cannot use the same image more than once');
            return;
        }

        const objectUrl = URL.createObjectURL(filepath);
        setImageSrc(objectUrl);
        setLoading(true);

        try {
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = objectUrl;
            });

            const { count, boxes: detectedBoxes } = await detectFaces(img);
            setLoading(false);

            if (!count) {
                toast.info('No faces recognized in the photo');
                return;
            }

            saveImageToLocalStorage(imageId, user.id);

            fetch('/user/score', {
                method: 'put',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ id: user.id, score: count * 2 })
            })
                .then(res => res.json())
                .then(res => {
                    if (!res.success || !res.score) {
                        toast.error('Error: Server was not able to log your score, please try again');
                        return;
                    }
                    toast.success(`Success, you claimed ${count * 2} point${count * 2 > 1 ? 's' : ''}!`);
                    setPointsEarned(count * 2);
                    setUser({ ...user, score: res.score });
                });

            displayFaceBox(detectedBoxes);
            scrollToImage();
        } catch {
            setLoading(false);
            toast.error('Could not process the image file. Please try a different image.');
        }
    };

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
