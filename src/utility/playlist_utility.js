const newSongQuery = "INSERT INTO song(url,title,playlistID,type,position) VALUES (?, ?, ?, ?, ?)";

module.exports = {
    async addNewSongToDB(conn, title, url, pID, type, pos) {
        await conn.query(newSongQuery, [url, title, pID, type, pos]);
    },
    async shortenURL(url) {
        if (url.includes('youtu'))
            return url.split('=')[1];
        else
            return url;
    },
    async urlToType(url) {
        if (url.includes('youtu'))
            return 'youtubeVideo';
        else
            return 'idk'
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