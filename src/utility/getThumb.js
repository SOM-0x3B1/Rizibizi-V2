module.exports = {
    async getThumb(url, size) {
        if (url === null)
            return '';

        if (url.includes('youtube.com/')) {
            size = (size === null) ? 'big' : size;
            results = url.match('[\\?&]v=([^&#]*)');
            video = (results === null) ? url : results[1];

            return 'http://img.youtube.com/vi/' + video + '/0.jpg';
        }
        else if (url.startsWith('https://open.spotify.com/')) {
            let newUrl = 'https://embed.spotify.com/oembed/?url=spotify:';

            if (url.includes('/track/'))
                newUrl += 'track:';
            else if (url.includes('/playlist/'))
                newUrl += 'playlist:';
            else if (url.includes('/album/'))
                newUrl += 'album:';

            newUrl += url.split('/')[4];

            const response = await fetch(newUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
            });

            try {
                const json = await response.json();
                return json.thumbnail_url;
            }
            catch {
                return 'https://music.onekilobit.eu/media/missing_file.png';
            }
        }
        else {
            return 'https://music.onekilobit.eu/media/discord.png';
        }
    }
}