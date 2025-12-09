/// <reference path="./types/express/index.d.ts" />

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { handleError } from './utils/errors';
import { pool } from './utils/db';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import { authRouter } from './routers/auth.router';
import { userRouter } from './routers/user.router';
import { projectRouter } from './routers/project.router';
import {moduleRouter} from "./routers/module.router";
import {columnRouter} from "./routers/column.router";
import {taskRouter} from "./routers/task.router";

export const app = express();
const port = Number(process.env.NODE_PORT || 3001);

pool.getConnection()
    .then(connection => {
        console.log('🎉 MySQL połączony!');
        connection.release();
    })
    .catch(err => {
        console.error('Błąd połączenia z bazą danych:', err.message);
    });

// --- KONFIGURACJA SWAGGERA ---
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Agile API',
            version: '1.0.0',
            description: 'API do zarządzania projektami, modułami i tablicami Kanban.',
        },
        servers: [
            {
                url: 'http://localhost:3001',
                description: 'Serwer lokalny',
            },
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'jwt',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        email: { type: 'string', format: 'email' },
                        fullName: { type: 'string' }
                    }
                },
                Project: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        owner_id: { type: 'string', format: 'uuid' },
                        created_at: { type: 'string', format: 'date-time' }
                    }
                },
                Module: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        project_id: { type: 'string', format: 'uuid' }
                    }
                },
                Task: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        title: { type: 'string' },
                        description: { type: 'string' },
                        priority: {
                            type: 'string',
                            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
                        },
                        column_id: { type: 'string', format: 'uuid' }
                    }
                }
            }
        },
        security: [
            {
                cookieAuth: [],
            },
        ],
    },
    apis: ['./src/routers/*.ts'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/projects', projectRouter);
app.use('/api/modules', moduleRouter);
app.use('/api', columnRouter);
app.use('/api', taskRouter);

app.get('/api', (req, res) => {
    res.send('API working!');
});

app.use(handleError);

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, '0.0.0.0', () => {
        console.log(`Backend listening on http://localhost:${port}`);
    });
}
