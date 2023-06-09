const { SlashCommandBuilder } = require('@discordjs/builders');
const { useMasterPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips the current song'),
    async execute(interaction, client) {
        const player = useMasterPlayer();
        const queue = player.nodes.get(interaction.guildId);

        if (!queue || !queue.currentTrack)
            return await interaction.reply(':warning: There are no songs in the queue.');

        const skippedName = queue.currentTrack.title;
        await queue.node.skip();
        await interaction.reply(`:track_next: Skipped **${skippedName}**.`);
    }
}