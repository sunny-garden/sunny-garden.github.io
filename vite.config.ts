import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages base path.
  // This repository is a user/organization site (project-megatron.github.io),
  // so it is served from the domain root and `base` must be '/'.
  //
  // If you fork this into a PROJECT repository served at
  // https://<user>.github.io/<repo-name>/, change this to '/<repo-name>/'
  // (keep the leading and trailing slashes). All asset paths use
  // import.meta.env.BASE_URL, so they follow whatever you set here.
  base: '/',
  envPrefix: ['VITE_', 'REACT_APP_'],
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
