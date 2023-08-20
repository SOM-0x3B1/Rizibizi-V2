const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
//const { QueryType } = require('discord-player');
const { useMainPlayer, QueryType } = require('discord-player');
const { getThumb } = require('../../utility/getThumb.js');
const looper = require('./loop.js');
const { getQueue } = require('../../utility/getQueue.js');
const { urlToType } = require('../../utility/playlist_utility.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Load music from an online source')
        .addStringOption((option) => option.setName('query').setDescription('The URL / query of the song').setRequired(true))
        .addStringOption(option =>
            option.setName('specify')
                .setDescription('The search engine you want to use')
                .addChoices(
                    { name: '! YouTube search', value: QueryType.YOUTUBE_SEARCH },
                    { name: '! Spotify search', value: QueryType.SPOTIFY_SEARCH },
                    { name: 'YouTube video URL', value: QueryType.YOUTUBE_VIDEO },
                    { name: 'YouTube playlist URL', value: QueryType.YOUTUBE_PLAYLIST },
                    { name: 'Spotify song URL', value: QueryType.SPOTIFY_SONG },
                    { name: 'Spotify album URL', value: QueryType.SPOTIFY_ALBUM },
                    { name: 'Spotify playlist URL', value: QueryType.SPOTIFY_PLAYLIST },
                    { name: 'Discord attachment', value: QueryType.ARBITRARY },
                ))
        .addBooleanOption((option) => option.setName('loop').setDescription('Should I loop this song / playlist?'))
        .addBooleanOption((option) => option.setName('shuffle').setDescription('Should I shuffle this playlist?')),
    async execute(interaction, client) {
        const player = useMainPlayer()

        if (!interaction.member.voice.channel)
            return interaction.reply(':warning: You need to be in a VC to use this command.');

        const queue = await getQueue(player, interaction);

        if (!queue.connection || interaction.member.voice.channel != queue.channel) {
            await queue.connect(interaction.member.voice.channel);
        }

        let embed = new EmbedBuilder();

        const shouldLoop = interaction.options.getBoolean('loop');
        const shouldShuffle = interaction.options.getBoolean('shuffle');


        let query = interaction.options.getString('query');
        let type = interaction.options.getString('specify');
        if (!type) {
            if (query.startsWith('https://youtu.be/') || query.startsWith('https://www.youtube.com/')) {
                if (query.includes('playlist?') || query.includes('&list=')) {
                    type = QueryType.YOUTUBE_PLAYLIST;
                    if (!query.includes('playlist?'))
                        query = 'https://www.youtube.com/playlist?list=' + query.split('=')[2].split('&')[0];
                }
                else
                    type = QueryType.YOUTUBE_VIDEO;
            }
            else if (query.includes('spotify.com/')) {
                if (query.includes('/track/'))
                    type = QueryType.SPOTIFY_SONG;
                else if (query.includes('/playlist/'))
                    type = QueryType.SPOTIFY_PLAYLIST;
                else if (query.includes('/album/'))
                    type = QueryType.SPOTIFY_ALBUM;
            }
            else if (query.startsWith('https://cdn.discordapp.com/attachments/')) {
                type = QueryType.ARBITRARY;
            }
            else
                type = QueryType.AUTO;
        }

        //== Play =================================================
        const res = await player.search(query, {
            requestedBy: interaction.user,
            searchEngine: type
        });
        if (!res.hasTracks())
            return interaction.reply('No results.');


        if (!res.hasPlaylist()) {
            const song = res.tracks[0];
            await queue.addTrack(song);

            if (type != QueryType.ARBITRARY) {
                embed
                    .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamics: true }) })
                    .setDescription(`**[${song.title}](${song.url})** has been added to the queue.`)
                    .setThumbnail(await getThumb(song.url, 'small'))
                    .setFooter({ text: `${song.duration} - ${song.url}` })
            }
            else {
                embed
                    .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamics: true }) })
                    .setDescription(`**[${song.title}](${song.url})** has been added to the queue.`)
                    .setFooter({ text: `${song.url}` })
            }
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
            try { await interaction.reply({ embeds: [embed] }) }
            catch { }
    }
}