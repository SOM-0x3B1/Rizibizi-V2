const { SlashCommandBuilder } = require('@discordjs/builders');
const { useMainPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quit')
        .setDescription('Disconnects the bot and clears the queue!'),
    async execute(interaction, client) {
        const player = useMainPlayer();
        const queue = player.nodes.get(interaction.guildId);

        if(!queue)
            return await interaction.reply(':warning: The player is already offline.');

        queue.delete();
        await interaction.reply(':wave: Disconnecting...');
    }
}