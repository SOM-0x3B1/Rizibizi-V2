module.exports = {
    async getThumb(url, size) {
        if (url === null) {
            return '';
        }
        size = (size === null) ? 'big' : size;
        results = url.match('[\\?&]v=([^&#]*)');
        video = (results === null) ? url : results[1];

        return 'http://img.youtube.com/vi/' + video + '/0.jpg';
    }
}