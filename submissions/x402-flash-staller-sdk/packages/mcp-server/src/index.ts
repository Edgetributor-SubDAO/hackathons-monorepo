#!/usr/bin/env node

import { X402PaymentsMCPServer } from './server.js';

const server = new X402PaymentsMCPServer();
server.run().catch(console.error);
