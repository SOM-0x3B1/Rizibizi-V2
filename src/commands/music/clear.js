const { SlashCommandBuilder } = require('@discordjs/builders');
const { useMasterPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clears the queue.'),
    async execute(interaction, client) {
        const player = useMasterPlayer();

        const queue = player.nodes.get(interaction.guildId);

        if(!queue || !queue.node.isPlaying())
            return await interaction.reply('There are no songs in the queue.');

        queue.clear();
        await interaction.reply(':cl: Queue cleared.');
    }
}