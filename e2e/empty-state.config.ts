import {defineConfig} from '@playwright/test';
import path from 'node:path';
import base from './beans-empty.config';

export default defineConfig({...base,
 testMatch:['beans-empty.spec.ts','empty-state.spec.ts'],
 outputDir:'../.local/console-empty-state-20261103/results',
 reporter:[['list'],['json',{outputFile:path.resolve(__dirname,'../.local/console-empty-state-20261103/results.json')}]],
});
