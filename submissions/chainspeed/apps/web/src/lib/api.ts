// API client for ChainSpeed backend
import { StartTestRequest, StartTestResponse, ChainConfig } from '@chainspeed/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function startTest(request: StartTestRequest): Promise<StartTestResponse> {
    const response = await fetch(`${API_URL}/api/test/start`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start test');
    }

    return response.json();
}

export async function getChains(): Promise<{ chains: ChainConfig[]; supported: string[] }> {
    const response = await fetch(`${API_URL}/api/chains`);

    if (!response.ok) {
        throw new Error('Failed to fetch chains');
    }

    return response.json();
}

export async function getTestResult(testId: string): Promise<any> {
    const response = await fetch(`${API_URL}/api/result/${testId}`);

    if (!response.ok) {
        throw new Error('Failed to fetch test result');
    }

    return response.json();
}

export async function getLeaderboard(): Promise<any> {
    const response = await fetch(`${API_URL}/api/leaderboard`);

    if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
    }

    return response.json();
}
