const { SlashCommandBuilder } = require('@discordjs/builders');
const { useMasterPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pauses the track'),
    async execute(interaction, client) {
        const player = useMasterPlayer();

        const queue = player.nodes.get(interaction.guildId);

        if(!queue || !queue.node.isPlaying())
            return await interaction.reply('There are no songs in the queue.');
        else if(queue.node.isPaused())
            return await interaction.reply('The queue is already paused.');

        queue.node.setPaused(true)
        await interaction.reply(`Paused **${queue.currentTrack.title}**.`);
    }
}