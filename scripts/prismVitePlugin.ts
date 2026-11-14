import type { Plugin } from 'vite';
import { synchronizePrismArtifacts } from './prismMechanizer.ts';

export function prismMechanizerVitePlugin(projectRoot: string): Plugin {
  return {
    name: 'prism-mechanizer-vite-plugin',
    buildStart() {
      synchronizePrismArtifacts(projectRoot);
    },
  };
}
