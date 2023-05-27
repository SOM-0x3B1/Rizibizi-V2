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
                    { name: '8D', value: '8D' },
                )),
    async execute(interaction, client) {
        const player = useMasterPlayer();
        const queue = player.nodes.get(interaction.guildId);
        const filter = interaction.options.getString('filter');

        if (!queue || !queue.node.isPlaying())
            return await interaction.reply('There are no songs in the queue!');

        if (filter != '8D')
            await queue.filters.ffmpeg.toggle([filter]);
        else
            await queue.filters.filters.setFilters([filter]);

        await interaction.reply(`Toggled **${filter}** filter on the queue.`);
    }
}