export const saveAuthTokenInSession = (token) => {
    window.localStorage.setItem('token', token);
}