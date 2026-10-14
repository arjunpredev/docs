export declare const serverInstructions: string;
export declare const tools: {
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: Record<string, unknown>;
}[];
export declare function mcpServerCard(name: string, url: string): Record<string, unknown>;
