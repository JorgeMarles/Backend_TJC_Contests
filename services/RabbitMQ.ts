import ampq from 'amqplib';
import { RABBITMQ_HOST, RABBITMQ_PASSWORD, RABBITMQ_PORT, RABBITMQ_USERNAME } from '../config';
import { endContest, isEnded } from './ContestService';
import { createProblemBase } from './ProblemService';
import { processSubmissionBase } from './SubmissionOverviewService';
import { createUserBase } from './UserService';

type QueueInfo = {
    type: string,
    exchange: string,
    arguments: {
        [key: string]: any
    }
}

type QueueOutData = {
    info?: QueueInfo,
    queue: ampq.Replies.AssertQueue | null,
}

type QueueInData = {
    info?: QueueInfo,
    queue: ampq.Replies.AssertQueue | null,
    consume: (channel: ampq.Channel, msg: ampq.ConsumeMessage | null) => Promise<any>
}

type RabbitMQUtils = {
    queuesOut: {
        [key: string]: QueueOutData
    },
    queuesIn?: {
        [key: string]: QueueInData
    }
    channel: ampq.Channel | null
}

const DEFAULT_ALL_UP_TO = false;
const DEFAULT_REQUEUE = false;

const rmq: RabbitMQUtils = {
    queuesOut: {
        'contest-stats': {
            queue: null,
        },
        'contest-end': {
            info: {
                type: 'x-delayed-message',
                exchange: 'contest-delayed',
                arguments: {
                    'x-delayed-type': 'direct'
                }
            },
            queue: null,
        }
    },
    queuesIn: {
        'contest-end': {
            queue: null,
            consume: async (channel: ampq.Channel, msg: ampq.ConsumeMessage | null) => {
                if (!msg) return;

                try {
                    const {
                        contestId,
                        endTime,
                        numProblems,
                        difficulty
                    } = JSON.parse(msg.content.toString());
                    const end = new Date(endTime);

                    if(await isEnded(contestId)) {
                        console.log(`Contest ${contestId} has already ended.`);
                        return;
                    }

                    console.log(`Contest ${contestId} ended at ${end}`);
                    endContest(contestId);
                    channel.ack(msg);
                } catch (error) {
                    console.error('Error processing contest-end message:', error);
                    channel.nack(msg, DEFAULT_ALL_UP_TO, DEFAULT_REQUEUE);
                }
            }
        },
        'problem-creation': {
            queue: null,
            consume: async (channel: ampq.Channel, msg: ampq.ConsumeMessage | null) => {
                if (!msg) return;

                try {
                    const {
                        problemId
                    } = JSON.parse(msg.content.toString());
                    


                    console.log(`Creating problem with id ${problemId}`);
                    createProblemBase({id: problemId});
                    channel.ack(msg);
                } catch (error) {
                    console.error('Error creating problem:', error);
                    channel.nack(msg, DEFAULT_ALL_UP_TO, DEFAULT_REQUEUE);
                }
            }
        },
        'submission-save': {
            queue: null,
            consume: async (channel, msg) => {
                if(!msg)return;

                try{
                    const {
                        submissionId
                    } = JSON.parse(msg.content.toString());

                    console.log(`Saving submission with id ${submissionId}`);
                    await processSubmissionBase(submissionId);
                    channel.ack(msg);
                }catch(error){
                    console.error('Error saving submission:', error);
                    channel.nack(msg, DEFAULT_ALL_UP_TO, DEFAULT_REQUEUE);
                }
            },
        },
        'user-creation': {
            queue: null,
            consume: async (channel, msg) => {
                if(!msg)return;

                try{
                    const {
                        userId
                    } = JSON.parse(msg.content.toString());

                    console.log(`Creating user with id ${userId}`);
                    await createUserBase({id: userId});
                    channel.ack(msg);
                } catch(error){
                    console.error('Error creating user:', error)
                    channel.nack(msg, DEFAULT_ALL_UP_TO, DEFAULT_REQUEUE)
                }
            }
        }
    },
    channel: null
}

export const connectRabbitMQ = async () => {
    try {
        console.log('Connecting to RabbitMQ at', getRabbitMQURL(), '...');

        const connection = await ampq.connect(getRabbitMQURL());
        const channel = await connection.createChannel();

        // Configurar colas de salida
        for (const key in rmq.queuesOut) {
            const queue = key;
            
            if (rmq.queuesOut[key].info) {
                const { type, exchange } = rmq.queuesOut[key].info;
                await channel.assertExchange(exchange, type, { 
                    durable: true, 
                    arguments: rmq.queuesOut[key].info.arguments 
                });
                
                // Para fanout, no necesitamos crear la cola aquí
                if (type !== 'fanout') {
                    rmq.queuesOut[key].queue = await channel.assertQueue(queue, { durable: true });
                    await channel.bindQueue(queue, exchange, key);
                }
            } else {
                rmq.queuesOut[key].queue = await channel.assertQueue(queue, { durable: true });
            }
            
            console.log(`Queue ${queue} is ready`);
        }

        for (const key in rmq.queuesIn) {
            let queueName = key;
            
            if (key === 'user-creation') {
                await channel.assertExchange('user-broadcast', 'fanout', { durable: true });
                
                queueName = 'user-creation-contests';
                const queue = await channel.assertQueue(queueName, { 
                    durable: true,
                    exclusive: false 
                });
                
                await channel.bindQueue(queue.queue, 'user-broadcast', '');
                rmq.queuesIn[key].queue = queue;
            } else {
                rmq.queuesIn[key].queue = await channel.assertQueue(queueName, { durable: true });
            }
            
            channel.consume(queueName, async (msg) => rmq.queuesIn![key].consume(channel, msg), { noAck: false });
            console.log(`Consumer for ${queueName} is ready`);
        }

        rmq.channel = channel;

    } catch (error) {
        console.error('Error connecting to RabbitMQ:', error);
        throw error;
    }
}

export const scheduleContestEnd = (contestId: number, endTime: Date) => {
    const now = new Date();
    const timeUntilEnd = endTime.getTime() - now.getTime();

    if (timeUntilEnd <= 0) {
        console.log(`Contest ${contestId} has already ended`);
        
        endContest(contestId);
        return;
    }

    // Publicar mensaje con delay
    const message = JSON.stringify({
        contestId,
        endTime: endTime.toISOString()
    });

    publishDelayedMessage('contest-end', message, timeUntilEnd);
    console.log(`Contest ${contestId} scheduled to end at ${endTime}, left ${timeUntilEnd} ms`);
};

type ContestData = {
    contestId: number;
    endTime: Date;
    numProblems: number;
    difficulty: number;
}

type ParticipationData = {
    contestId: number;
    userId: number;
    position: number;
    problemsSolved: number;
    numAttempts: number;
    penalty: number;
    percentile: number;
}

type ContestMessage = {
    type: "contest";
    data: ContestData;
}

type ParticipationMessage = {
    type: "participation";
    data: ParticipationData;
}

type Message = ContestMessage | ParticipationMessage;

export const sendRegisterContestMessage = async (contestId: number, endTime: Date, numProblems: number, difficulty: number) => {
    const message: Message = {
        type: "contest",
        data: {
            contestId,
            endTime,
            numProblems,
            difficulty
        }
    }
    await publishMessage('contest-stats', JSON.stringify(message));
    console.log(`Contest ${contestId} registered with ${numProblems} problems`);
}

export const sendParticipationMessage = async (contestId: number, userId: number, position: number, problemsSolved: number, numAttempts: number, penalty: number, percentile: number) => {
    const message: Message = {
        type: "participation",
        data: {
            contestId,
            userId,
            position,
            problemsSolved,
            numAttempts,
            penalty,
            percentile
        }
    }
    await publishMessage('contest-stats', JSON.stringify(message));
    console.log(`Participation message for contest ${contestId} sent for user ${userId}`);
}

const publishDelayedMessage = async (queue: string, message: string, delay: number) => {
    rmq.channel!.publish(
        rmq.queuesOut[queue].info!.exchange, // Nombre del exchange
        queue,            // Routing key (nombre de la cola)
        Buffer.from(message),
        {
            headers: {
                'x-delay': delay
            },
            persistent: true
        }
    );
}

const publishMessage = async (queue: string, message: string, options?: ampq.Options.Publish) => {
    try {
        const queueObj: ampq.Replies.AssertQueue | null = rmq.queuesOut[queue].queue;
        if (!queueObj || !rmq.channel) {
            throw new Error(`Either the Channel or the Queue ${queue} is not initialized or does not exist.`);
        }
        rmq.channel.sendToQueue(queueObj.queue, Buffer.from(message), { ...options, persistent: true });
    } catch (error) {
        console.error(`Error publishing message in queue ${queue} to RabbitMQ:`, error);
        throw error;
    }
}

const getRabbitMQURL = () => {
    return `amqp://${RABBITMQ_USERNAME}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`;
}