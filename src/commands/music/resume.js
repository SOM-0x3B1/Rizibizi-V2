const { SlashCommandBuilder } = require('@discordjs/builders');
const { useMasterPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resumes playing'),
    async execute(interaction, client) {
        const player = useMasterPlayer();

        const queue = player.nodes.get(interaction.guildId);

        if(!queue || !queue.node.isPlaying())
            return await interaction.reply('There are no songs in the queue.');
        else if(!queue.node.isPaused())
            return await interaction.reply('The queue is not paused.');

        queue.node.setPaused(false)
        await interaction.reply(`:arrow_forward: Resumed **${queue.currentTrack.title}**.`);
    }
}