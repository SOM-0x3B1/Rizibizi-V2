const { dbPool, valueExists } = require('../../db.js');
const { useMainPlayer } = require('discord-player');
const crypto = require('crypto');

const newSongQuery = "INSERT INTO song(url,playlistID,type,position) VALUES (?, ?, ?, ?)";

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.isChatInputCommand()) {
            const { commands } = client;
            const { commandName } = interaction;
            const command = commands.get(commandName);

            if (!command)
                return;

            try {
                await command.execute(interaction, client);
            } catch (err) {
                console.error(err);
                try {
                    await interaction.reply({
                        content: ':warning: Something went horribly wrong while executing this command... :warning:',
                        ephemeral: true
                    });
                } catch (err2) {
                    console.log('=================');
                    console.error(err2);
                }
            }
        }
        else if (interaction.isModalSubmit()) {
            const playlistName = interaction.fields.getTextInputValue('playlistName');
            const playlistDesc = interaction.fields.getTextInputValue('playlistDesc');

            const conn = await dbPool.getConnection();
            if (!await valueExists(conn, 'name', playlistName)) {
                const id = crypto.randomBytes(6).toString('hex');
                const editKey = crypto.randomBytes(8).toString('hex');
                const values = [id, editKey, playlistName, playlistDesc, interaction.user.id, interaction.guildId, interaction.user.username];
                await conn.query("INSERT INTO playlist(id,editKey,name,description,editorID,guildID,editorName) VALUES(?, ?, ?, ?, ?, ?, ?)", values);

                if (interaction.customId === 'queuePlaylistCreator') {
                    const player = useMainPlayer();
                    const queue = player.nodes.get(interaction.guildId);

                    const currentSong = queue.currentTrack;
                    await conn.query(newSongQuery, [currentSong.url, id, urlToType(currentSong.url), 0]);
                    for (let i = 0; i < queue.tracks.size; i++) {
                        let song = queue.tracks.data[i];
                        await conn.query(newSongQuery, [song.url, id, urlToType(song.url), i + 1]);
                    }
                }

                await interaction.reply(`:page_with_curl: Playlist named **${playlistName}** created successfully. \n Global playlist ID: **${id}**`);
            }
            else {
                await interaction.reply({
                    content: `:warning: A playlist named ${playlistName} already exists.`,
                    ephemeral: true
                });
            }
        }
    }
}

async function urlToType(url) {
    if (url.includes('youtube'))
        return 'youtubeVideo';
    else
        return 'idk'
}