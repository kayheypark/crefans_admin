import {defineConfig} from '@playwright/test';
import path from 'node:path';
import base from './e2e/beans-empty.config';

// 무통장입금 console, display and request-shape checks with every admin API mocked in the spec.
export default defineConfig({...base,testDir:'./e2e',testMatch:'deposits.spec.ts',
 outputDir:path.resolve(__dirname,'test-results/deposits'),
 reporter:[['list']],
});
