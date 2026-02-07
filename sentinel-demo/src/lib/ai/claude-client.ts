import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";

export function getClaudeClient(): AnthropicBedrock {
  const region = process.env.AWS_REGION || "us-west-2";

  return new AnthropicBedrock({
    awsRegion: region,
    maxRetries: 3, // SDK handles 429/500/503 with exponential backoff
    // Auth: uses AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and optionally
    // AWS_SESSION_TOKEN from environment (standard AWS credential chain)
  });
}
