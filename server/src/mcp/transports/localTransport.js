
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

export function createLocalTransports() {
  return InMemoryTransport.createLinkedPair();
}
