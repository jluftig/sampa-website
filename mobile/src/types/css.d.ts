// Expo/Metro handle CSS imports at build time (web); this keeps tsc happy for
// side-effect CSS imports like `import '@/global.css'`.
declare module '*.css';
