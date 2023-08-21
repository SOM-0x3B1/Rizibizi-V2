const https = require('https');
const { urlencoded } = require('express');
const express = require('express');
const bodyParser = require('body-parser')
const { join } = require('path');
const fs = require('fs');
const { dbPool, valueExists } = require('../utility/db.js');
const { Server } = require('socket.io');

const privateKey = fs.readFileSync('src/webserver/cert/onekilobit.eu-key.pem', 'utf8');
const certificate = fs.readFileSync('src/webserver/cert/onekilobit.eu-chain.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

const app = express();

let visits = 0;

app.disable('x-powered-by')

app.use(urlencoded({ extended: true, limit: '3mb' }));
//app.use(bodyParser.json());
app.use(express.static('/public/'));


app.get('/', (_, res) => {
    res.sendFile(join(__dirname, '/public/index.html'));
});

app.get('*', (req, res) => {
    const hasExtension = req.path.includes('.');
    const joinedPath = join(__dirname, '/public/', (hasExtension ? req.path : (req.path + '.html')));

    if (fs.existsSync(joinedPath))
        res.sendFile(joinedPath);
    else {
        res.writeHead(307, { 'Location': 'https://www.onekilobit.eu/404' });
        res.end();
    }
});



/*app.post('/login', async (req, res) => {
    if (req.body.key.length != 16)
        return res.json({ success: false, message: 'Invalid key length' });

    const conn = await dbPool.getConnection();
    const editors = await conn.query("SELECT id, name FROM editor WHERE editor.key = ?", [req.body.key]);
    if (editors.length > 0) {
        const editor = editors[0];
        const playlists = await conn.query("SELECT playlist.name, playlist.description, playlist.id, gu FROM playlist INNER JOIN guild ON playlist.guildID = guild.id WHERE editorID = ?", [editor.id]);
        res.json({ success: true, name: editor.name, pLists: playlists });
    }
    else
        res.json({ success: false, message: 'Invalid key' });
});*/



module.exports = {
    createWebServer() {
        const server = https.createServer(credentials, app)
        server.listen(4463, () => { });

        const io = new Server(server);

        const loginAttempts = {};

        io.on('connection', (socket) => {
            let authenticated = false;
            let editorID;
            const address = socket.handshake.address;

            sendStats(socket);
            const x = setInterval(() => {
                sendStats(socket);
            }, 5000);

            socket.on('disconnect', () => {
                clearInterval(x);
            })

            socket.on('login', async (key) => {
                if (key.length != 16)
                    return socket.emit('confirmLogin', { success: false, message: 'Invalid key length' });

                if (!loginAttempts[address])
                    loginAttempts[address] = 1;
                else if (loginAttempts[address] < 30)
                    loginAttempts[address]++;

                if (loginAttempts[address] < 6) {
                    const conn = await dbPool.getConnection();
                    const editors = await conn.query("SELECT id, name FROM editor WHERE editor.key = ?", [key]);
                    if (editors.length != 0) {
                        const editor = editors[0];
                        editorID = editor.id
                        authenticated = true;
                        socket.emit('confirmLogin', { success: true, eName: editor.name });
                        await sendPlaylists(conn, socket, editorID);
                    }
                    else
                        socket.emit('confirmLogin', { success: false, message: 'Invalid key' });
                    conn.end();
                }
                else
                    socket.emit('confirmLogin', { success: false, message: `Too many login attempts.\nYou've been locked out for ${(loginAttempts[address] - 5) * 2} minutes.` });
            })

            socket.on('getSongs', async (playlistID) => {
                if (authenticated) {
                    const conn = await dbPool.getConnection();
                    await sendSongs(conn, socket, editorID, playlistID);
                    conn.end();
                }
            });

            socket.on('getPlaylists', async () => {
                if (authenticated) {
                    const conn = await dbPool.getConnection();
                    await sendPlaylists(conn, socket, editorID);
                    conn.end();
                }
            });

            socket.on('editSong', async (songID, action) => {
                if (authenticated) {
                    const conn = await dbPool.getConnection();
                    const songs = await conn.query("SELECT song.id as sID, song.title as sTitle, url, type, song.playlistID, position FROM song INNER JOIN playlist ON playlist.id = song.playlistID WHERE playlist.editorID = ? AND song.id = ? ORDER BY position", [editorID, songID]);
                    if (songs.length > 0) {
                        const song = songs[0];
                        switch (action) {
                            case 'sDelete':
                                await conn.query("DELETE FROM song WHERE song.id = ?", [songID]);
                                const reposSongs = await conn.query("SELECT song.id FROM song WHERE song.playlistID = ? AND position > ? ORDER BY position", [song.playlistID, song.position]);
                                for (let i = 0; i < reposSongs.length; i++)
                                    await conn.query("UPDATE song SET position = ? WHERE song.id = ?", [song.position + i, reposSongs[i].id]);
                                break;

                            case 'sUp':
                                if (song.position > 0) {
                                    await conn.query("UPDATE song SET position = ? WHERE song.position = ? AND song.playlistID = ?", [song.position, song.position - 1, song.playlistID]);
                                    await conn.query("UPDATE song SET position = ? WHERE song.id = ?", [song.position - 1, songID]);
                                }
                                break;

                            case 'sDown':
                                const max = await conn.query("SELECT MAX(position) as max FROM song WHERE playlistID = ?", [song.playlistID]);
                                if (song.position < max[0].max) {
                                    await conn.query("UPDATE song SET position = ? WHERE song.position = ? AND song.playlistID = ?", [song.position, song.position + 1, song.playlistID]);
                                    await conn.query("UPDATE song SET position = ? WHERE song.id = ?", [song.position + 1, songID]);
                                }
                                break;
                        }
                        await sendSongs(conn, socket, editorID, song.playlistID);
                        sendStats(socket);
                    }
                    else
                        socket.emit('sendSongs', { success: false });
                    conn.end();
                }
            });
        });

        setInterval(() => {
            for (const key in loginAttempts) {
                loginAttempts[key]--;
                if (loginAttempts[key] == 0)
                    delete loginAttempts[key];
            }
        }, 120000);
    }
}

async function sendStats(socket) {
    const conn = await dbPool.getConnection();
    const g = await conn.query("SELECT Count(id) AS count FROM guild");
    const e = await conn.query("SELECT Count(id) AS count FROM editor");
    const p = await conn.query("SELECT Count(id) AS count FROM playlist");
    const s = await conn.query("SELECT Count(DISTINCT url) AS count FROM song");
    //console.log({ servers: g[0].count, editors: e[0].count, playlists: p[0].count, songs: s[0].count });
    socket.emit('updateStats', { servers: g[0].count, editors: e[0].count, playlists: p[0].count, songs: s[0].count });
    conn.end();
}

async function sendPlaylists(conn, socket, editorID) {
    const playlists = await conn.query("SELECT playlist.id as pID, playlist.name as pName, playlist.description as pDesc, guild.name as gName FROM playlist INNER JOIN guild ON playlist.guildID = guild.dcID WHERE playlist.editorID = ? ORDER BY playlist.name", [editorID]);
    socket.emit('sendPlaylists', { success: true, pLists: playlists });
}

async function sendSongs(conn, socket, editorID, playlistID) {
    const songs = await conn.query("SELECT song.id as sID, song.title as sTitle, url, type FROM song INNER JOIN playlist ON playlist.id = song.playlistID WHERE playlist.editorID = ? AND song.playlistID = ? ORDER BY position", [editorID, playlistID]);
    if (songs.length > 0)
        socket.emit('sendSongs', { success: true, songs: songs });
    else
        socket.emit('sendSongs', { success: false });
}