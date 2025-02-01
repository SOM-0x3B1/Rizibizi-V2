const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder } = require('discord.js');
const { useMainPlayer, QueryType } = require('discord-player');
const { getThumb } = require('../../utility/getThumb.js');
const { getQueue } = require('../../utility/getQueue.js');
const { urlToType } = require('../../utility/playlist_utility.js');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName(`Play`)
        .setType(ApplicationCommandType.Message),

    async execute(interaction) {
        let player = useMainPlayer();

        if (!interaction.member.voice.channel)
            return interaction.reply(':warning: You need to be in a VC to use this command.');

        let queue = await getQueue(player, interaction);

        if (!queue.connection) {
            await queue.connect(interaction.member.voice.channel);
        }
        else if (!interaction.member.voice.channel)
            return interaction.reply(':warning: You need to be in a VC to use this command.');
        else if (interaction.member.voice.channel.id != queue.channel.id)
            return interaction.reply(':warning: You need to be in the same VC as the bot to use this command.');


        let embed = new EmbedBuilder();


        let query = interaction.targetMessage.content;
        console.log(interaction.targetMessage);
        if(!query)
            return interaction.reply(':warning: Invalid target message.');

        let type;   
        if (query.startsWith('https://youtu.be/') || query.startsWith('https://www.youtube.com/') || query.startsWith('https://music.youtube.com/')) {
            if (query.includes('playlist?') || query.includes('&list=')) {
                console.log("Detected YouTube playlist URL");
                type = QueryType.YOUTUBE_PLAYLIST;
                if (!query.includes('playlist?'))
                    query = 'https://www.youtube.com/playlist?list=' + query.split('=')[2].split('&')[0];
            }
            else {
                console.log("Detected YouTube URL");
                type = QueryType.YOUTUBE_VIDEO;
            }
        }
        else if (query.startsWith('https://open.spotify.com/')) {
            console.log("Detected Spotify URL");
            if (query.includes('/track/'))
                type = QueryType.SPOTIFY_SONG;
            else if (query.includes('/playlist/'))
                type = QueryType.SPOTIFY_PLAYLIST;
            else if (query.includes('/album/'))
                type = QueryType.SPOTIFY_ALBUM;
        }
        else if (query.startsWith('https://cdn.discordapp.com/attachments/')) {
            console.log("Detected ARBITRARY");
            type = QueryType.ARBITRARY;
        }
        else {
            console.log("Detected AUTO");
            type = QueryType.AUTO;
        }


        console.log('Playing: ' + query);


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

            if (type != QueryType.ARBITRARY && urlToType(song.url) != QueryType.ARBITRARY) {
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
        }

        if (!queue.node.isPlaying())
            await queue.node.play();

        else
            try { await interaction.reply({ embeds: [embed] }) }
            catch { }
    }
}