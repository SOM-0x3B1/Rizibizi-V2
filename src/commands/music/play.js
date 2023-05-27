const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const { QueryType } = require('discord-player');
const { useMasterPlayer } = require('discord-player');
const { getThumb } = require('../../getThumb.js');

const looper = require('./loop.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Load music from YouTube')
        .addSubcommand((subcommand) =>
            subcommand
                .setName('url')
                .setDescription('Load a single song from URL')
                .addStringOption((option) => option.setName('url').setDescription('The URL of the song').setRequired(true))
                .addBooleanOption((option) => option.setName('loop').setDescription('Should I loop this song?'))
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('url_playlist')
                .setDescription('Load a playlist of songs from URL')
                .addStringOption((option) => option.setName('url').setDescription('The URL of the playlist').setRequired(true))
                .addBooleanOption((option) => option.setName('loop').setDescription('Should I loop this song?'))
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('search')
                .setDescription('Searches for a song on YouTube')
                .addStringOption((option) => option.setName('searchterms').setDescription('The search keywords').setRequired(true))
                .addBooleanOption((option) => option.setName('loop').setDescription('Should I loop this song?'))
        ),

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

        let url = '';
        let subcommand = interaction.options.getSubcommand();
        if (subcommand != 'search')
            url = interaction.options.getString('url');
        const shouldLoop = interaction.options.getBoolean('loop');

        switch (subcommand) {
            case 'url':
                const u_result = await player.search(url, {
                    requestedBy: interaction.user,
                    searchEngine: QueryType.YOUTUBE_VIDEO
                });
                if (!u_result.hasTracks())
                    return interaction.reply('No results!');

                const u_song = u_result.tracks[0];
                await queue.addTrack(u_song);
                embed
                    .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamics: true }) })
                    .setDescription(`**[${u_song.title}](${u_song.url})** has been added to the queue.`)
                    .setThumbnail(await getThumb(u_song.url, 'small'))
                    .setFooter({ text: `${u_song.duration} - ${u_song.url}` })
                break;

            case 'url_playlist':
                const p_result = await player.search(url, {
                    requestedBy: interaction.user,
                    searchEngine: QueryType.YOUTUBE_PLAYLIST
                });
                if (!p_result.hasTracks())
                    return interaction.reply('No results!');

                await queue.addTrack(p_result.tracks);

                const playlist = p_result.playlist;
                embed
                    .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamics: true }) })
                    .setDescription(`**${p_result.tracks.length} songs from [${playlist.title}](${playlist.url})** has been added to the queue.`)
                    .setThumbnail(await getThumb(p_result.tracks[0].url, 'small'));
                break;

            case 'search':
                let searchterms = interaction.options.getString('searchterms');
                const s_result = await player.search(searchterms, {
                    requestedBy: interaction.user,
                    searchEngine: QueryType.YOUTUBE
                });
                if (!s_result.hasTracks())
                    return interaction.reply('No results!');

                const s_song = s_result.tracks[0];

                await queue.addTrack(s_song);

                embed
                    .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamics: true }) })
                    .setDescription(`**[${s_song.title}](${s_song.url})** has been added to the queue.`)
                    .setThumbnail(await getThumb(s_song.url, 'small'))
                    .setFooter({ text: `${s_song.duration} - ${s_song.url}` })
                break;
        }

        if (!queue.node.isPlaying())
            await queue.node.play();

        if (shouldLoop) {            
            await looper.execute(interaction, client, subcommand == 'url_playlist' ? 2 : 1);
            await interaction.followUp({ embeds: [embed] })
        }
        else
            await interaction.reply({ embeds: [embed] })
    }
}