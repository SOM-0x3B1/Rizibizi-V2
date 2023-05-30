const { SlashCommandBuilder } = require('@discordjs/builders');
const { useMasterPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('filter')
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
        const player = useMasterPlayer();
        const queue = player.nodes.get(interaction.guildId);

        if (!queue || !queue.currentTrack)
            return await interaction.reply(':warning: There are no songs in the queue.');

        const filter = interaction.options.getString('filter');

        await queue.filters.ffmpeg.toggle([filter]);
        await interaction.reply(`:gear: Toggled **${filter}** filter on the queue.`);
    }
}