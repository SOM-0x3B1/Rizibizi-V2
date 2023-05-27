const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const { QueryType } = require('discord-player');
const { useMasterPlayer } = require('discord-player');
const { getThumb } = require('../../getThumb.js');

const looper = require('./loop.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Load music from YouTube')
        .addStringOption((option) => option.setName('query').setDescription('The query of the song').setRequired(true))
        .addNumberOption(option =>
            option.setName('specify')
                .setDescription('The search engine you want to use')
                .addChoices(
                    { name: 'YouTube auto', value: 0 },
                    { name: 'YouTube video URL', value: 1 },
                    { name: 'YouTube playlist URL', value: 2 },
                    { name: 'YouTube search', value: 3 },
                ))
        .addBooleanOption((option) => option.setName('loop').setDescription('Should I loop this song?'))
        .addBooleanOption((option) => option.setName('shuffle').setDescription('Should I shuffle this song?')),
    async execute(interaction, client) {
        const player = useMasterPlayer()

        if (!interaction.member.voice.channel)
            return interaction.reply('You need to be in a VC to use this command');

        let queue = player.nodes.get(interaction.guildId);
        if (!queue) {
            queue = await player.nodes.create(interaction.guild, {
                metadata: {
                    channel: interaction.channel,
                    client: interaction.guild.members.me,
                    requestedBy: interaction.user,
                },
                selfDeaf: false,
                volume: 20,
                leaveOnEmpty: true,
                leaveOnEmptyCooldown: 300000,
                leaveOnEnd: true,
                leaveOnEndCooldown: 300000,
            });
        }

        if (!queue.connection)
            await queue.connect(interaction.member.voice.channel);

        let embed = new EmbedBuilder();

        const shouldLoop = interaction.options.getBoolean('loop');
        const shouldShuffle = interaction.options.getBoolean('shuffle');

        let type = QueryType.YOUTUBE;
        let typeNumber = interaction.options.getNumber('specify');
        if (typeNumber)
            type = [QueryType.YOUTUBE, QueryType.YOUTUBE_VIDEO, QueryType.YOUTUBE_PLAYLIST, QueryType.YOUTUBE_SEARCH][typeNumber];

        const query = interaction.options.getString('query');
        const result = await player.search(query, {
            requestedBy: interaction.user,
            searchEngine: type
        });
        if (!result.hasTracks())
            return interaction.reply('No results!');


        if (!result.hasPlaylist()) {
            const song = result.tracks[0];
            await queue.addTrack(song);

            embed
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamics: true }) })
                .setDescription(`**[${song.title}](${song.url})** has been added to the queue.`)
                .setThumbnail(await getThumb(song.url, 'small'))
                .setFooter({ text: `${song.duration} - ${song.url}` })
        }
        else {
            const playlist = result.playlist;
            await queue.addTrack(playlist);
            embed
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamics: true }) })
                .setDescription(`**${result.tracks.length} songs from [${playlist.title}](${playlist.url})** has been added to the queue.`)
                .setThumbnail(await getThumb(result.tracks[0].url, 'small'));

            if (shouldShuffle)
                queue.tracks.shuffle();
        }

        if (!queue.node.isPlaying())
            await queue.node.play();

        if (shouldLoop) {
            await looper.execute(interaction, client, result.hasPlaylist() ? 2 : 1);
            await interaction.followUp({ embeds: [embed] })
        }
        else
            await interaction.reply({ embeds: [embed] })
    }
}