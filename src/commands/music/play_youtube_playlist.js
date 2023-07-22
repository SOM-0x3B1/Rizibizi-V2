const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const { QueryType } = require('discord-player');
const { useMainPlayer } = require('discord-player');
const { getThumb } = require('../../getThumb.js');
const looper = require('./loop.js');

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


        const shouldLoop = interaction.options.getBoolean('loop');
        const shouldShuffle = interaction.options.getBoolean('shuffle');

        const query = interaction.options.getString('url');
        const result = await player.search(query, {
            requestedBy: interaction.user,
            searchEngine: QueryType.YOUTUBE_PLAYLIST
        });
        if (!result.hasTracks())
            return interaction.reply('No results.');

        const playlist = result.playlist;
        await queue.addTrack(playlist);
        const embed = new EmbedBuilder()
            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamics: true }) })
            .setDescription(`**${result.tracks.length} songs from [${playlist.title}](${playlist.url})** has been added to the queue.`)
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