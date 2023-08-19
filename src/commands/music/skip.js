const { SlashCommandBuilder } = require('@discordjs/builders');
const { useMainPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips the current song')
        .addNumberOption((option) => option.setName('to_index').setDescription('Index of the song in the queue to skip to.').setMinValue(1)),
    async execute(interaction, client) {
        const player = useMainPlayer();
        const queue = player.nodes.get(interaction.guildId);

        if (!queue || !queue.currentTrack)
            return await interaction.reply(':warning: There are no songs in the queue.');

        const index = interaction.options.getNumber('to_index') ?? 1;
        if (index > 1) {
            let max = queue.tracks.size - 1;
            for (let i = 0; i < index - 1 && i < max; i++)
                await queue.removeTrack(0);
        }
        await queue.node.skip();

        if (queue.tracks.size > 0)
            await interaction.reply(`:track_next: Skipped to **${queue.tracks.data[0].title}**.`);
        else
            await interaction.reply(`:track_next: Skipped the last song.`);
    }
}