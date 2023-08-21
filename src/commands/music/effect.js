const { SlashCommandBuilder } = require('@discordjs/builders');
const { useMainPlayer, AudioFilters } = require('discord-player');

//AudioFilters.define("softBassBoost", "equalizer=f=70:t=h:width=50:g=5:r=f64,equalizer=f=200:t=h:width=100:g=10:r=f64,equalizer=f=8000:t=h:width=4000:g=7:r=f64");
//AudioFilters.define("softBassBoost", "bass=g=5");
AudioFilters.define("softBassBoost", "equalizer=f=70:t=h:width=100:g=3:r=f64,equalizer=f=180:t=h:width=120:g=3:r=f64,equalizer=f=3000:t=h:width=5760:g=-7:r=f64");

const effectStatuses = {};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('effect')
        .setDescription('Toggles an audio filter')
        .addStringOption(option =>
            option.setName('filter')
                .setDescription('The filter you want to toggle')
                .setRequired(true)
                .addChoices(
                    { name: 'soft bass boost', value: 'softBassBoost' },
                    { name: 'hard bass boost', value: 'bassboost' },
                    { name: 'nightcore', value: 'nightcore' },
                    { name: '8D', value: '8D' },
                )),
    async execute(interaction, client) {
        const player = useMainPlayer();
        const queue = player.nodes.get(interaction.guildId);

        if (!queue)
            return await interaction.reply(':warning: Error. The queue is offline.');

        if(!interaction.member.voice.channel)
            return interaction.reply(':warning: You need to be in a VC to use this command.');
        else if (interaction.member.voice.channel.id != queue.channel.id)
            return interaction.reply(':warning: You need to be in the same VC as the bot to use this command.');

        const filter = interaction.options.getString('filter');
        await queue.filters.ffmpeg.toggle([filter]);

        const guildID = interaction.channel.guild.id;

        if(!effectStatuses[interaction.guildId])
            effectStatuses[interaction.guildId] = {'softBassBoost': false, 'bassboost': false, 'nightcore': false, '8D': false};

        effectStatuses[guildID][filter] = !effectStatuses[guildID][filter];

        let filterName;
        switch (filter) {
            case 'bassboost':
                filterName = 'hard bass boost';
                break;
            case 'softBassBoost':
                filterName = 'soft bass boost';
                break;
            default:
                filterName = filter;
                break;
        }
        await interaction.reply(`:fire: Toggled **${filterName}** effect **${effectStatuses[guildID][filter] ? 'ON' : 'OFF'}**.`);
    }
}