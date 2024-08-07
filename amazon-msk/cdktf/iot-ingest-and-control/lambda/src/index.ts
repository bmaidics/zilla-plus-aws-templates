import { Kafka, logLevel } from 'kafkajs';
import { SecretsManager } from 'aws-sdk';
import { Handler } from 'aws-lambda';


const fetchSecrets = async (secretName: string): Promise<any> => {
  const client = new SecretsManager();
  const data = await client.getSecretValue({ SecretId: secretName }).promise();

  if (data.SecretString) {
    return JSON.parse(data.SecretString);
  }
  throw new Error('Secret not found or empty');
};


export const handler: Handler = async (event, context) => {
  const { bootstrapServers, topics, secretName } = event;

  console.log('SecretName: ', secretName);

  let kafkaSaslCredentials;
  try {
    kafkaSaslCredentials = await fetchSecrets(secretName);
  } catch (error) {
    console.error(`Error fetching secrets: ${error}`);
    return {
      statusCode: 500,
      body: `Error fetching secrets: ${error}`,
    };
  }

  console.log('Servers: ', bootstrapServers);
  console.log('Username: ', kafkaSaslCredentials.username);
  console.log('Password: ', kafkaSaslCredentials.password);

  const kafka = new Kafka({
    clientId: 'kafka-topic-creator',
    brokers: bootstrapServers,
    sasl: {
      mechanism: 'scram-sha-512',
      username: kafkaSaslCredentials.username,
      password: kafkaSaslCredentials.password,
    },
    ssl: true,
    logLevel: logLevel.DEBUG
  });

  const admin = kafka.admin();
  await admin.connect();

  try {
    const topicConfigurations = topics.map((topic: any) => ({
      topic: topic.name,
      numPartitions: topic.numPartitions,
      replicationFactor: topic.replicationFactor,
      configEntries: Object.entries(topic.config || {}).map(([key, value]) => ({ name: key, value })),
    }));

    await admin.createTopics({
      waitForLeaders: true,
      topics: topicConfigurations,
    });

    console.log(`Created topics: ${topics.map((t: any) => t.name).join(', ')}`);
    return {
      statusCode: 200,
      body: `Created topics: ${topics.map((t: any) => t.name).join(', ')}`,
    };
  } catch (error) {
    console.error(`Error creating topics: ${error}`);
    return {
      statusCode: 500,
      body: `Error creating topics: ${error}`,
    };
  } finally {
    await admin.disconnect();
  }
};
