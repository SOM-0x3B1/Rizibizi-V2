const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const { useMainPlayer } = require('discord-player');
const { getThumb } = require('../../utility/getThumb.js');
const { createCanvas, loadImage } = require('canvas')
const { drawStrokedText } = require('../../utility/drawStrokedText.js');
const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { dbPool, valueExists } = require('../../utility/db.js');
const { addNewSongToDB, shortenURL, urlToType, validateYouTubeUrl } = require('../../utility/playlist_utility.js');

const listTypes = {
    SERVER: 'server',
    MINE: 'mine',
}
const addTypes = {
    CURRENT_SONG: 'csong',
    QUEUE: 'queue',
    URL: 'url',
    OTHER_PLAYLIST: 'otherplaylist'
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playlist')
        .setDescription('Manage playlists')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Lets you create a new playlist')
                .addBooleanOption((option) => option.setName('from_queue').setDescription('Should I add the current queue to this playlist?')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Deletes a playlist')
                .addStringOption(option => option.setName('id').setDescription('The global ID of the new playlist').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Lists the playlists of this server')
                .addStringOption(option =>
                    option.setName('list_type')
                        .setDescription('Which list do you want to see')
                        .addChoices(
                            { name: 'server_playlists', value: listTypes.SERVER },
                            { name: 'my_playlists', value: listTypes.MINE },
                        ))
                .addIntegerOption((option) => option.setName("page").setDescription('Page number of playlist list').setMinValue(1)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Gives you a URL where you can edit your playlist')
                .addStringOption(option => option.setName('id').setDescription('The global ID of your playlist').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Adds song(s) to a playlist')
                .addStringOption(option => option.setName('id').setDescription('The global ID of the playlist').setRequired(true))
                .addStringOption(option =>
                    option.setName('add_type')
                        .setDescription('What do you want to add to the playlist?')
                        .addChoices(
                            { name: 'current_song', value: addTypes.CURRENT_SONG },
                            { name: 'queue', value: addTypes.QUEUE },
                            { name: 'url', value: addTypes.URL },
                            { name: 'other_playlist', value: addTypes.OTHER_PLAYLIST },
                        ).setRequired(true))
                .addStringOption(option => option.setName('url_or_id').setDescription('The URL or global ID of the song (if required)')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('play')
                .setDescription('Gives you a URL where you can edit your playlist')
                .addStringOption((option) => option.setName('id').setDescription('The id of the playlist').setRequired(true))
                .addBooleanOption((option) => option.setName('loop').setDescription('Should I loop this playlist?'))
                .addBooleanOption((option) => option.setName('shuffle').setDescription('Should I shuffle this playlist?'))),
    async execute(interaction, client) {
        const conn = await dbPool.getConnection();

        switch (interaction.options.getSubcommand()) {
            case 'create':
                const fromQueue = interaction.options.getBoolean('from_queue');

                const modal = new ModalBuilder()
                    .setCustomId(fromQueue ? 'queuePlaylistCreator' : 'emptyPlaylistCreator')
                    .setTitle('Create playlist' + (fromQueue ? ' from queue' : ''));
                // Create the text input components
                const playlistName = new TextInputBuilder()
                    .setCustomId('playlistName')
                    .setLabel("Name") // The label is the prompt the user sees for this input
                    .setStyle(TextInputStyle.Short) // Short means only a single line of text
                    .setMaxLength(45)
                    .setRequired(true);
                const playlistDesc = new TextInputBuilder()
                    .setCustomId('playlistDesc')
                    .setLabel("Description")
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(256)
                    .setRequired(false); // Paragraph means multiple lines of text.
                const firstActionRow = new ActionRowBuilder().addComponents(playlistName);
                const secondActionRow = new ActionRowBuilder().addComponents(playlistDesc);
                modal.addComponents(firstActionRow, secondActionRow);

                await interaction.showModal(modal);
                break;

            case 'delete':
                const delID = interaction.options.getString('id');
                const result = await conn.query("SELECT id, name, editorID FROM playlist WHERE id = ?", [delID]);

                if (result.length === 0)
                    return await interaction.reply(`:warning: The playlist with global ID ${delID} does not exist.`);
                if (result[0].editorID != interaction.user.id)
                    return await interaction.reply(`:warning: You are not the editor of the playlist called **${result[0].name}** [${delID}].`);

                await conn.query("DELETE FROM playlist WHERE id = ?", [delID]);
                await conn.query("DELETE FROM song WHERE playlistID = ?", [delID]);

                await interaction.reply(`:wastebasket: Playlist **${result[0].name}** [${delID}] deleted.`);
                break;

            case 'list':
                const listType = interaction.options.getString('listtype') ?? listTypes.SERVER;
                let playlists = [];
                if (listType == listTypes.SERVER)
                    playlists = await conn.query("SELECT id, name, description, editorName FROM playlist WHERE guildID = ? ORDER BY name", [interaction.guildId]);
                else
                    playlists = await conn.query("SELECT id, name, description, editorName FROM playlist WHERE editorID = ? ORDER BY name", [interaction.user.id]);

                if (playlists.length == 0)
                    return await interaction.reply(`:warning: This server has no playlists yet.`);

                const totalPages = Math.ceil(playlists.length / 10);
                const pageIndex = (interaction.options.getInteger('page') ?? 1) - 1;
                if (pageIndex > totalPages - 1)
                    return await interaction.reply(`:warning: Invalid page. There are only a total of ${totalPages === 0 ? 1 : totalPages} pages in the list.`);

                let listString = '';
                for (let i = pageIndex * 10; i < pageIndex * 10 + 10 && i < playlists.length; i++) {
                    let playlist = playlists[i];
                    listString += `:page_with_curl: [${playlist.id}] **${playlist.name}**\n`;
                    if (playlist.description.length > 50)
                        listString += playlist.description.substring(0, 47) + '...';
                    else
                        listString += playlist.description;
                    listString += ` *- ${playlist.editorName}*\n\n`;
                }

                const embed = new EmbedBuilder();

                if (listType == listTypes.SERVER) {
                    embed
                        .setTitle('The list of local playlists')
                        .setDescription(listString)
                        .setFooter({ text: `Page ${pageIndex + 1} of ${totalPages === 0 ? 1 : totalPages}` });
                    await interaction.reply({ embeds: [embed] });
                }
                else {
                    embed
                        .setTitle('The list of your playlists')
                        .setDescription(listString)
                        .setFooter({ text: `Page ${pageIndex + 1} of ${totalPages === 0 ? 1 : totalPages}` });
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                }
                break;

            case 'edit':

                break;

            case 'add':
                const addID = interaction.options.getString('id');

                if (!valueExists(conn, 'playlist', 'id', addID))
                    return await interaction.reply(`:warning: The playlist with global ID [**${addID}**] does not exist.`);

                const countOfSongInPlaylist = await conn.query("SELECT Count(*) as count FROM song WHERE playlistID = ?", [addID]);
                let startIndex = 0;
                if (countOfSongInPlaylist.length > 0)
                    startIndex = Number(countOfSongInPlaylist[0].count);

                const player = useMainPlayer();
                const queue = player.nodes.get(interaction.guildId);

                switch (interaction.options.getString('add_type')) {
                    case addTypes.CURRENT_SONG:
                        if (queue && queue.currentTrack) {
                            await addNewSongToDB(conn, await shortenURL(queue.currentTrack.url), addID, await urlToType(queue.currentTrack.url), startIndex);
                            await interaction.reply(`:bookmark_tabs: Song **${queue.currentTrack.title}** added to [**${addID}**].`);
                        }
                        else
                            return await interaction.reply(`:warning: There's no song currently playing.`);
                        break;

                    case addTypes.QUEUE:
                        if (queue && (queue.tracks.size > 0 || queue.currentTrack)) {
                            const currentSong = queue.currentTrack;
                            if (currentSong)
                                await addNewSongToDB(conn, await shortenURL(currentSong.url), addID, await urlToType(currentSong.url), startIndex);

                            for (let i = 0; queue && i < queue.tracks.size; i++) {
                                let song = queue.tracks.data[i];
                                await addNewSongToDB(conn, await shortenURL(song.url), addID, await urlToType(song.url), startIndex + i);
                            }
                            await interaction.reply(`:bookmark_tabs: Queue added to [**${addID}**].`);
                        }
                        else
                            return await interaction.reply(`:warning: The queue is emtpy.`);
                        break;

                    case addTypes.URL:
                        const url = interaction.options.getString('url_or_id');
                        const searchedSongs = await player.search(url, {
                            requestedBy: interaction.user,
                            searchEngine: await urlToType(url)
                        });

                        if (searchedSongs.hasTracks()) {
                            const song = searchedSongs.tracks[0];
                            await addNewSongToDB(conn, await shortenURL(url), addID, await urlToType(url), startIndex);
                            await interaction.reply(`:bookmark_tabs: Song **${song.title}** added to [**${addID}**].`);
                        }
                        else
                            return await interaction.reply(`:warning: Song not found.`);
                        break;

                    case addTypes.OTHER_PLAYLIST:
                        const addOtherPlaylisID = await shortenURL(interaction.options.getString('url_or_id'));
                        if (await valueExists(conn, 'song', 'playlistID', addOtherPlaylisID)) {
                            const addOtherSongs = await conn.query("SELECT url, type FROM song WHERE playlistID = ?", [addOtherPlaylisID]);
                            if (addOtherSongs.length === 0)
                                return await interaction.reply(`:warning: Playlist [**${addOtherPlaylisID}**] is empty.`);

                            for (let i = 0; i < addOtherSongs.length; i++) {
                                const addSong = addOtherSongs[i];
                                await addNewSongToDB(conn, addSong.url, addID, addSong.type, startIndex + i);
                            }
                            await interaction.reply(`:bookmark_tabs: **${addOtherSongs.length}** songs added to [**${addID}**] from [**${addOtherPlaylisID}**].`);
                        }
                        else
                            return await interaction.reply(`:warning: Invalid second playlist ID.`);
                        break;
                }
                break;

            case 'play':

                break;
        }

        conn.end();
    }
}