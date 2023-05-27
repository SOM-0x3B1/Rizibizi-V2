const { SlashCommandBuilder } = require('@discordjs/builders');
const { useMasterPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Shuffles the queue'),
    async execute(interaction, client) {
        const player = useMasterPlayer();

        const queue = player.nodes.get(interaction.guildId);

        if(!queue || !queue.node.isPlaying)
            return await interaction.reply('There are no songs in the queue!');

        queue.tracks.shuffle();
        await interaction.reply(`The queue of **${queue.tracks.length}** songs have been shuffled.`);
    }
}