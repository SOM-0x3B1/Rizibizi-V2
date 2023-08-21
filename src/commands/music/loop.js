const { SlashCommandBuilder } = require('@discordjs/builders');
const { useMainPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Choose from a few loop options')
        .addNumberOption(option =>
            option.setName('mode')
                .setDescription('What type of looping do you desire?')
                .setRequired(true)
                .addChoices(
                    { name: 'off', value: 0 },
                    { name: 'loop current song', value: 1 },
                    { name: 'loop queue', value: 2 },
                    { name: 'autoplay related songs', value: 3 }
                )),
    async execute(interaction, client, externalMode) {
        const player = useMainPlayer();
        const queue = player.nodes.get(interaction.guildId);

        if (!queue || (!queue.currentTrack && !externalMode))
            return await interaction.reply(':warning: There are no songs in the queue.');

        if(!interaction.member.voice.channel)
            return interaction.reply(':warning: You need to be in a VC to use this command.');
        else if (interaction.member.voice.channel.id != queue.channel.id)
            return interaction.reply(':warning: You need to be in the same VC as the bot to use this command.');

        const mode = externalMode ?? interaction.options.getNumber('mode');
        let modeName = ['off', 'music loop', 'queue loop', 'autoplay'][mode];

        queue.setRepeatMode(mode);
        if (mode != 0)
            await interaction.reply(`:repeat: Enabled **${modeName}**.`);
        else
            await interaction.reply(`:repeat: Disabled looping.`);
    }
}