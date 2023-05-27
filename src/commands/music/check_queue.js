const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const { useMasterPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('check_queue')
        .setDescription('Displays the current song queue')
        .addNumberOption((option) => option.setName("page").setDescription('Page number of queue').setMinValue(1)),
    async execute(interaction, client) {
        const player = useMasterPlayer();
        const queue = player.nodes.get(interaction.guildId);
        if (!queue || !queue.node.isPlaying())
            return await interaction.reply('There are no songs in the queue.');

        const totalPages = Math.ceil(queue.tracks.size / 10);

        const page = (interaction.options._hoistedOptions.length > 0 ? interaction.options.getNumber('page') : 1) - 1;

        if (page > totalPages)
            return await interaction.reply(`Invalid page! There are only a total of ${totalPages === 0 ? 1 : totalPages} pages of songs.`);

        /*console.log(queue.tracks);
    const queueString = queue.tracks.slice(page * 10, page * 10 + 10).map((song, i) => {
        return `**${page * 10 + i + 1}.** [${song.duration}] ${song.title} -- <@${song.requestedBy.id}>`;
    }).join('\n');*/

        let queueString = '';
        for (let i = page * 10; i < page * 10 + 10 && i < queue.tracks.size; i++) {
            let song = queue.tracks.data[i];
            queueString += `**${i + 1}.** [${song.duration}] ${song.title} -- <@${song.requestedBy.id}>\n`;
        }

        const currentSong = queue.currentTrack;

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Queue')
                    .setDescription(`**Currently Playing**\n` +
                        (currentSong ? `[${currentSong.duration}] ${currentSong.title} -- <@${currentSong.requestedBy.id}>` : 'none') + `\n\n**In queue**\n${queueString}`)
                    .setFooter({
                        text: `Page ${page + 1} of ${totalPages === 0 ? 1 : totalPages}`
                    })
            ]
        });
    }
}