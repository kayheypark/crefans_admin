import {defineConfig,devices} from '@playwright/test';
import base from './playwright.config';
export default defineConfig({...base,testMatch:['withdrawal-reject.spec.ts','bean-chargeback-hold.spec.ts'],outputDir:'test-results/withdrawal-reject',projects:[{name:'pc',use:{browserName:'chromium',viewport:{width:1440,height:1000}}},{name:'mobile',use:{...devices['iPhone 13'],browserName:'webkit'}}]});
