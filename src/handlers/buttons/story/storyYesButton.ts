import { Button } from '../../handlers';
import {
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import mysql from 'mysql2';

const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

connection.connect();

const yesNoQuestions = [
  'Czy osoba niżej kiedykolwiek zgubiła klucze?',
  'Czy osoba niżej lubi ekstremalne sporty?',
  'Czy osoba niżej potrafi grać na jakimś instrumencie?',
  'Czy osoba niżej jest rannym ptaszkiem?',
  'Czy osoba niżej kiedykolwiek śpiewała publicznie?',
  'Czy osoba niżej woli koty od psów?',
  'Czy osoba niżej była kiedyś za granicą?',
  'Czy osoba niżej lubi gotować?',
  'Czy osoba niżej potrafi mówić w więcej niż dwóch językach?',
  'Czy osoba niżej boi się pająków?',
  'Czy osoba niżej czyta książki przynajmniej raz w miesiącu?',
  'Czy osoba niżej potrafi zatańczyć salsę?',
  'Czy osoba niżej nigdy nie oglądała horroru?',
  'Czy osoba niżej ma prawo jazdy?',
  'Czy osoba niżej lubi słuchać muzyki klasycznej?',
  'Czy osoba niżej była kiedyś na koncercie rockowym?',
  'Czy osoba niżej potrafi zrobić przysiad na jednej nodze?',
  'Czy osoba niżej oglądała serial Netflix w całości w jeden weekend?',
  'Czy osoba niżej potrafi naprawić coś w domu samodzielnie?',
  'Czy osoba niżej często korzysta z mediów społecznościowych?',
];

export default new Button({
    custom_id: 'story_yes',
    run: async ({ interaction,  }) => {
        const messageId = interaction.customId.split('-')[1];

        const randomQuestion = yesNoQuestions[Math.floor(Math.random() * yesNoQuestions.length)];

        const modal = new ModalBuilder()
            .setCustomId(`storyModalYes-${messageId}`)
            .setTitle('Nieskończona historia');

        const msgInput = new TextInputBuilder()
            .setCustomId('msgInput')
            .setLabel('Twoja historia')
            .setValue(randomQuestion)
            .setRequired(true)
            .setStyle(TextInputStyle.Short);

        modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(msgInput),
        );

        await interaction.showModal(modal);
    },
});