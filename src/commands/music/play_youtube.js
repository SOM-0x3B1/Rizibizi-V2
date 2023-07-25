const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
//const { QueryType } = require('discord-player');
const { useMainPlayer } = require('discord-player');
const { getThumb } = require('../../utility/getThumb.js');
const looper = require('./loop.js');
const { getQueue } = require('../../utility/getQueue.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play_youtube')
        .setDescription('Load music from YouTube')
        .addStringOption((option) => option.setName('query').setDescription('The query of the song').setRequired(true))
        .addStringOption(option =>
            option.setName('specify')
                .setDescription('The search engine you want to use')
                .addChoices(
                    { name: 'YouTube auto', value: 'youtube' },
                    { name: 'YouTube video URL', value: 'youtubeVideo' },
                    { name: 'YouTube playlist URL', value: 'youtubePlaylist' },
                    { name: 'YouTube search', value: 'youtubeSearch' },
                ))
        .addBooleanOption((option) => option.setName('loop').setDescription('Should I loop this song?'))
        .addBooleanOption((option) => option.setName('shuffle').setDescription('Should I shuffle this song?')),
    async execute(interaction, client) {
        const player = useMainPlayer()

        if (!interaction.member.voice.channel)
            return interaction.reply(':warning: You need to be in a VC to use this command.');

        const queue = await getQueue(player, interaction);

        if (!queue.connection)
            await queue.connect(interaction.member.voice.channel);

        let embed = new EmbedBuilder();

        const shouldLoop = interaction.options.getBoolean('loop');
        const shouldShuffle = interaction.options.getBoolean('shuffle');

        let type = interaction.options.getString('specify') ?? 'youtube'; // defaults to 'youtube', which is the auto option for

        let query = interaction.options.getString('query');
        if (type == 'youtubePlaylist' && !query.includes('playlist?'))
            query = 'https://www.youtube.com/playlist?list=' + query.split('=')[2].split('&')[0];

        const res = await player.search(query, {
            requestedBy: interaction.user,
            searchEngine: type
        });
        if (!res.hasTracks())
            return interaction.reply('No results.');


        if (!res.hasPlaylist()) {
            const song = res.tracks[0];
            await queue.addTrack(song);

            embed
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamics: true }) })
                .setDescription(`**[${song.title}](${song.url})** has been added to the queue.`)
                .setThumbnail(await getThumb(song.url, 'small'))
                .setFooter({ text: `${song.duration} - ${song.url}` })
        }
        else {
            const playlist = res.playlist;
            await queue.addTrack(playlist);
            embed
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamics: true }) })
                .setDescription(`**${res.tracks.length}** songs from **[${playlist.title}](${playlist.url})** has been added to the queue.`)
                .setThumbnail(await getThumb(res.tracks[0].url, 'small'))
                .setFooter({ text: `${playlist.durationFormatted} - ${playlist.url}` });

            if (shouldShuffle)
                queue.tracks.shuffle();
        }

        if (!queue.node.isPlaying())
            await queue.node.play();

        if (shouldLoop) {
            await looper.execute(interaction, client, res.hasPlaylist() ? 2 : 1);
            await interaction.followUp({ embeds: [embed] })
        }
        else
            try {
                await interaction.reply({ embeds: [embed] })
            }
            catch { }
    }
}