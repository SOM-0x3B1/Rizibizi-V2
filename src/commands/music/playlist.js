const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const { useMainPlayer } = require('discord-player');
const { getThumb } = require('../../utility/getThumb.js');
const { createCanvas, loadImage } = require('canvas')
const { drawStrokedText } = require('../../utility/drawStrokedText.js');
const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { dbPool, valueExists } = require('../../utility/db.js');


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
                            { name: 'server_playlists', value: 'server' },
                            { name: 'my_playlists', value: 'mine' },
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
                    option.setName('add_type').setDescription('What do you want to add to the playlist?').setRequired(true)
                        .addChoices(
                            { name: 'current_song', value: 'csong' },
                            { name: 'queue', value: 'queue' },
                            { name: 'url', value: 'url' },
                            { name: 'other_playlist', value: 'other_playlist' },
                        ).setRequired(true)))
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
                    return await interaction.reply(`:warning: The playlist with global ID ${delID} doesn't exists.`);
                if (result[0].editorID != interaction.user.id)
                    return await interaction.reply(`:warning: You are not the editor of the playlist called **${result[0].name}** [${delID}].`);

                await conn.query("DELETE FROM playlist WHERE id = ?", [delID]);
                await conn.query("DELETE FROM song WHERE playlistID = ?", [delID]);

                await interaction.reply(`:wastebasket: Playlist **${result[0].name}** [${delID}] deleted.`);
                break;

            case 'list':
                const listType = interaction.options.getString('listtype') ?? 'server';
                let playlists = [];
                if (listType == 'server')
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

                if (listType == 'server') {
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

                break;

            case 'play':

                break;
        }

        conn.end();
    }
}