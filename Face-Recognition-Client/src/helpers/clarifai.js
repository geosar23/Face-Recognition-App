import { toast } from 'react-toastify';
import { decrypt } from './general';

export let CLARIFAI_PAT = "";
export let CLARIFAI_USER_ID = "";
export let CLARIFAI_APP_ID = "";
export let CLARIFAI_MODEL_ID = "";
export let CLARIFAI_MODEL_VERSION_ID = "";

// Replace with your secure encryption key
const secretKey = process.env.REACT_APP_SECRET_KEY || "fallbackKey123";

export const getServerKeys = async () => {
    try {
        const authorizationToken = window.localStorage.getItem('token');
        const headers = {
            'Authorization': authorizationToken,
            'Content-Type': 'application/json',
        }
        const response = await fetch('/serverKeys', { headers });
        const res = await response.json();

        const decryptedData = decrypt(res.data, secretKey);

        // Populate variables
        CLARIFAI_PAT = decryptedData.CLARIFAI_PAT;
        CLARIFAI_USER_ID = decryptedData.CLARIFAI_USER_ID;
        CLARIFAI_APP_ID = decryptedData.CLARIFAI_APP_ID;
        CLARIFAI_MODEL_ID = decryptedData.CLARIFAI_MODEL_ID;
        CLARIFAI_MODEL_VERSION_ID = decryptedData.CLARIFAI_MODEL_VERSION_ID;

    } catch (error) {
        toast.error(`Error ${error.message || '404 Not found'}`);
        return;
    }
};

export const urlPredict = (imageUrl) => {

    // https://docs.clarifai.com/api-guide/predict/images
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // In this section, we set the user authentication, user and app ID, model details, and the URL
    // of the image we want as an input. Change these strings to run your own example.
    //////////////////////////////////////////////////////////////////////////////////////////////////

    // Your PAT (Personal Access Token) can be found in the portal under Authentification
    const PAT = CLARIFAI_PAT;

    // Specify the correct user_id/app_id pairings
    // Since you're making inferences outside your app's scope
    const USER_ID = CLARIFAI_USER_ID;
    const APP_ID = CLARIFAI_APP_ID;

    // Change these to whatever model and image URL you want to use
    // const MODEL_ID = CLARIFAI_MODEL_ID;
    // const MODEL_VERSION_ID = CLARIFAI_MODEL_VERSION_ID;   
    const IMAGE_URL = imageUrl;

    // NOTE: MODEL_VERSION_ID is optional, you can also call prediction with the MODEL_ID only
    // https://api.clarifai.com/v2/models/{YOUR_MODEL_ID}/outputs
    // this will default to the latest version_id
    // fetch("https://api.clarifai.com/v2/models/" + MODEL_ID + "/versions/" + MODEL_VERSION_ID + "/outputs", requestOptions)

    const raw = JSON.stringify({
        "user_app_id": {
            "user_id": USER_ID,
            "app_id": APP_ID
        },
        "inputs": [
            {
                "data": {
                    "image": {
                        "url": IMAGE_URL
                    }
                }
            }
        ]
    });

    const requestOptions = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Key ' + PAT
        },
        body: raw
    };

    return requestOptions;

}

export const filePredict = (image_bytes_string) => {
    // https://docs.clarifai.com/api-guide/predict/images
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // In this section, we set the user authentication, user and app ID, model details, and the URL
    // of the image we want as an input. Change these strings to run your own example.
    //////////////////////////////////////////////////////////////////////////////////////////////////

    // Your PAT (Personal Access Token) can be found in the portal under Authentification
    const PAT = CLARIFAI_PAT;

    // Specify the correct user_id/app_id pairings
    // Since you're making inferences outside your app's scope
    const USER_ID = CLARIFAI_USER_ID;
    const APP_ID = CLARIFAI_APP_ID;

    // Change these to whatever model and image URL you want to use
    // const MODEL_ID = CLARIFAI_MODEL_ID;
    // const MODEL_VERSION_ID = CLARIFAI_MODEL_VERSION_ID;   

    const IMAGE_BYTES_STRING = image_bytes_string;

    // NOTE: MODEL_VERSION_ID is optional, you can also call prediction with the MODEL_ID only
    // https://api.clarifai.com/v2/models/{YOUR_MODEL_ID}/outputs
    // this will default to the latest version_id
    // fetch("https://api.clarifai.com/v2/models/" + MODEL_ID + "/versions/" + MODEL_VERSION_ID + "/outputs", requestOptions)

    ///////////////////////////////////////////////////////////////////////////////////
    // YOU DO NOT NEED TO CHANGE ANYTHING BELOW THIS LINE TO RUN THIS EXAMPLE
    ///////////////////////////////////////////////////////////////////////////////////

    const raw = JSON.stringify({
        "user_app_id": {
            "user_id": USER_ID,
            "app_id": APP_ID
        },
        "inputs": [
            {
                "data": {
                    "image": {
                        "base64": IMAGE_BYTES_STRING
                    }
                }
            }
        ]
    });

    const requestOptions = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Key ' + PAT
        },
        body: raw
    };

    return requestOptions;
}

export const saveImageToLocalStorage = (clarifaiResponse, userId) => {
    let string = getUniqueIdentifierFromClarifaiResponseData(clarifaiResponse);
    string = userId + string.slice(0, 10);

    if(!string) {
        return;
    }

    console.log(string)

    const imagesHistoryArrayString = localStorage.getItem("imagesHistory");
    console.log(imagesHistoryArrayString)

    const imagesHistoryArray = JSON.parse(localStorage.getItem("imagesHistory")) || [];

    imagesHistoryArray.push(string);

    localStorage.setItem("imagesHistory",JSON.stringify(imagesHistoryArray));
}

export const checkIfImageHasBeenUploadedAlready = (clarifaiResponse, userId) => {
    let string = getUniqueIdentifierFromClarifaiResponseData(clarifaiResponse);
    string = userId + string.slice(0, 10);
    const imagesHistoryArray = JSON.parse(localStorage.getItem("imagesHistory")) || [];
    return imagesHistoryArray.includes(string);
}

const getUniqueIdentifierFromClarifaiResponseData = (clarifaiResponse) => {
    const imageData = clarifaiResponse?.outputs[0]?.data?.regions;
    if (imageData?.length === 0) {
        return null;
    }
    const imageUniqueArray = imageData.map(i => i.id);
    const imageUniqueString = imageUniqueArray.join('');
    return imageUniqueString;
}