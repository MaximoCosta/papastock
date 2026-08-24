import { runShowcaseCommand } from './showcaseCommand';

await runShowcaseCommand({
  args: process.argv.slice(2),
  nodeEnv: process.env.NODE_ENV ?? 'development',
});
