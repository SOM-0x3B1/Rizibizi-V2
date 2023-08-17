const socket = io();

const list = document.getElementById('list');
const dropdown = document.getElementById('dropdown');
const backButton = document.getElementById('back');


function login() {
    const key = document.getElementById('key').value;
    if (key.length === 16)
        socket.emit('login', key);
    else
        document.getElementById('loginError').innerText = 'Invalid key length';
    document.getElementById('key').value = '';
}

function edit(id) {    
    list.innerHTML = '';
    list.style.fontSize = '9pt'
    backButton.style.display = 'block';
    socket.emit('getSongs', id);
}

function back() {    
    list.innerHTML = '';
    list.style.fontSize = getComputedStyle(document.documentElement).getPropertyValue('--font-size');
    backButton.style = 'none';
    socket.emit('getPlaylists');
}


socket.on('updateStats', (data) => {
    document.getElementById('botStatistics').innerText = `${data.servers} servers ${data.editors} editors ${data.playlists} playlists ${data.songs} songs`.toUpperCase();
});

socket.on('confirmLogin', (data) => {
    if (data.success) {
        document.getElementById('login').style.display = 'none';
        document.getElementById('detailsPanel').style.display = 'block';
        document.getElementById('editorName').innerText = data.eName;
    }
    else
        document.getElementById('loginError').innerText = data.message;
});

socket.on('sendPlaylists', (data) => {
    const playlists = data.pLists;

    let i = 1;
    for (const playlist of playlists) {
        const li = document.createElement('li');
        li.innerText = `${i}. ${playlist.pName}`;
        list.appendChild(li);
        i++;

        li.onmouseenter = () => { document.getElementById('details').innerText = `NAME: ${playlist.pName}\nSERVER: ${playlist.gName} \nDESCRIPTION: ${playlist.pDesc}` };
        li.onclick = () => { edit(playlist.pID) };
    }
});

socket.on('sendSongs', (data) => {
    if (data.success) {
        const songs = data.songs;

        let i = 1;
        for (const song of songs) {
            const li = document.createElement('li');
            li.innerText = `${i}. ${song.sTitle}`;
            li.className = 'song';
            li.style.padding = '1ex'
            list.appendChild(li);
            i++;

            const url = 'https://youtu.be/' + song.url;
            li.onmouseenter = () => {
                document.getElementById('details').innerText = `TITLE: ${song.sTitle}\nTYPE: ${song.type} \nURL: ${url}`;
                li.appendChild(dropdown);
            };
        }
    }
});