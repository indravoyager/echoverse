/**
 * PersonaService (Single Responsibility & Encapsulation)
 * Handles static and custom persona resolution, lookup, and filtering.
 */
export class PersonaService {
  constructor() {
    this._personaModules = import.meta.glob('../../persona/*.json', { eager: true, import: 'default' });
    this._toolModules = import.meta.glob('../../tools/*.json', { eager: true, import: 'default' });
    
    this._personasOnly = Object.values(this._personaModules);
    this._toolsOnly = Object.values(this._toolModules);
    this._staticPersonas = [...this._personasOnly, ...this._toolsOnly];
  }

  getPersonasOnly() {
    return [...this._personasOnly];
  }

  getToolsOnly() {
    return [...this._toolsOnly];
  }

  getStaticPersonas() {
    return [...this._staticPersonas];
  }

  combinePersonas(customPersonas = []) {
    const validCustom = Array.isArray(customPersonas) ? customPersonas : [];
    return [...this._staticPersonas, ...validCustom];
  }

  findPersonaById(personas, id) {
    if (!Array.isArray(personas) || personas.length === 0) return null;
    if (!id) return personas[0];
    return personas.find((p) => p?.id === id) || personas[0];
  }

  isAppPersona(persona) {
    return Boolean(persona?.isApp);
  }
}

export const personaService = new PersonaService();
