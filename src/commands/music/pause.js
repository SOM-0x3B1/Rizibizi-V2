const { SlashCommandBuilder } = require('@discordjs/builders');
const { useMainPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pauses the track'),
    async execute(interaction, client) {
        const player = useMainPlayer();
        const queue = player.nodes.get(interaction.guildId);

        if (!queue || !queue.currentTrack)
            return await interaction.reply(':warning: There are no songs in the queue.');
        else if (queue.node.isPaused())
            return await interaction.reply(':warning: The queue is already paused.');

        if(!interaction.member.voice.channel)
            return interaction.reply(':warning: You need to be in a VC to use this command.');
        else if (interaction.member.voice.channel.id != queue.channel.id)
            return interaction.reply(':warning: You need to be in the same VC as the bot to use this command.');

        queue.node.setPaused(true)
        await interaction.reply(`:pause_button: Paused **${queue.currentTrack.title}**.`);
    }
}