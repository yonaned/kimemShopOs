const tokenBlocklist = new Set();

export const addTokenToBlocklist = (token) => {
    tokenBlocklist.add(token);
};

export const isTokenBlocklisted = (token) => {
    return tokenBlocklist.has(token);
};