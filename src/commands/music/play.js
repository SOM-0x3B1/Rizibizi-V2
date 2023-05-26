const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const { QueryType } = require('discord-player');
const { useMasterPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Load music from YouTube')
        .addSubcommand((subcommand) =>
            subcommand
                .setName('url')
                .setDescription('Load a single song from URL')
                .addStringOption((option) => option.setName('url').setDescription('The URL of the song').setRequired(true))
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('url_playlist')
                .setDescription('Load a playlist of songs from URL')
                .addStringOption((option) => option.setName('url').setDescription('The URL of the playlist').setRequired(true))
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('search')
                .setDescription('Searches for a song on YouTube')
                .addStringOption((option) => option.setName('searchterms').setDescription('The search keywords').setRequired(true))
        ),
    async execute(interaction, client) {
        const player = useMasterPlayer()

        if (!interaction.member.voice.channel)
            return interaction.reply('You need to be in a VC to use this command');

        const queue = await player.nodes.create(interaction.guild, {
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

        if (!queue.connection)
            await queue.connect(interaction.member.voice.channel);

        let embed = new EmbedBuilder();

        let url = '';
        let subcommand = interaction.options.getSubcommand();

        if (subcommand != 'search')
            url = interaction.options.getString('url');

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
                    .setDescription(`**[${u_song.title}](${u_song.url})** has been added to the queue.`)
                    .setThumbnail(u_song.setThumbnail)
                    .setFooter({ text: `Duration: ${u_song.duration}` });
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
                    .setDescription(`**${p_result.tracks.length} songs from [${playlist.title}](${playlist.url})** has been added to the queue.`)
                    .setThumbnail(playlist.setThumbnail);
                break;

            case 'search':
                let searchterms = interaction.options.getString('searchterms');
                const s_result = await player.search(searchterms, {
                    requestedBy: interaction.user,
                    searchEngine: QueryType.YOUTUBE_VIDEO
                });
                if (!s_result.hasTracks())
                    return interaction.reply('No results!');

                const s_song = s_result.tracks[0];

                await queue.addTrack(s_song);

                embed
                    .setDescription(`**[${s_song.title}](${s_song.url})** has been added to the queue.`)
                    .setThumbnail(s_song.setThumbnail)
                    .setFooter({ text: `Duration: ${s_song.duration}` });
                break;
        }

        if (!queue.node.isPlaying())
            await queue.node.play();

        await interaction.reply({
            embeds: [embed]
        })
    }
}