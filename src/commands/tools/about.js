const { text } = require('body-parser');
const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription('Info about this bot'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#E3581C')
            .setTitle('Welcome to Rizibizi 2.0!')
            .setAuthor({ name: 'Török Soma', iconURL: 'https://music.onekilobit.eu/media/profile-light.jpg', url: 'https://github.com/SOM-0x3B1' })
            .setThumbnail('https://music.onekilobit.eu/media/pot-lid2.gif')
            .setDescription(
                "A fun lil rizibizi bot for music and stuff.\n\n" +
                "**Features**\n" +
                "- Advanced music support (YouTube, Spotify, Discord attachments)\n" +
                "- Real-time effects (bass boost, nightcore, 8D)\n" +
                "- Local and global playlist management\n" +
                "- Web GUI for playlist editing (https://music.onekilobit.eu/)\n"
            )
            .addFields({
                name: 'Source code',
                value: 'https://github.com/SOM-0x3B1/Rizibizi-V2',
            })
            .setFooter({ text: 'Version: 2.0.1' });

        await interaction.reply({
            embeds: [embed]
        });
    }
}