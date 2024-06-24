import CryptoJS from 'crypto-js';

export const capitalizeFirstLetter = (string) => {
    return string ? string[0]?.toUpperCase() + string.slice(1) : undefined;
}

export const decrypt = (encryptedData, secretKey) => {
    const bytes  = CryptoJS.AES.decrypt(encryptedData, secretKey);
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    return decryptedData;
}