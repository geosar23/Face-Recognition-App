export const capitalizeFirstLetter = (string) => {
    return string ? string[0]?.toUpperCase() + string.slice(1) : undefined;
}