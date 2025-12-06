import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { Server as SocketIOServer } from 'socket.io';
import { Request } from 'express';

export interface GraphQLContext {
  prisma: PrismaClient;
  redis: Redis;
  io: SocketIOServer;
  req: Request;
  userId?: string;
  isAdmin?: boolean;
}

export interface AuthPayload {
  userId?: string;
  address?: string;
  isAdmin?: boolean;
}

