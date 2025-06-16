const { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

client.once('ready', () => {
  console.log(`✅ Le bot ${client.user.tag} est bien lancé.`);
});

client.on('messageCreate', async (message) => {
  console.log(`[MESSAGE] ${message.author.tag}: ${message.content}`);

  if (message.content === `!ping`) {
    return message.reply(`🏓 Pong ! Latence : ${Date.now() - message.createdTimestamp}ms`);
  }

  if (message.content === `!setup-tickets`) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_button')
        .setLabel('🎟️ Ouvrir un ticket')
        .setStyle(ButtonStyle.Primary)
    );

    message.channel.send({
      content: 'Cliquez sur le bouton ci-dessous pour ouvrir un ticket :',
      components: [row]
    });
  }

  if (message.content === `!ticketsfermes`) {
    console.log("Commande détectée : !ticketsfermes");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('disabled_ticket_button')
        .setLabel('🎟️ Ouvrir un ticket')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    message.channel.send({
      content: '🚫 Les tickets sont temporairement fermés.',
      components: [row]
    });
  }

  if (message.content === `!ticketsouverts`) {
    console.log("Commande détectée : !ticketsouverts");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_button')
        .setLabel('🎟️ Ouvrir un ticket')
        .setStyle(ButtonStyle.Primary)
    );

    message.channel.send({
      content: '📬 Les tickets sont ouverts. Cliquez pour en créer un.',
      components: [row]
    });
  }

  if (message.content === `!close`) {
    if (!message.channel.name.startsWith('ticket-')) return;
    await message.reply('⏳ Fermeture du ticket dans 3 secondes...');
    setTimeout(() => {
      message.channel.delete().catch(() => {});
    }, 3000);
  }
});

client.on('interactionCreate', async (interaction) => {
  const { guild, member } = interaction;

  if (interaction.isButton()) {
    if (interaction.customId === 'ticket_button') {
      const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('select_ticket_type')
          .setPlaceholder('Choisissez une catégorie')
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel('Acheter')
              .setDescription('Ouvrir un ticket pour acheter')
              .setValue('achat')
              .setEmoji('🛒'),
            new StringSelectMenuOptionBuilder()
              .setLabel('Support')
              .setDescription('Ouvrir un ticket pour du support')
              .setValue('support')
              .setEmoji('🛠️')
          )
      );
      return interaction.reply({
        content: '🔽 Choisissez une catégorie :',
        components: [menu],
        ephemeral: true
      });
    }

    if (interaction.customId === 'close_ticket') {
      if (!interaction.channel.name.startsWith('ticket-')) return;
      await interaction.reply({ content: '⏳ Fermeture dans 3 secondes...', ephemeral: true });
      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
      }, 3000);
    }
  }

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'select_ticket_type') {
      const type = interaction.values[0];
      const category = guild.channels.cache.find(c => c.name === "🎫 ＴＩＣＫＥＴＳ 🎫" && c.type === ChannelType.GuildCategory);
      const existing = guild.channels.cache.find(c => c.name === `ticket-${type}-${member.id}`);
      if (existing) return interaction.reply({ content: '❗ Tu as déjà un ticket pour cette catégorie.', ephemeral: true });

      const channel = await guild.channels.create({
        name: `ticket-${type}-${member.id}`,
        type: ChannelType.GuildText,
        parent: category?.id,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: member.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
          },
          {
            id: '1371258228020740347',
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
          },
          {
            id: interaction.client.user.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
          }
        ]
      });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('❌ Fermer le ticket')
          .setStyle(ButtonStyle.Danger)
      );

      const msg = type === 'achat'
        ? `🛒 Merci <@${member.id}> pour ta demande d’achat. Un staff va te répondre.`
        : `🛠️ Merci <@${member.id}> pour ta demande de support. Un staff va t’aider.`;

      channel.send({ content: msg, components: [row] });
      await interaction.reply({ content: `✅ Ticket créé : ${channel}`, ephemeral: true });
    }
  }
});
