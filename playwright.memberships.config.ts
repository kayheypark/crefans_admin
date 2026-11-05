import {defineConfig,devices} from '@playwright/test';
import base from './playwright.config';
export default defineConfig({...base,testMatch:'memberships.spec.ts',outputDir:'test-results/memberships',projects:[{name:'pc',use:{browserName:'chromium',viewport:{width:1440,height:1000}}},{name:'mobile',use:{...devices['iPhone 13'],browserName:'webkit'}}]});
