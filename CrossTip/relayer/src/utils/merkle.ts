// src/utils/merkle.ts
import crypto from 'crypto';

export class MerkleTree {
  static buildRoot(leaves: string[]): string {
    if (leaves.length === 0) return '';
    
    let nodes: Buffer[] = leaves.map((h) => Buffer.from(h, 'hex'));
    
    while (nodes.length > 1) {
      const next: Buffer[] = [];
      for (let i = 0; i < nodes.length; i += 2) {
        if (i + 1 === nodes.length) {
          next.push(nodes[i]);
        } else {
          const concat = Buffer.concat([nodes[i], nodes[i + 1]]);
          next.push(crypto.createHash('sha256').update(concat).digest());
        }
      }
      nodes = next;
    }
    
    return nodes[0].toString('hex');
  }

  static hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}
