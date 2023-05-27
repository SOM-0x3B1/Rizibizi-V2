const { SlashCommandBuilder } = require('@discordjs/builders');
const { useMasterPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quit')
        .setDescription('Disconnects the bot and clears the queue!'),
    async execute(interaction, client) {
        const player = useMasterPlayer();

        const queue = player.nodes.get(interaction.guildId);

        if(!queue || !queue.node.isPlaying())
            return await interaction.reply('There are no songs in the queue.');

        queue.delete();
        await interaction.reply('Exiting...');
    }
}