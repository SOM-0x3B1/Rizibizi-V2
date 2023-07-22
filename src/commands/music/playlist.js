const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const { useMainPlayer } = require('discord-player');
const { getThumb } = require('../../getThumb.js');
const { createCanvas, loadImage } = require('canvas')
const { drawStrokedText } = require('../../drawStrokedText.js');
const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');


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
                .addIntegerOption(option => option.setName('id').setDescription('The id of the new playlist').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Gives you a URL where you can edit your playlist'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('play')
                .setDescription('Gives you a URL where you can edit your playlist')
                .addStringOption((option) => option.setName('id').setDescription('The id of the playlist').setRequired(true))
                .addBooleanOption((option) => option.setName('loop').setDescription('Should I loop this playlist?'))
                .addBooleanOption((option) => option.setName('shuffle').setDescription('Should I shuffle this playlist?'))),
    async execute(interaction, client) {
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

                break;

            case 'edit':

                break;

            case 'play':

                break;
        }
    }
}