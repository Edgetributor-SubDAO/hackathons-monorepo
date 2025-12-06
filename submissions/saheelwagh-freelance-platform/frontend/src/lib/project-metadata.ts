/**
 * Project Metadata Service
 * 
 * Stores project title, description, and other metadata in localStorage.
 * This is a workaround because the Stellar escrow contract only stores
 * financial data (addresses, amounts, statuses) - not project metadata.
 * 
 * WHY NOT ON-CHAIN?
 * -----------------
 * 1. **Cost**: Storing strings on Stellar is expensive (21 bytes = 1 stroop per entry).
 *    A 200-char description would cost significantly more than the escrow itself.
 * 
 * 2. **Size Limits**: Soroban contracts have strict storage limits. Large text
 *    fields would quickly exhaust contract storage.
 * 
 * 3. **Separation of Concerns**: The escrow contract's job is to securely hold
 *    and release funds. Project metadata is a UI concern.
 * 
 * 4. **Flexibility**: Off-chain metadata can be updated without contract calls.
 * 
 * 5. **Cross-Chain Design**: In the full architecture, project metadata would
 *    be stored on Polkadot (cheaper storage, better for complex data), while
 *    Stellar handles the financial escrow. This localStorage approach simulates
 *    that pattern for the demo.
 * 
 * PRODUCTION ALTERNATIVE:
 * - Store metadata on Polkadot via the Project Registry contract
 * - Or use IPFS with hash stored on-chain
 * - Or use a traditional database with on-chain hash verification
 */

const STORAGE_KEY = 'polkstellar_project_metadata';

export interface ProjectMetadata {
  projectId: number;
  title: string;
  description: string;
  createdAt: string; // ISO timestamp
  clientAddress: string;
  freelancerAddress: string;
  milestoneNames?: string[]; // Optional names for each milestone
}

/**
 * Get all stored project metadata
 */
export function getAllProjectMetadata(): Record<number, ProjectMetadata> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch (err) {
    console.error('Error reading project metadata:', err);
    return {};
  }
}

/**
 * Get metadata for a specific project
 */
export function getProjectMetadata(projectId: number): ProjectMetadata | null {
  const all = getAllProjectMetadata();
  return all[projectId] || null;
}

/**
 * Save metadata for a project
 */
export function saveProjectMetadata(metadata: ProjectMetadata): void {
  try {
    const all = getAllProjectMetadata();
    all[metadata.projectId] = metadata;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    console.log('Saved project metadata:', metadata);
  } catch (err) {
    console.error('Error saving project metadata:', err);
  }
}

/**
 * Update metadata for a project (partial update)
 */
export function updateProjectMetadata(
  projectId: number,
  updates: Partial<Omit<ProjectMetadata, 'projectId'>>
): void {
  const existing = getProjectMetadata(projectId);
  if (existing) {
    saveProjectMetadata({ ...existing, ...updates });
  }
}

/**
 * Delete metadata for a project
 */
export function deleteProjectMetadata(projectId: number): void {
  try {
    const all = getAllProjectMetadata();
    delete all[projectId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.error('Error deleting project metadata:', err);
  }
}

/**
 * Search projects by title (case-insensitive)
 */
export function searchProjectsByTitle(query: string): ProjectMetadata[] {
  const all = getAllProjectMetadata();
  const lowerQuery = query.toLowerCase();
  return Object.values(all).filter(
    (p) => p.title.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Clear all project metadata (for testing)
 */
export function clearAllProjectMetadata(): void {
  localStorage.removeItem(STORAGE_KEY);
}
