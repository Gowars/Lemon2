/**
 * @param {string} link
 * @param {'whatsapp'| 'facebook'| 'telegram'| 'twitter'} platform
 * @returns
 */
export function getSocialMediaShareLink(link = '', platform) {
    const url = encodeURIComponent(link);
    switch (platform) {
        case 'whatsapp':
            return `https://wa.me/?text=${url}`;
        case 'facebook':
            return `https://www.facebook.com/sharer/sharer.php?u=${url}&content=`;
        case 'telegram':
            return `https://telegram.me/share/url?text=&url=${url}`;
        case 'twitter':
            return `https://twitter.com/intent/tweet?text=&url=${url}`;
        default:
            return '';
    }
}
