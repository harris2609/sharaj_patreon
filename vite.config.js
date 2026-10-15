import { defineConfig } from 'vite';

export default defineConfig({
  server: { watch: { ignored: ['**/.playwright-mcp/**', '**/*.png'] } },
});
