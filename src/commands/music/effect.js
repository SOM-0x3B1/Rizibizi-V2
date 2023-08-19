const { SlashCommandBuilder } = require('@discordjs/builders');
const { useMainPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('effect')
        .setDescription('Toggles an audio filter')
        .addStringOption(option =>
            option.setName('filter')
                .setDescription('The filter you want to toggle')
                .setRequired(true)
                .addChoices(
                    { name: 'bass boost', value: 'bassboost' },
                    { name: 'nightcore', value: 'nightcore' },
                )),
    async execute(interaction, client) {
        const player = useMainPlayer();
        const queue = player.nodes.get(interaction.guildId);

        if (!queue)
            return await interaction.reply(':warning: Error.');

        const filter = interaction.options.getString('filter');

        await queue.filters.ffmpeg.toggle([filter]);
        await interaction.reply(`:fire: Toggled **${filter}** effect on the queue.`);
    }
}