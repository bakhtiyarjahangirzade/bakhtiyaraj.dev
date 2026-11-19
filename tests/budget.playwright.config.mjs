import {resolve} from 'node:path';
import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./browser',testMatch:'budget.spec.mjs',timeout:30000,workers:2,
 use:{baseURL:'http://127.0.0.1:4173',channel:'chrome',locale:'en-GB',trace:'retain-on-failure'},
 webServer:{cwd:resolve(import.meta.dirname,'..'),command:'node node_modules/vite/bin/vite.js preview --config storefront/vite.config.mjs --host 127.0.0.1 --port 4173 --strictPort',url:'http://127.0.0.1:4173/budgettracker/',reuseExistingServer:!process.env.CI},
 projects:[{name:'phone',use:{viewport:{width:390,height:844}}},{name:'desktop',use:{viewport:{width:1440,height:1000}}}]
});
