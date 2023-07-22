const { SlashCommandBuilder } = require('@discordjs/builders');
const { useMainPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear_queue')
        .setDescription('Clears the queue.'),
    async execute(interaction, client) {
        const player = useMainPlayer();
        const queue = player.nodes.get(interaction.guildId);

        if(!queue || !queue.currentTrack)
            return await interaction.reply(':warning: There are no songs in the queue.');

        queue.clear();
        await interaction.reply(':cl: Queue cleared.');
    }
}