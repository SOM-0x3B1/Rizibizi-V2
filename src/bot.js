require('dotenv').config();
const { token } = process.env;
const { ytToken } = process.env;
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const { Player } = require('discord-player');
const { YoutubeiExtractor } = require('discord-player-youtubei');
const os = require('os');
const { createWebServer } = require('./webserver/server.js');

os.setPriority(os.constants.priority.PRIORITY_HIGH);

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] 
});
client.commands = new Collection();
client.commandArray = [];

const player = Player.singleton(client, {
    ytdlOptions: {
        filter: 'audioonly',
        quality: "highestaudio",
        highWaterMark: 1 << 25,
        requestOptions: {
            headers: {
                cookie: "MY_YOUTUBE_COOKIE"
            }
        }
    }
});

player.extractors.loadDefault();
player.extractors.register(YoutubeiExtractor, {
    authentication: ytToken
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