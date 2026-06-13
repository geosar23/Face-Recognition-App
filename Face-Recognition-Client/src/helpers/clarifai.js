// Clarifai API calls are now proxied through the server to keep the PAT secret.
// The server endpoints /predict/url and /predict/file handle the Clarifai requests.

export const urlPredictOptions = (imageUrl) => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ imageUrl })
});

export const filePredictOptions = (imageBytes) => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ imageBytes })
});

export const saveImageToLocalStorage = (clarifaiResponse, userId) => {
    let string = getUniqueIdentifierFromClarifaiResponseData(clarifaiResponse);
    if (!string) return;
    string = userId + string.slice(0, 10);

    const imagesHistoryArray = JSON.parse(localStorage.getItem("imagesHistory")) || [];
    imagesHistoryArray.push(string);
    localStorage.setItem("imagesHistory", JSON.stringify(imagesHistoryArray));
};

export const checkIfImageHasBeenUploadedAlready = (clarifaiResponse, userId) => {
    let string = getUniqueIdentifierFromClarifaiResponseData(clarifaiResponse);
    if (!string) return false;
    string = userId + string.slice(0, 10);
    const imagesHistoryArray = JSON.parse(localStorage.getItem("imagesHistory")) || [];
    return imagesHistoryArray.includes(string);
};

const getUniqueIdentifierFromClarifaiResponseData = (clarifaiResponse) => {
    const imageData = clarifaiResponse?.outputs[0]?.data?.regions;
    if (!imageData || imageData.length === 0) return null;
    return imageData.map(i => i.id).join('');
};