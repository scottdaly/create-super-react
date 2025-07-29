import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Copy template files from source to destination
 * @param {string} templateDir - Source template directory
 * @param {string} destDir - Destination directory
 * @param {Object} variables - Variables to replace in templates
 */
export async function copyTemplate(templateDir, destDir, variables = {}) {
  const entries = await fs.readdir(templateDir, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(templateDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    
    if (entry.isDirectory()) {
      await fs.mkdir(destPath, { recursive: true });
      await copyTemplate(srcPath, destPath, variables);
    } else {
      let content = await fs.readFile(srcPath, "utf8");
      
      // Replace variables
      for (const [key, value] of Object.entries(variables)) {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
      
      await fs.writeFile(destPath, content);
    }
  }
}

/**
 * Apply a template layer (base, auth-google, auth-password)
 * @param {string} layer - Template layer name
 * @param {string} projectRoot - Project root directory
 * @param {Object} variables - Variables to replace
 */
export async function applyTemplateLayer(layer, projectRoot, variables = {}) {
  const templateRoot = path.join(__dirname, "..", "templates", layer);
  
  // Check if template exists
  try {
    await fs.access(templateRoot);
  } catch {
    throw new Error(`Template layer "${layer}" not found`);
  }
  
  // Copy frontend templates if they exist
  const frontendTemplate = path.join(templateRoot, "frontend");
  try {
    await fs.access(frontendTemplate);
    await copyTemplate(frontendTemplate, path.join(projectRoot, "frontend"), variables);
  } catch {
    // No frontend templates in this layer
  }
  
  // Copy backend templates if they exist
  const backendTemplate = path.join(templateRoot, "backend");
  try {
    await fs.access(backendTemplate);
    await copyTemplate(backendTemplate, path.join(projectRoot, "backend"), variables);
  } catch {
    // No backend templates in this layer
  }
}

/**
 * Get CLAUDE.md content for the specified configuration
 * @param {string} projectName - Project name
 * @param {boolean} withAuth - Whether auth is enabled
 * @param {boolean} withPasswordAuth - Whether password auth is enabled
 * @returns {string} CLAUDE.md content
 */
export async function getClaudeMdContent(projectName, withAuth, withPasswordAuth) {
  const templateRoot = path.join(__dirname, "..", "templates", "CLAUDE.md.templates");
  
  let templateFile = "base.md";
  if (withAuth) {
    templateFile = withPasswordAuth ? "auth-password.md" : "auth-google.md";
  }
  
  const templatePath = path.join(templateRoot, templateFile);
  let content = await fs.readFile(templatePath, "utf8");
  
  // Replace variables
  content = content.replace(/{{PROJECT_NAME}}/g, projectName);
  
  return content;
}