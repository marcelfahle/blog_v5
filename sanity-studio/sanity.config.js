import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas'

export default defineConfig({
  name: 'default',
  title: "Marcel's Blog",

  projectId: process.env.SANITY_PROJECT_ID || import.meta.env.VITE_SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || import.meta.env.VITE_SANITY_DATASET || 'production',

  plugins: [deskTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
