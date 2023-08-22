const socket = io();

const list = document.getElementById('list');
const dropdown = document.getElementById('sDropdown');
const backButton = document.getElementById('back');

var dropdownLock = false;
var movedLiIndex;


function login() {
    const key = document.getElementById('key').value;
    if (key.length === 16)
        socket.emit('login', key);
    else
        document.getElementById('loginError').innerText = 'Invalid key length';
    document.getElementById('key').value = '';
}

function openPlaylist(id) {
    list.innerHTML = '';
    list.style.fontSize = '1.4vmin'
    backButton.style.display = 'block';
    document.getElementById('details').innerText = '';
    socket.emit('getSongs', id);
}

function back() {
    list.innerHTML = '';
    list.style.fontSize = getComputedStyle(document.documentElement).getPropertyValue('--font-size');
    backButton.style = 'none';
    document.getElementById('details').innerText = '';
    //dropdown.style.display = '';
    socket.emit('getPlaylists');   
}

function editSong(id, action) {
    list.innerHTML = '';
    socket.emit('editSong', id, action);
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

        li.onmouseenter = () => { document.getElementById('details').innerText = `NAME: ${playlist.pName} \nID: [${playlist.pID}] \nSERVER: ${playlist.gName} \nDESCRIPTION: ${playlist.pDesc}` };
        li.onclick = () => { openPlaylist(playlist.pID) };
    }
});

socket.on('sendSongs', async (data) => {
    if (data.success) {
        const songs = data.songs;

        let i = 1;
        for (const song of songs) {
            const li = document.createElement('li');
            li.innerText = `${i}. ${song.sTitle}`;
            li.className = 'song';
            li.style.padding = '1ex'
            list.appendChild(li);       
            
            let source;
            switch(song.type){
                case 'youtubeVideo':
                    source = 'https://youtu.be/';
                    break;
                case 'spotifySong':
                    source = 'https://open.spotify.com/track/';
                    break;
                case 'arbitrary':
                    source = '';
                    break;
            }

            const url = source + song.url;            
            await addMouseEvent(song, url, li, i);
            i++;
        }

        /*if (movedLiIndex) {
            list.getElementsByTagName('li')[movedLiIndex].appendChild(dropdown);  
            dropdown.style.display = 'block';
            movedLiIndex = null;
            console.log(dropdown);
        }*/
    }
});


async function addMouseEvent(song, url, li, i){
    li.onmouseenter = () => {
        if (!dropdownLock) {
            document.getElementById('details').innerText = `TITLE: ${song.sTitle}\nTYPE: ${song.type} \nURL: ${url}`;
            li.appendChild(dropdown);
            document.getElementById('sDelete').onclick = () => { editSong(song.sID, 'sDelete') };
            document.getElementById('sUp').onclick = () => { editSong(song.sID, 'sUp'); /*dropdownLock = true*/; movedLiIndex = i - 2; };
            document.getElementById('sDown').onclick = () => { editSong(song.sID, 'sDown'); /*dropdownLock = true*/; movedLiIndex = i; };
            //dropdown.style.display = '';
        }
        else
            dropdownLock = false;
    };
}