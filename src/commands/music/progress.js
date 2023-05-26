const { SlashCommandBuilder } = require('@discordjs/builders');
const { useMasterPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('progress')
        .setDescription('Shows a progressbar'),
    async execute(interaction, client) {
        const player = useMasterPlayer();

        const queue = player.nodes.get(interaction.guildId);

        if (!queue)
            return await interaction.reply('There are no songs in the queue!');

        const progressbar = queue.node.createProgressBar();
        await interaction.reply(progressbar);
    }
}