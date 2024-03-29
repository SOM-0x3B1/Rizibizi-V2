const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const { useMainPlayer, QueryType } = require('discord-player');
const { getThumb } = require('../../utility/getThumb.js');
const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { dbPool, valueExists } = require('../../utility/db.js');
const { addNewSongToDB, shortenURL, urlToType, typeToSource } = require('../../utility/playlist_utility.js');
const { getQueue } = require('../../utility/getQueue.js');
const looper = require('./loop.js');;
const { createCanvas, loadImage } = require('canvas')
const { drawStrokedText } = require('../../utility/drawStrokedText.js');

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
        .setName('plist')
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
                /*.addStringOption(option => option.setName('id').setDescription('The global ID of your playlist').setRequired(true))*/)
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Gives you details about a playlist')
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
                .setDescription('Adds your playlist to the queue')
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
                const listType = interaction.options.getString('list_type') ?? listTypes.SERVER;
                let playlists = [];
                if (listType == listTypes.SERVER)
                    playlists = await conn.query("SELECT playlist.id, playlist.name, description, editor.name AS eName FROM playlist INNER JOIN editor ON editor.id = editorID WHERE guildID = ? ORDER BY playlist.name", [interaction.guildId]);
                else
                    playlists = await conn.query("SELECT playlist.id, playlist.name, description, editor.name AS eName FROM playlist INNER JOIN editor ON editor.id = editorID WHERE editorID = ? ORDER BY playlist.name", [interaction.user.id]);

                if (playlists.length == 0)
                    return await interaction.reply(`:warning: No playlists found.`);

                const totalPages = Math.ceil(playlists.length / 10);
                const pageIndex = (interaction.options.getInteger('page') ?? 1) - 1;
                if (pageIndex > totalPages - 1)
                    return await interaction.reply(`:warning: Invalid page. There are only a total of ${totalPages === 0 ? 1 : totalPages} pages in the list.`);

                let listString = '';
                for (let i = pageIndex * 10; i < pageIndex * 10 + 10 && i < playlists.length; i++) {
                    const playlist = playlists[i];
                    listString += `:page_with_curl: [${playlist.id}] **${playlist.name}**   >> ${await countOfSongsInPlaylist(conn, playlist.id)} tracks\n`;
                    if (playlist.description.length > 50)
                        listString += playlist.description.substring(0, 47) + '...';
                    else
                        listString += playlist.description;
                    listString += ` - ${playlist.eName}\n\n`;
                }

                const listEmbed = new EmbedBuilder();

                if (listType == listTypes.SERVER) {
                    listEmbed
                        .setTitle('The list of local playlists')
                        .setDescription(listString)
                        .setFooter({ text: `Page ${pageIndex + 1} of ${totalPages === 0 ? 1 : totalPages}` });
                    await interaction.reply({ embeds: [listEmbed] });
                }
                else {
                    listEmbed
                        .setTitle('The list of your playlists')
                        .setDescription(listString)
                        .setFooter({ text: `Page ${pageIndex + 1} of ${totalPages === 0 ? 1 : totalPages}` });
                    await interaction.reply({ embeds: [listEmbed], ephemeral: true });
                }
                break;

            case 'edit':
                const editor = await conn.query("SELECT editor.key as eKey FROM editor WHERE editor.name = ?", [interaction.user.username]);
                await interaction.reply({ content: `Your login key: **${editor[0].eKey}**\nEditor website: https://music.onekilobit.eu/`, ephemeral: true });
                break;

            case 'info':
                const infoID = interaction.options.getString('id');
                const infoPlaylists = await conn.query("SELECT playlist.name, description, editor.name as eName FROM playlist INNER JOIN editor ON editor.id = editorID WHERE playlist.id = ?", [infoID]);

                if (infoPlaylists.length != 1)
                    return await interaction.reply(`:warning: The playlist with global ID [**${infoID}**] does not exist.`);

                const infoPlaylistName = infoPlaylists[0].name;
                const infoSongs = await conn.query("SELECT url, title, type FROM song WHERE playlistID = ? ORDER BY position", [infoID]);

                if (infoSongs.length > 0) {
                    let infoString = `\n**Description**\n${infoPlaylists[0].description}\n\n**Tracks** (${infoSongs.length})\n`;
                    for (let i = 0; i < infoSongs.length; i++) {
                        const song = infoSongs[i];
                        const source = await typeToSource(song.type);
                        infoString += `**${i + 1}.** [${song.title}](${source + song.url})\n`;
                    }

                    const countOfListImages = infoSongs.length > 4 ? 4 : infoSongs.length;
                    const canvas = await createCanvas(120 * (countOfListImages), 90);
                    const ctx = await canvas.getContext('2d');
                    ctx.font = 'bold 18px Sans';
                    ctx.strokeStyle = 'rgba(0,0,0,255)';
                    ctx.fillStyle = 'rgba(255,255,255,255)';

                    for (let i = 0; i < countOfListImages; i++) {
                        const source = await typeToSource(infoSongs[i].type);
                        const listImage = await loadImage(await getThumb(source + infoSongs[i].url, 'small'));
                        await ctx.drawImage(listImage, 120 * (i), 0, 120, 90);
                        await drawStrokedText(ctx, `${i + 1}.`, 120 * (i) + 2, 20);
                    }

                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Playlist: ' + infoPlaylistName)
                                .setDescription(infoString)
                                .setImage('attachment://img.png')
                                .setFooter({ text: `Global ID:  ${infoID} \nEditor:        ${infoPlaylists[0].eName}` })
                        ],
                        files: [{
                            attachment: await canvas.toBuffer('image/png'),
                            name: 'img.png'
                        }]
                    });
                }
                else
                    await interaction.reply(`:warning: Playlist **${infoPlaylistName}** [${infoID}] is empty.`);
                break;

            case 'add':
                const addID = interaction.options.getString('id');
                const addPlaylists = await conn.query("SELECT name FROM playlist WHERE id = ?", [addID]);

                if (addPlaylists.length != 1)
                    return await interaction.reply(`:warning: The playlist with global ID [**${addID}**] does not exist.`);

                const addPlaylistName = addPlaylists[0].name;

                const addCountOSIPL = await countOfSongsInPlaylist(conn, addID);
                let startIndex = addCountOSIPL;

                const player = useMainPlayer();
                const queue = player.nodes.get(interaction.guildId);

                switch (interaction.options.getString('add_type')) {
                    case addTypes.CURRENT_SONG:
                        if (queue && queue.currentTrack) {
                            await addNewSongToDB(conn, queue.currentTrack.title, await shortenURL(queue.currentTrack.url), addID, await urlToType(queue.currentTrack.url), startIndex);
                            await interaction.reply(`:bookmark_tabs: Song **${queue.currentTrack.title}** added to **${addPlaylistName}** [${addID}].`);
                        }
                        else
                            return await interaction.reply(`:warning: There's no song currently playing.`);
                        break;

                    case addTypes.QUEUE:
                        if (queue && (queue.tracks.size > 0 || queue.currentTrack)) {
                            const currentSong = queue.currentTrack;
                            if (currentSong)
                                await addNewSongToDB(conn, queue.currentTrack.title, await shortenURL(currentSong.url), addID, await urlToType(currentSong.url), startIndex);

                            for (let i = 0; queue && i < queue.tracks.size; i++) {
                                let song = queue.tracks.data[i];
                                await addNewSongToDB(conn, song.title, await shortenURL(song.url), addID, await urlToType(song.url), startIndex + i);
                            }
                            await interaction.reply(`:bookmark_tabs: Queue added to **${addPlaylistName}** [${addID}].`);
                        }
                        else
                            return await interaction.reply(`:warning: The queue is emtpy.`);
                        break;

                    case addTypes.URL:
                        let url = interaction.options.getString('url_or_id');
                        let type;
                        if (url.startsWith('https://youtu.be/') || url.startsWith('https://www.youtube.com/') || url.startsWith('https://music.youtube.com/')) {
                            if (url.includes('playlist?') || url.includes('&list=')) {
                                type = QueryType.YOUTUBE_PLAYLIST;
                                if (!url.includes('playlist?'))
                                    url = 'https://www.youtube.com/playlist?list=' + url.split('=')[2].split('&')[0];
                            }
                            else
                                type = QueryType.YOUTUBE_VIDEO;
                        }
                        else if (url.startsWith('https://open.spotify.com/')) {
                            if (url.includes('/track/'))
                                type = QueryType.SPOTIFY_SONG;
                            else if (url.includes('/playlist/'))
                                type = QueryType.SPOTIFY_PLAYLIST;
                            else if (url.includes('/album/'))
                                type = QueryType.SPOTIFY_ALBUM;
                        }
                        else if (url.startsWith('https://cdn.discordapp.com/attachments/')) {
                            type = QueryType.ARBITRARY;
                        }
                        else 
                            return await interaction.reply(`:warning: Unrecognized URL; song has not been saved.\nReceived input: "${url}"`);


                        const searchedSongs = await player.search(url, {
                            requestedBy: interaction.user,
                            searchEngine: type
                        });

                        if (searchedSongs.hasTracks()) {
                            if (searchedSongs.hasPlaylist()) {
                                const playlist = searchedSongs.playlist;
                                for (let i = 0; i < searchedSongs.tracks.length; i++) {
                                    const song = searchedSongs.tracks[i];
                                    await addNewSongToDB(conn, song.title, await shortenURL(song.url), addID, await urlToType(url), startIndex + i);
                                }
                                await interaction.reply(`:bookmark_tabs: **${searchedSongs.tracks.length}** songs from **[${playlist.title}](${playlist.url})** added to **${addPlaylistName}** [${addID}].`);
                            }
                            else {
                                const song = searchedSongs.tracks[0];
                                await addNewSongToDB(conn, song.title, await shortenURL(song.url), addID, await urlToType(url), startIndex);
                                await interaction.reply(`:bookmark_tabs: Song **[${song.title}](${song.url})** added to **${addPlaylistName}** [${addID}].`);
                            }
                        }
                        else
                            return await interaction.reply(`:warning: Song not found.`);
                        break;

                    case addTypes.OTHER_PLAYLIST:
                        const addOtherPlaylisID = interaction.options.getString('url_or_id');
                        if (await valueExists(conn, 'song', 'playlistID', addOtherPlaylisID)) {
                            const addOtherSongs = await conn.query("SELECT url, title, type FROM song WHERE playlistID = ? ORDER BY position", [addOtherPlaylisID]);
                            if (addOtherSongs.length === 0)
                                return await interaction.reply(`:warning: Playlist [**${addOtherPlaylisID}**] is empty.`);

                            for (let i = 0; i < addOtherSongs.length; i++) {
                                const addSong = addOtherSongs[i];
                                await addNewSongToDB(conn, addSong.title, addSong.url, addID, addSong.type, startIndex + i);
                            }
                            await interaction.reply(`:bookmark_tabs: **${addOtherSongs.length}** songs added to **${addPlaylistName}** [${addID}] from [**${addOtherPlaylisID}**].`);
                        }
                        else
                            return await interaction.reply(`:warning: Invalid second playlist ID.`);
                        break;
                }
                break;

            case 'play':
                const playID = interaction.options.getString('id');
                const playPlaylists = await conn.query("SELECT name FROM playlist WHERE id = ?", [playID]);

                if (playPlaylists.length != 1)
                    return await interaction.reply(`:warning: The playlist with global ID [**${playID}**] does not exist.`);

                const playPlaylistName = playPlaylists[0].name;
                const songs = await conn.query("SELECT url, type FROM song WHERE playlistID = ? ORDER BY position", [playID]);

                if (songs.length > 0) {
                    const player = useMainPlayer();

                    const shouldLoop = interaction.options.getBoolean('loop');
                    const shouldShuffle = interaction.options.getBoolean('shuffle');

                    const queue = await getQueue(player, interaction);

                    if (!queue.connection)
                        await queue.connect(interaction.member.voice.channel);
                    else if (!interaction.member.voice.channel)
                        return interaction.reply(':warning: You need to be in a VC to use this command.');
                    else if (interaction.member.voice.channel.id != queue.channel.id)
                        return interaction.reply(':warning: You need to be in the same VC as the bot to use this command.');

                    await interaction.reply(`:arrow_down: Loading **${songs.length}** tracks from playlist **${playPlaylistName}** [${playID}].`);

                    let first = true;
                    let firstSource = '';
                    for (const song of songs) {
                        const source = await typeToSource(song.type);

                        const url = source + song.url;
                        const res = await player.search(url, {
                            requestedBy: interaction.user,
                            searchEngine: song.type
                        });
                        if (await res.hasTracks())
                            await queue.addTrack(res.tracks[0]);

                        if (first) {
                            await queue.node.play();
                            first = false;
                            firstSource = source;
                        }
                    }

                    if (shouldShuffle)
                        await queue.tracks.shuffle();

                    if (shouldLoop)
                        await queue.setRepeatMode('queue loop');

                    const embed = new EmbedBuilder()
                        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamics: true }) })
                        .setDescription(`**${songs.length}** songs from playlist **${playPlaylistName}** [${playID}] has been added to the queue.`)
                        .setThumbnail(await getThumb(firstSource + songs[0].url, 'small'));

                    await interaction.followUp({ embeds: [embed] });
                }
                else
                    await interaction.reply(`:warning: Playlist **${playPlaylistName}** [${playID}] is empty.`);
                break;
        }

        conn.end();
    }
}

async function countOfSongsInPlaylist(conn, pID) {
    const res = await conn.query("SELECT Count(*) as count FROM song WHERE playlistID = ?", [pID]);
    if (res.length > 0)
        return Number(res[0].count);
    else
        return 0;
}