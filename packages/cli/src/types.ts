export interface FeatureFile {
  /** Path relative to packages/template/ where the source file lives */
  templateSrc: string;
  /** Path relative to the new project root where the file should be written */
  dest: string;
}

export interface FeatureInjection {
  /** Path relative to the new project root (file must already exist) */
  file: string;
  /** The marker string to find: e.g. "// FEATURE_INJECT: providers_imports" */
  marker: string;
  /** Text to insert immediately after the marker line */
  content: string;
}

export interface FeaturePack {
  name: string;
  /** npm packages to add to dependencies (key: package name, value: version) */
  deps?: Record<string, string>;
  /** npm packages to add to devDependencies */
  devDeps?: Record<string, string>;
  /** Files to copy from template into scaffold */
  files: FeatureFile[];
  /** String injections into already-scaffolded files */
  injections: FeatureInjection[];
  /** Lines to append to .env.example */
  envVars: string[];
}
