export async function submitUserOp(_userOp: unknown): Promise<`0x${string}`> {
  // TODO: submit to hosted bundler (Pimlico/Stackup)
  return '0x';
}

export async function waitForTx(_hash: `0x${string}`): Promise<void> {
  // TODO: poll RPC for inclusion
} 