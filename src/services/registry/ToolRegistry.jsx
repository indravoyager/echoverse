import { lazy } from 'react';

/**
 * Helper for dynamic lazy component imports with bundle reload retry.
 */
export const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      if (
        error.message?.includes('Failed to fetch dynamically imported module') ||
        error.message?.includes('Unable to preload CSS') ||
        error.message?.includes('fetch')
      ) {
        window.location.reload();
      }
      throw error;
    }
  });

/**
 * ToolRegistryService (Single Responsibility & Open/Closed Principle)
 * Manages tool metadata registry, component imports, and dynamic resolution.
 */
export class ToolRegistryService {
  constructor(registryMap = {}) {
    this._registry = { ...registryMap };
    this._appModules = import.meta.glob('../../components/apps/*App.jsx');
    this._compiledComponents = null;
  }

  registerTool(id, toolMetadata) {
    this._registry[id] = toolMetadata;
    this._compiledComponents = null;
  }

  getToolMetadata(id) {
    return (
      this._registry[id] || {
        description: 'Custom productivity tool.',
        howToUse: 'Open the tool and follow instructions.',
        features: '• Custom Workflow'
      }
    );
  }

  getToolTagline(id, fallback = 'Productivity Tool') {
    return this._registry[id]?.tagline || fallback;
  }

  getAllTools() {
    return { ...this._registry };
  }

  getAppComponents() {
    if (this._compiledComponents) {
      return this._compiledComponents;
    }

    this._compiledComponents = Object.entries(this._registry).map(([id, appData]) => {
      const loadModule = this._appModules[`../../components/apps/${appData.filename}.jsx`];
      return {
        id,
        filename: appData.filename,
        Component: loadModule
          ? lazyWithRetry(() => loadModule())
          : () => <div className="p-8 text-red-500">Component {appData.filename} not found.</div>
      };
    });

    return this._compiledComponents;
  }
}

export const toolRegistryService = new ToolRegistryService();
