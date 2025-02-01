require('dotenv').config();
const { token /*, ytToken*/ } = process.env;
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');
const { YoutubeiExtractor } = require("discord-player-youtubei");


const fs = require('fs');
const os = require('os');
const { createWebServer } = require('./webserver/server.js');

os.setPriority(os.constants.priority.PRIORITY_HIGH);



const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});
client.commands = new Collection();
client.commandArray = [];



const player = new Player(client, {
    ytdlOptions: {
        filter: 'audioonly',
        quality: "highestaudio",
        highWaterMark: 1 << 30,
        requestOptions: {
            headers: {
                cookie: "MY_YOUTUBE_COOKIE"
            }
        }
    }
});
player.extractors.loadMulti(DefaultExtractors);
player.extractors.register(YoutubeiExtractor, {
    streamOptions: {
        highWaterMark: 1 << 30
    }
});

player.events.on('error', (queue, error) => {
    // Emitted when the player queue encounters error
    console.log(`General player error event: ${error.message}`);
    console.log(error);
});

player.events.on('playerError', (queue, error) => {
    // Emitted when the audio player errors while streaming audio track
    console.log(`Player error event: ${error.message}`);
    console.log(error);
});



const functionFolders = fs.readdirSync('./src/functions');
for (const folder of functionFolders) {
    const functionFiles = fs
        .readdirSync(`./src/functions/${folder}`)
        .filter((file) => file.endsWith('.js'));

    for (const file of functionFiles)
        require(`./functions/${folder}/${file}`)(client);
}

client.handleEvents();
client.handleCommands();
client.login(token);

createWebServer();