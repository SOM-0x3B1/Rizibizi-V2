const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const { QueryType, useMainPlayer } = require('discord-player');
const { useMasterPlayer } = require('discord-player');
const { getThumb } = require('../utility/getThumb.js');
const looper = require('../commands/music/loop.js');
const { getQueue } = require('../utility/getQueue.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play_youtube_playlist')
        .setDescription('Load a playlist from a YouTube URL')
        .addStringOption((option) => option.setName('url').setDescription('The URL of the playlist').setRequired(true))
        .addBooleanOption((option) => option.setName('loop').setDescription('Should I loop this playlist?'))
        .addBooleanOption((option) => option.setName('shuffle').setDescription('Should I shuffle this playlist?')),
    async execute(interaction, client) {
        if (!interaction.member.voice.channel)
            return interaction.reply(':warning: You need to be in a VC to use this command.');

        const player = useMainPlayer();
        
        const queue = await getQueue(player, interaction);

        if (!queue.connection)
            await queue.connect(interaction.member.voice.channel);


        const shouldLoop = interaction.options.getBoolean('loop');
        const shouldShuffle = interaction.options.getBoolean('shuffle');

        let query = interaction.options.getString('url');
        if(!query.includes('playlist?'))
            query = 'https://www.youtube.com/playlist?list=' + query.split('=')[2].split('&')[0];

        const result = await player.search(query, {
            requestedBy: interaction.user,
            searchEngine: QueryType.YOUTUBE_PLAYLIST
        });
        if (!result.hasTracks())
            return interaction.reply('No results.');

        const playlist = result.playlist;
        await queue.addTrack(playlist);

        let embed = new EmbedBuilder()
            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamics: true }) })
            .setDescription(`**${result.tracks.length}** songs from **[${playlist.title}](${playlist.url})** has been added to the queue.`)
            .setThumbnail(await getThumb(result.tracks[0].url, 'small'))
            .setFooter({ text: `${playlist.durationFormatted} - ${playlist.url}` });

        if (shouldShuffle)
            queue.tracks.shuffle();

        if (!queue.node.isPlaying())
            await queue.node.play();

        if (shouldLoop) {
            await looper.execute(interaction, client, 2);
            await interaction.followUp({ embeds: [embed] })
        }
        else
            await interaction.reply({ embeds: [embed] })
    }
}