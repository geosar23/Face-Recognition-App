// Face detection is handled client-side by @vladmandic/face-api (free, no API key needed).
// imageId for URL submissions is the URL string itself.
// imageId for file uploads is `filename_filesize`.

export const saveImageToLocalStorage = (imageId, userId) => {
    if (!imageId || !userId) return;
    const key = `${userId}_${imageId.slice(0, 30)}`;
    const history = JSON.parse(localStorage.getItem('imagesHistory')) || [];
    history.push(key);
    localStorage.setItem('imagesHistory', JSON.stringify(history));
};

export const checkIfImageHasBeenUploadedAlready = (imageId, userId) => {
    if (!imageId || !userId) return false;
    const key = `${userId}_${imageId.slice(0, 30)}`;
    const history = JSON.parse(localStorage.getItem('imagesHistory')) || [];
    return history.includes(key);
};