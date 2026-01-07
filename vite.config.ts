import { rmSync } from 'fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import { resolve } from 'path'
import pkg from './package.json'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'

rmSync('dist', { recursive: true, force: true })
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // Ant Design Vue 按需导入
    Components({
      resolvers: [
        AntDesignVueResolver({
          importStyle: 'less', // 使用 less 样式
        }),
      ],
    }),
    electron([
      {
        entry: 'electron/index.ts',
        vite: {
          build: {
            sourcemap: false,
            outDir: 'dist/electron',
          },
        },
      },
      {
        entry: 'electron/preload/index.ts',
        vite: {
          build: {
            sourcemap: false,
            outDir: 'dist/electron/preload',
          },
        },
      },
    ]),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'), // 设置 `@` 指向 `src` 目录
      '@img': resolve(__dirname, 'src/assets/images'), // 设置@img指向images目录
    },
  },
  build: {
    // 使用 esbuild 压缩（默认）
    minify: 'esbuild',
    // 分包优化
    rollupOptions: {
      output: {
        manualChunks: {
          'ant-design-vue': ['ant-design-vue'],
          'echarts': ['echarts/core', 'echarts/renderers', 'echarts/charts', 'echarts/components'],
          'vue-vendor': ['vue', 'vue-router'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  server: process.env.VSCODE_DEBUG
    ? {
        host: pkg.debug.env.VITE_DEV_SERVER_HOSTNAME,
        port: pkg.debug.env.VITE_DEV_SERVER_PORT,
      }
    : undefined,
})
