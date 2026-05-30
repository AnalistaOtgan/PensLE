// vite.config.ts
import { defineConfig } from "file:///C:/OtganLabs/PensLE/node_modules/vitest/dist/config.js";
import react from "file:///C:/OtganLabs/PensLE/node_modules/@vitejs/plugin-react/dist/index.js";
import basicSsl from "file:///C:/OtganLabs/PensLE/node_modules/@vitejs/plugin-basic-ssl/dist/index.mjs";
var vite_config_default = defineConfig(({ mode }) => {
  return {
    envPrefix: ["VITE_", "API_KEY_GROQ"],
    plugins: [react(), ...mode === "lan" ? [basicSsl()] : []],
    server: {
      allowedHosts: ["desktop-kk5dpan.tail411a6a.ts.net"]
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/test/setup.ts"
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxPdGdhbkxhYnNcXFxcUGVuc0xFXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxPdGdhbkxhYnNcXFxcUGVuc0xFXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9PdGdhbkxhYnMvUGVuc0xFL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZXN0L2NvbmZpZyc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IGJhc2ljU3NsIGZyb20gJ0B2aXRlanMvcGx1Z2luLWJhc2ljLXNzbCc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcbiAgcmV0dXJuIHtcbiAgICBlbnZQcmVmaXg6IFsnVklURV8nLCAnQVBJX0tFWV9HUk9RJ10sXG4gICAgcGx1Z2luczogW3JlYWN0KCksIC4uLihtb2RlID09PSAnbGFuJyA/IFtiYXNpY1NzbCgpXSA6IFtdKV0sXG4gICAgc2VydmVyOiB7XG4gICAgICBhbGxvd2VkSG9zdHM6IFsnZGVza3RvcC1razVkcGFuLnRhaWw0MTFhNmEudHMubmV0J11cbiAgICB9LFxuICAgIHRlc3Q6IHtcbiAgICAgIGVudmlyb25tZW50OiAnanNkb20nLFxuICAgICAgZ2xvYmFsczogdHJ1ZSxcbiAgICAgIHNldHVwRmlsZXM6ICcuL3NyYy90ZXN0L3NldHVwLnRzJ1xuICAgIH1cbiAgfTtcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFpUCxTQUFTLG9CQUFvQjtBQUM5USxPQUFPLFdBQVc7QUFDbEIsT0FBTyxjQUFjO0FBRXJCLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3hDLFNBQU87QUFBQSxJQUNMLFdBQVcsQ0FBQyxTQUFTLGNBQWM7QUFBQSxJQUNuQyxTQUFTLENBQUMsTUFBTSxHQUFHLEdBQUksU0FBUyxRQUFRLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFFO0FBQUEsSUFDMUQsUUFBUTtBQUFBLE1BQ04sY0FBYyxDQUFDLG1DQUFtQztBQUFBLElBQ3BEO0FBQUEsSUFDQSxNQUFNO0FBQUEsTUFDSixhQUFhO0FBQUEsTUFDYixTQUFTO0FBQUEsTUFDVCxZQUFZO0FBQUEsSUFDZDtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
