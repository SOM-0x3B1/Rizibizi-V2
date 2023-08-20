const { SlashCommandBuilder } = require('@discordjs/builders');
const { useMainPlayer, AudioFilters } = require('discord-player');

//AudioFilters.define("softBassBoost", "equalizer=f=70:t=h:width=50:g=5:r=f64,equalizer=f=200:t=h:width=100:g=10:r=f64,equalizer=f=8000:t=h:width=4000:g=7:r=f64");
//AudioFilters.define("softBassBoost", "bass=g=5");
AudioFilters.define("softBassBoost", "equalizer=f=70:t=h:width=100:g=2:r=f64,equalizer=f=180:t=h:width=120:g=3:r=f64,equalizer=f=10000:t=h:width=9880:g=-5:r=f64");

const effectStatuses = {'softBassBoost': false, 'bassboost': false, 'nightcore': false, '8D': false};

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
            return await interaction.reply(':warning: Error.');

        const filter = interaction.options.getString('filter');
        await queue.filters.ffmpeg.toggle([filter]);

        effectStatuses[filter] = !effectStatuses[filter];

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
        await interaction.reply(`:fire: Toggled **${filterName}** effect **${effectStatuses[filter] ? 'ON' : 'OFF'}**.`);
    }
}