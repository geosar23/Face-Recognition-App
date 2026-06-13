export const signOut = async () => {
    await fetch('/signout', { method: 'post', credentials: 'include' });
};