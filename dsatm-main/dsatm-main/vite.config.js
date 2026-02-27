import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Plugin to copy static folders to dist
function copyStaticFoldersPlugin() {
  return {
    name: 'copy-static-folders',
    writeBundle() {
      const foldersToCopy = ['aws-augmentability-main', 'assets', 'signtranslator']
      
      // Copy directory recursively
      function copyRecursive(src, dest) {
        if (!fs.existsSync(src)) return
        
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true })
        }
        
        const entries = fs.readdirSync(src, { withFileTypes: true })
        
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name)
          const destPath = path.join(dest, entry.name)
          
          if (entry.isDirectory()) {
            // Skip node_modules and dist
            if (entry.name === 'node_modules' || entry.name === 'dist') continue
            copyRecursive(srcPath, destPath)
          } else {
            fs.copyFileSync(srcPath, destPath)
          }
        }
      }
      
      // Copy each folder
      foldersToCopy.forEach(folder => {
        const srcDir = path.resolve(__dirname, folder)
        const destDir = path.resolve(__dirname, `dist/${folder}`)
        
        if (fs.existsSync(srcDir)) {
          copyRecursive(srcDir, destDir)
          console.log(`✓ Copied ${folder} to dist`)
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), copyStaticFoldersPlugin()],
  server: {
    port: 8000,
    host: '0.0.0.0', // Listen on all network interfaces (IPv4 and IPv6)
    strictPort: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    },
    // Configure middleware to handle redirect and CSP headers
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Don't interfere with API routes - let proxy handle them
        if (req.url.startsWith('/api/')) {
          next()
          return
        }
        
        // Handle /superpower route - redirect to the login page
        if (req.url === '/superpower' || req.url === '/superpower/') {
          res.writeHead(302, {
            'Location': '/aws-augmentability-main/login.html'
          })
          res.end()
          return
        }
        
        // IMPORTANT: For React Router SPA to work with direct navigation (window.location.href),
        // serve index-react.html for all React Router routes that don't match static files
        // This ensures /home, /feedback, etc. load the React app instead of 404
        const urlPath = req.url.split('?')[0] // Remove query params
        const isStaticFile = urlPath.includes('.') && !urlPath.endsWith('/')
        const isReactRoute = (urlPath === '/home' || 
                              urlPath === '/signin' ||
                              urlPath === '/login' ||
                              urlPath === '/feedback' || 
                              urlPath === '/' ||
                              (!isStaticFile && 
                               !urlPath.startsWith('/aws-augmentability-main') && 
                               !urlPath.startsWith('/sign-language') &&
                               urlPath !== '/index.html'))
        
        if (isReactRoute && urlPath !== '/index.html') {
          // For React Router routes, let Vite handle it naturally
          // Vite's dev server should serve index-react.html for SPA routes
          // We just need to ensure we don't block it
        }
        
        // Remove or relax CSP headers for development
        // Allow unsafe-eval for bundled code and third-party libraries
        if (req.url.includes('.html') || req.url === '/') {
          res.setHeader(
            'Content-Security-Policy',
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://kit.fontawesome.com https://cdn.lordicon.com https://cdnjs.cloudflare.com https://accounts.google.com; object-src 'none'; base-uri 'self';"
          )
        }
        
        next()
      })
    }
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    },
    // Copy static assets to dist
    copyPublicDir: true,
    // Ensure proper handling of static files
    assetsDir: 'assets',
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000
  }
})

