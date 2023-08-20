const { QueryType } = require('discord-player');

const newSongQuery = "INSERT INTO song(url,title,playlistID,type,position) VALUES (?, ?, ?, ?, ?)";

module.exports = {
    async addNewSongToDB(conn, title, url, pID, type, pos) {
        await conn.query(newSongQuery, [url, title, pID, type, pos]);
    },
    async shortenURL(url) {
        if (url.startsWith('https://www.youtube.com/watch?v='))
            return url.split('=')[1];
        else if (url.includes('spotify.com/'))
            return url.split('/')[4];
        else
            return url;
    },
    async urlToType(query) {
        if (query.startsWith('https://www.youtube.com/'))
            return QueryType.YOUTUBE_VIDEO;
        else if (query.includes('spotify.com/'))
            return QueryType.SPOTIFY_SONG;
        else if (query.startsWith('https://cdn.discordapp.com/attachments/'))
            return QueryType.ARBITRARY;
        else
            return QueryType.AUTO;
    },
    async typeToSource(type) {
        switch (type) {
            case QueryType.YOUTUBE_VIDEO:
                return 'https://www.youtube.com/watch?v=';
            case QueryType.SPOTIFY_SONG:
                return 'https://open.spotify.com/track/';
            case QueryType.ARBITRARY:
                return '';
        }
    },
    async validateYouTubeUrl(url) {
        if (url) {
            const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/);
            if (match && match[2].length == 11)
                return true;
            else
                return false;
        }
    }
}