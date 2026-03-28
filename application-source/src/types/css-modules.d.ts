/**
 * CSS Modules Type Declarations
 *
 * Responsibilities:
 * - Allow TypeScript to recognize and type CSS module imports
 * - Map class names to dynamic style objects
 *
 * Boundaries:
 * - No styling logic (handled in .module.css files)
 */

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.css' {
  const content: string;
  export default content;
}
