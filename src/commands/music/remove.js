const { SlashCommandBuilder } = require('@discordjs/builders');
const { useMasterPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Removes the last, or a selected song from the queue (/check_queue to see indexes)')
        .addNumberOption((option) => option.setName("index").setDescription('Index of the song (starting from 1). Default is the last added song.').setMinValue(1)),
    async execute(interaction, client) {
        const player = useMasterPlayer();
        const queue = player.nodes.get(interaction.guildId);

        if (!queue || !queue.currentTrack)
            return await interaction.reply(':warning: There are no songs in the queue.');

        const trackNumber = interaction.options.getNumber('index') ?? queue.tracks.size;
        if(trackNumber > queue.tracks.size)
            return await interaction.reply(':warning: Index out of range.');

        const removedName = queue.tracks.data[trackNumber - 1].title; 
        queue.removeTrack(trackNumber - 1); //index 0 is the currently playing song
        await interaction.reply(`:put_litter_in_its_place: Removed **${removedName}** at index ${trackNumber}.`);
    }
}