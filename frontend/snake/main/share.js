const share = {};

export const getShare = (k) => {
    return share[k];
};

export const setShare = (k, v) => {
    return (share[k] = v);
};
